import { connectDB } from "@/database/mongodb";
import { Product } from "@/models/product";

import { type NextRequest, NextResponse } from "next/server";

// Enhanced mock database with more complete product information
const objectProducts = [
  {
    objectName: "Class 2",
    name: "Whey Protein Isolate",
    sku: "WPI-001",
    description: "High-quality protein powder for muscle recovery",
    price: 39.99,
    stock: 150,
    category: "Supplements",
    image: "/placeholder.svg?height=200&width=200",
    barcode: "123456789012",
  },
  {
    objectName: "Pogi",
    name: "Whey Protein Isolate",
    sku: "WPI-001",
    description: "High-quality protein powder for muscle recovery",
    price: 39.99,
    stock: 150,
    category: "Supplements",
    image: "/placeholder.svg?height=200&width=200",
    barcode: "123456789012",
  },
  {
    objectName: "creatine",
    name: "Active Creatine Monohydrate",
    sku: "CRE-001",
    description:
      "Pure creatine monohydrate powder for muscle strength and performance",
    price: 29.99,
    stock: 200,
    category: "Supplements",
    image: "/placeholder.svg?height=200&width=200",
    barcode: "745125547008",
  },
  {
    objectName: "pre-workout",
    name: "Pre-Workout Energy",
    sku: "PWO-001",
    description: "Advanced formula for energy and focus during workouts",
    price: 34.99,
    stock: 100,
    category: "Supplements",
    image: "/placeholder.svg?height=200&width=200",
    barcode: "987654321098",
  },
  {
    objectName: "amino acids",
    name: "BCAA Recovery",
    sku: "BCAA-001",
    description: "Branch Chain Amino Acids for muscle recovery and endurance",
    price: 24.99,
    stock: 120,
    category: "Supplements",
    image: "/placeholder.svg?height=200&width=200",
    barcode: "456789123456",
  },
  {
    objectName: "water bottle",
    name: "Hydration Sports Bottle",
    sku: "HYD-001",
    description:
      "Durable 750ml water bottle for fitness and outdoor activities",
    price: 19.99,
    stock: 300,
    category: "Accessories",
    image: "/placeholder.svg?height=200&width=200",
    barcode: "234567890123",
  },
  {
    objectName: "shaker",
    name: "Protein Shaker Bottle",
    sku: "SHK-001",
    description:
      "Leak-proof mixing bottle with wire whisk for smooth protein shakes",
    price: 14.99,
    stock: 250,
    category: "Accessories",
    image: "/placeholder.svg?height=200&width=200",
    barcode: "345678901234",
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ className: string }> }
) {
  const { className } = await params;

  try {
    await connectDB();

    // Step 1: Check if product already exists in database by name or description
    const existingProduct = await Product.findOne({
      $or: [
        { name: { $regex: className, $options: "i" } },
        { description: { $regex: className, $options: "i" } },
        { category: { $regex: className, $options: "i" } },
      ],
    });

    if (existingProduct) {
      return NextResponse.json({
        found: true,
        source: "database",
        product: {
          _id: existingProduct._id,
          name: existingProduct.name,
          sku: existingProduct.sku,
          description: existingProduct.description,
          price: existingProduct.price,
          stock: existingProduct.stock,
          category: existingProduct.category,
          status: existingProduct.status,
          image: existingProduct.image,
          className: className,
        },
      });
    }

    // Step 2: Check mock database for object mappings
    const mockProduct = objectProducts.find((p) =>
      p.objectName.toLowerCase().includes(className.toLowerCase())
    );

    if (mockProduct) {
      // Check if a product with this SKU already exists
      const existingBySku = await Product.findOne({ sku: mockProduct.sku });

      if (existingBySku) {
        return NextResponse.json({
          found: true,
          source: "database",
          product: {
            _id: existingBySku._id,
            name: existingBySku.name,
            sku: existingBySku.sku,
            description: existingBySku.description,
            price: existingBySku.price,
            stock: existingBySku.stock,
            category: existingBySku.category,
            status: existingBySku.status,
            image: existingBySku.image,
            className: className,
          },
        });
      }

      // Return mock product data for potential creation
      return NextResponse.json({
        found: true,
        source: "suggestion",
        product: {
          name: mockProduct.name,
          sku: mockProduct.sku,
          description: mockProduct.description,
          price: mockProduct.price,
          stock: mockProduct.stock,
          category: mockProduct.category,
          image: mockProduct.image,
          className: className,
          barcode: mockProduct.barcode,
        },
        suggestion: true,
      });
    }

    // Step 3: Generate a generic product suggestion based on detected object
    const capitalizedName = className
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return NextResponse.json({
      found: false,
      source: "generated",
      product: {
        name: capitalizedName,
        sku: `${className.toUpperCase().replace(/\s+/g, "-")}-001`,
        description: `${capitalizedName} - Add your product description here`,
        price: 0,
        stock: 0,
        category: "General",
        image: "/placeholder.svg?height=200&width=200",
        className: className,
      },
      suggestion: true,
    });
  } catch (error) {
    console.error("Error in object detection API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
