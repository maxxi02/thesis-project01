// app/api/products/route.ts
import { getServerSession } from "@/better-auth/action";
import { connectDB } from "@/database/mongodb";
import { Product } from "@/models/product";
import { NextRequest, NextResponse } from "next/server";

// GET method for reading products with search and filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    // Build query object
    const query: Record<string, unknown> = {};

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Add category filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Add status filter
    if (status && status !== "all") {
      query.status = status;
    }

    const products = await Product.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST method for creating new product
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const data = await request.json();

    // Validate required fields
    const { name, sku, price, stock, category } = data;
    if (
      !name ||
      !sku ||
      price === undefined ||
      stock === undefined ||
      !category
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingProduct) {
      return NextResponse.json(
        { error: "SKU already exists" },
        { status: 400 }
      );
    }

    // Create product data with creator info
    const productData = {
      ...data,
      sku: sku.toUpperCase(),
      createdBy: {
        name: session.user.name,
        role: session.user.role || "user",
      },
    };

    const product = new Product(productData);
    await product.save();

    return NextResponse.json({
      success: true,
      product,
      message: "Product created successfully",
    });
  } catch (error) {
    console.error("Error creating product:", error);

    // Handle mongoose validation errors
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as { name: string }).name === "ValidationError" &&
      "errors" in error
    ) {
      const errors = Object.values(
        (error as { errors: Record<string, { message: string }> }).errors
      ).map((err) =>
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message: string }).message
          : "Unknown error"
      );
      return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
