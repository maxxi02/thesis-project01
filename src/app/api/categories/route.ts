// app/api/categories/route.ts
import { getServerSession } from "@/better-auth/action";
import { connectDB } from "@/database/mongodb";
import { Category } from "@/models/categories";
import { NextRequest, NextResponse } from "next/server";

// GET method for reading categories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    // Build query object
    const query: Record<string, unknown> = {};

    // Add search functionality
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const categories = await Category.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST method for creating new category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const data = await request.json();

    // Validate required fields
    const { name } = data;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid category name" },
        { status: 400 }
      );
    }

    const normalizedName = name.trim();

    // Check if category already exists (case-insensitive)
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${normalizedName}$`, "i") },
    });
    if (existingCategory) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 400 }
      );
    }

    // Create category data with creator info
    const categoryData = {
      name: normalizedName,
      createdBy: {
        name: session.user.name,
        role: session.user.role || "user",
      },
    };

    const category = new Category(categoryData);
    await category.save();

    return NextResponse.json({
      success: true,
      category,
      message: "Category created successfully",
    });
  } catch (error) {
    console.error("Error creating category:", error);

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
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
