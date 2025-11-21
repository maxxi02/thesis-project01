import { connectDB } from "@/database/mongodb";
import { Product } from "@/models/product";

import { type NextRequest, NextResponse } from "next/server";

// Enhanced mock database with more complete product information
const objectProducts = [
  {
    objectName: "Rojan Notorio",
    name: "Rojan Notorio",
    sku: "RN-001",
    description: "Rojan mapagmahal.",
    price: 39.99,
    stock: 150,
    category: "People",
    image: "/placeholder.svg?height=200&width=200",
    barcode: "123456789012",
  },
  {
    objectName: "Classic Wooden Hammer",
    name: "Classic Wooden Hammer",
    sku: "HMR-001",
    description: "Durable wooden handle hammer for construction and carpentry work",
    price: 299.99,
    stock: 75,
    category: "Tools",
    image: "/placeholder.svg?height=200&width=200",
    barcode: "234567890123",
  },
  {
    objectName: "Orange Philip Screwdriver",
    name: "Orange Philip Screwdriver",
    sku: "SCRW-001",
    description: "Professional-grade Philip head screwdriver with ergonomic orange grip",
    price: 149.99,
    stock: 200,
    category: "Tools",
    image: "/placeholder.svg?height=200&width=200",
    barcode: "345678901234",
  },
  {
    objectName: "Blue Flat Screwdriver",
    name: "Blue Flat Screwdriver",
    sku: "SCRW-002",
    description: "Heavy-duty flat head screwdriver with comfortable blue handle",
    price: 129.99,
    stock: 180,
    category: "Tools",
    image: "/placeholder.svg?height=200&width=200",
    barcode: "456789012345",
  },
  {
    objectName: "Blue Eco Bag",
    name: "Blue Eco Bag",
    sku: "BAG-001",
    description: "Reusable eco-friendly shopping bag, durable and water-resistant",
    price: 89.99,
    stock: 300,
    category: "Accessories",
    image: "/placeholder.svg?height=200&width=200",
    barcode: "567890123456",
  },
  {
    objectName: "Athlene Creatine Powder",
    name: "Athlene Creatine Powder",
    sku: "CRE-001",
    description: "Premium creatine monohydrate for enhanced muscle strength and performance",
    price: 899.99,
    stock: 120,
    category: "Supplements",
    image: "/placeholder.svg?height=200&width=200",
    barcode: "678901234567",
  },
  // Additional mock data
  {
    objectName: "hammer",
    name: "Standard Claw Hammer",
    sku: "HMR-002",
    description: "Multi-purpose claw hammer with steel head and rubber grip",
    price: 349.99,
    stock: 100,
    category: "Tools",
    image: "/placeholder.svg?height=200&width=200",
    barcode: "789012345678",
  },
  {
    objectName: "screwdriver",
    name: "Screwdriver Set",
    sku: "SCRW-003",
    description: "6-piece precision screwdriver set for electronics and small repairs",
    price: 499.99,
    stock: 85,
    category: "Tools",
    image: "/placeholder.svg?height=200&width=200",
    barcode: "890123456789",
  },
  {
    objectName: "eco bag",
    name: "Reusable Shopping Bag",
    sku: "BAG-002",
    description: "Large capacity eco-friendly bag with reinforced handles",
    price: 99.99,
    stock: 250,
    category: "Accessories",
    image: "/placeholder.svg?height=200&width=200",
    barcode: "901234567890",
  },
  {
    objectName: "creatine",
    name: "Micronized Creatine",
    sku: "CRE-002",
    description: "Ultra-fine creatine powder for better absorption and mixing",
    price: 799.99,
    stock: 95,
    category: "Supplements",
    image: "/placeholder.svg?height=200&width=200",
    barcode: "012345678901",
  },
  {
    objectName: "pliers",
    name: "Professional Pliers Set",
    sku: "PLR-001",
    description: "Heavy-duty pliers with wire cutting functionality",
    price: 599.99,
    stock: 60,
    category: "Tools",
    image: "/placeholder.svg?height=200&width=200",
    barcode: "112233445566",
  },
  {
    objectName: "wrench",
    name: "Adjustable Wrench",
    sku: "WRN-001",
    description: "Chrome-plated adjustable wrench for various bolt sizes",
    price: 399.99,
    stock: 110,
    category: "Tools",
    image: "/placeholder.svg?height=200&width=200",
    barcode: "223344556677",
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