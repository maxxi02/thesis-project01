// app/api/products/[id]/sold/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "@/better-auth/action";
import { connectDB } from "@/database/mongodb";
import { Product } from "@/models/product";
import { ProductHistory } from "@/models/product-history";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const { quantityToDeduct, notes } = await request.json();

    // Validate input
    if (!quantityToDeduct || quantityToDeduct <= 0) {
      return NextResponse.json(
        { error: "Quantity to deduct must be greater than 0" },
        { status: 400 }
      );
    }

    // Start a transaction to ensure data consistency
    const transactionSession = await mongoose.startSession();

    try {
      await transactionSession.withTransaction(async () => {
        // Find the product
        const product = await Product.findById(id).session(transactionSession);

        if (!product) {
          throw new Error("Product not found");
        }

        // Check if we have enough stock
        if (product.stock < quantityToDeduct) {
          throw new Error(
            `Insufficient stock. Available: ${product.stock}, Requested: ${quantityToDeduct}`
          );
        }

        // Calculate new stock
        const newStock = product.stock - quantityToDeduct;
        const totalAmount = product.price * quantityToDeduct;

        // Update product stock
        await Product.findByIdAndUpdate(
          id,
          {
            stock: newStock,
            status: newStock === 0 ? "out-of-stock" : product.status,
            updatedBy: {
              name: session.user.name,
              role: session.user.role || "user",
            },
          },
          { session: transactionSession }
        );

        // Create product history record
        const historyRecord = new ProductHistory({
          productId: product._id,
          productName: product.name,
          productSku: product.sku,
          category: product.category,
          quantitySold: quantityToDeduct,
          unitPrice: product.price,
          totalAmount,
          soldBy: {
            name: session.user.name,
            role: session.user.role || "user",
          },
          notes: notes || "",
          saleType: "manual_deduction",
        });

        await historyRecord.save({ session: transactionSession });
      });

      // Fetch updated product data
      const updatedProduct = await Product.findById(id);

      return NextResponse.json({
        success: true,
        message: `Successfully deducted ${quantityToDeduct} units from ${updatedProduct.name}`,
        product: updatedProduct,
        deductedQuantity: quantityToDeduct,
      });
    } finally {
      await transactionSession.endSession();
    }
  } catch (error) {
    console.error("Error deducting product:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to deduct product";
    const statusCode = errorMessage.includes("not found")
      ? 404
      : errorMessage.includes("Insufficient stock")
      ? 400
      : 500;

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
