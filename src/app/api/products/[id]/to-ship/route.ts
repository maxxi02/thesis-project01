import { NextRequest, NextResponse } from "next/server";
import { sendEventToUser } from "@/sse/sse";
import { geocodeAddress } from "@/helpers/geocoding";
import { getServerSession } from "@/better-auth/action";
import { connectDB } from "@/database/mongodb";
import { Product } from "@/models/product";
import { ToShip } from "@/models/toship";
import { sendNotificationToDriver } from "@/sse/notification";
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

    const allowedRoles = ["admin", "cashier"];
    if (!allowedRoles.includes(userSession.user.role?.toLowerCase() || "")) {
      return NextResponse.json(
        { error: "Insufficient permissions to create shipments" },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();

    const {
      quantity,
      deliveryPersonnel,
      destination,
      note = "",
      markedBy,
      estimatedDelivery,
      coordinates, // Get coordinates from frontend
    } = body;

    // Validation
    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Valid quantity is required" },
        { status: 400 }
      );
    }

    if (!deliveryPersonnel?.id || !destination) {
      return NextResponse.json(
        { error: "Delivery personnel and destination are required" },
        { status: 400 }
      );
    }

    // Start transaction to prevent duplicate deliveries
    session.startTransaction();

    // Find and lock the product
    const product = await Product.findById(id).session(session);
    if (!product) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check stock
    if (product.stock < quantity) {
      await session.abortTransaction();
      return NextResponse.json(
        {
          error: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`,
        },
        { status: 400 }
      );
    }

    // Update product stock immediately within transaction
    product.stock -= quantity;
    product.updatedBy = {
      name: markedBy.name,
      role: markedBy.role,
    };
    await product.save({ session });

    // Use coordinates from frontend or fallback to geocoding
    let finalCoordinates = coordinates;
    if (!finalCoordinates) {
      try {
        finalCoordinates = await geocodeAddress(destination.trim());
        console.log(`Geocoding result:`, finalCoordinates);
      } catch (geocodeError) {
        console.error("Geocoding failed:", geocodeError);
      }
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
        fcmToken: deliveryPersonnel.fcmToken || "",
      },
      destination: destination.trim(),
      destinationCoordinates: finalCoordinates
        ? {
            lat: finalCoordinates.lat,
            lng: finalCoordinates.lng,
          }
        : null,
      note: note.trim(),
      status: "pending",
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
      markedBy: {
        name: markedBy.name.trim(),
        email: markedBy.email.trim(),
        role: markedBy.role.trim(),
      },
      notifications: [
        {
          type: "assigned",
          read: false,
        },
      ],
    });

    await toShipItem.save({ session });

    // Commit transaction
    await session.commitTransaction();

    // Send notifications AFTER successful transaction (non-blocking)
    setImmediate(async () => {
      try {
        if (deliveryPersonnel.fcmToken) {
          await sendNotificationToDriver(deliveryPersonnel.fcmToken, {
            productName: product.name,
            quantity,
            destination,
            estimatedDelivery: estimatedDelivery
              ? new Date(estimatedDelivery)
              : undefined,
          });
        }
      } catch (notificationError) {
        console.error("Failed to send FCM notification:", notificationError);
      }

      try {
        sendEventToUser(deliveryPersonnel.email, {
          type: "NEW_ASSIGNMENT",
          data: {
            assignmentId: toShipItem._id.toString(),
            productName: product.name,
            productImage: product.image,
            quantity: quantity,
            destination: destination,
            destinationCoordinates: finalCoordinates,
            note: note,
            assignedBy: markedBy.name,
          },
        });
      } catch (sseError) {
        console.error("Error sending SSE to driver:", sseError);
      }
    });

    return NextResponse.json({
      message: "Product marked for shipment successfully",
      shipmentId: toShipItem._id.toString(),
      toShipItem: {
        id: toShipItem._id,
        productName: toShipItem.productName,
        quantity: toShipItem.quantity,
        deliveryPersonnel: toShipItem.deliveryPersonnel,
        destination: toShipItem.destination,
        destinationCoordinates: toShipItem.destinationCoordinates,
        status: toShipItem.status,
        estimatedDelivery: toShipItem.estimatedDelivery,
        createdAt: toShipItem.createdAt,
      },
      updatedStock: product.stock,
      geocodingSuccess: !!finalCoordinates,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error marking product for shipment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}
