import { NextRequest, NextResponse } from "next/server";
import { sendEventToUser } from "@/sse/sse";
import { geocodeAddress } from "@/helpers/geocoding";
import { getServerSession } from "@/better-auth/action";
import { connectDB } from "@/database/mongodb";
import { Product } from "@/models/product";
import { ToShip } from "@/models/toship";
import { sendNotificationToDriver } from "@/sse/notification";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["admin", "cashier"];
    if (!allowedRoles.includes(session.user.role?.toLowerCase() || "")) {
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

    const coordinates = await geocodeAddress(destination.trim());
    console.log(`Geocoding result:`, coordinates);
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
        fcmToken: deliveryPersonnel.fcmToken || "", // Add FCM token if available
      },
      destination: destination.trim(),
      destinationCoordinates: coordinates
        ? {
            lat: coordinates.lat,
            lng: coordinates.lng,
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

    // Save the ToShip item
    await toShipItem.save();
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

        // Update notification status
        toShipItem.notifications.push({
          type: "notification_sent",
          read: false,
        });
        await toShipItem.save();
      }
    } catch (notificationError) {
      console.error("Failed to send notification:", notificationError);
      // Continue even if notification fails
    }
    // Update product stock
    product.stock -= quantity;
    product.updatedBy = {
      name: markedBy.name,
      role: markedBy.role,
    };

    try {
      // Notify the assigned driver about new assignment
      const driverNotified = sendEventToUser(deliveryPersonnel.email, {
        type: "NEW_ASSIGNMENT",
        data: {
          assignmentId: toShipItem._id.toString(),
          productName: product.name,
          productImage: product.image,
          quantity: quantity,
          destination: destination,
          destinationCoordinates: coordinates,
          note: note,
          assignedBy: markedBy.name,
        },
      });

      console.log(
        `Driver notification sent to ${deliveryPersonnel.email}:`,
        driverNotified
      );
    } catch (sseError) {
      console.error("Error sending SSE to driver:", sseError);
    }

    return NextResponse.json({
      message: "Product marked for shipment successfully",
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
      geocodingSuccess: !!coordinates,
    });
  } catch (error) {
    console.error("Error marking product for shipment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
