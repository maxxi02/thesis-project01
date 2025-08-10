import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/database/mongodb";
import { Product } from "@/models/product";
import { ToShip } from "@/models/toship";
import { getServerSession } from "@/better-auth/action";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();

    // Await the params Promise
    const params = await props.params;
    const { id } = params;

    const body = await request.json();

    const {
      quantity,
      deliveryPersonnel,
      destination,
      note = "",
      message = "",
      estimatedDelivery,
      markedBy,
    } = body;

    // Validation (same as before)
    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Valid quantity is required" },
        { status: 400 }
      );
    }

    // Find the product
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check stock
    if (product.stock < quantity) {
      return NextResponse.json(
        {
          error: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`,
        },
        { status: 400 }
      );
    }

    // Create ToShip record
    const toShipItem = new ToShip({
      productId: product._id,
      productName: product.name,
      productImage: product.image,
      productSku: product.sku,
      quantity,
      deliveryPersonnel: {
        id: deliveryPersonnel.id,
        fullName: deliveryPersonnel.fullName.trim(),
        email: deliveryPersonnel.email.trim().toLowerCase(),
      },
      destination: destination.trim(),
      note: note.trim(),
      message: message.trim(),
      status: "pending",
      estimatedDelivery: estimatedDelivery
        ? new Date(estimatedDelivery)
        : undefined,
      markedBy: {
        name: markedBy.name.trim(),
        email: markedBy.email.trim(),
        role: markedBy.role.trim(),
      },
    });

    // Save the ToShip item
    await toShipItem.save();

    // Update product stock
    product.stock -= quantity;
    product.updatedBy = {
      name: markedBy.name,
      role: markedBy.role,
    };
    await product.save();

    return NextResponse.json({
      message: "Product marked for shipment successfully",
      toShipItem: {
        id: toShipItem._id,
        productName: toShipItem.productName,
        quantity: toShipItem.quantity,
        deliveryPersonnel: toShipItem.deliveryPersonnel,
        destination: toShipItem.destination,
        status: toShipItem.status,
        createdAt: toShipItem.createdAt,
      },
      updatedStock: product.stock,
    });
  } catch (error) {
    console.error("Error marking product for shipment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
