// app/api/products/[id]/sold/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/better-auth/action";
import { connectDB } from "@/database/mongodb";
import { Product } from "@/models/product";
import { ProductHistory } from "@/models/product-history"; // Add this import
import mongoose from "mongoose";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession();

  try {
    const userSession = await getServerSession();
    if (!userSession?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();

    const { quantityToDeduct, notes = "" } = body;

    // Validation
    if (!quantityToDeduct || quantityToDeduct <= 0) {
      return NextResponse.json(
        { error: "Valid quantity is required" },
        { status: 400 }
      );
    }

    // Start transaction
    session.startTransaction();

    // Find and lock the product
    const product = await Product.findById(id).session(session);
    if (!product) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check stock
    if (product.stock < quantityToDeduct) {
      await session.abortTransaction();
      return NextResponse.json(
        {
          error: `Insufficient stock. Available: ${product.stock}, Requested: ${quantityToDeduct}`,
        },
        { status: 400 }
      );
    }

    // Update product stock
    product.stock -= quantityToDeduct;
    product.updatedBy = {
      name: userSession.user.name,
      role: userSession.user.role || "user",
    };
    await product.save({ session });

    // ✅ ADDED: Create product history entry for the direct sale
    const productHistoryEntry = new ProductHistory({
      productId: product._id,
      productName: product.name,
      productSku: product.sku,
      category: product.category,
      quantitySold: quantityToDeduct,
      unitPrice: product.price,
      totalAmount: product.price * quantityToDeduct,
      saleDate: new Date(),
      soldBy: {
        name: userSession.user.name,
        email: userSession.user.email,
      },
      notes: notes || `Sold via Product Management - ${product.name}`,
      saleType: "sale",
      status: "completed", // Direct sales are immediately completed
    });

    await productHistoryEntry.save({ session });

    // Commit transaction
    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: "Product sale recorded successfully",
      product: {
        id: product._id,
        name: product.name,
        stock: product.stock,
      },
      historyId: productHistoryEntry._id.toString(), // ✅ ADDED: Return history ID
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error processing product sale:", error);
    return NextResponse.json(
      { error: "Failed to process product sale" },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}
