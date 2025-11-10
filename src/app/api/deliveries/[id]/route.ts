// app/api/deliveries/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/database/mongodb";
import { ToShip } from "@/models/toship";
import { sendEventToUser } from "@/sse/sse";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const { status, driverEmail } = await request.json();

    if (!status || !driverEmail) {
      return NextResponse.json(
        { error: "Status and driver email are required" },
        { status: 400 }
      );
    }

    const delivery = await ToShip.findById(id);

    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    if (
      delivery.deliveryPersonnel.email.toLowerCase() !==
      driverEmail.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Unauthorized: You can only update your own deliveries" },
        { status: 403 }
      );
    }

    const previousStatus = delivery.status;
    delivery.status = status;

    if (status === "in-transit" && !delivery.startedAt) {
      delivery.startedAt = new Date();
    }

    if (status === "delivered" && !delivery.deliveredAt) {
      delivery.deliveredAt = new Date();
    }

    await delivery.save();

    // Send SSE notifications
    try {
      sendEventToUser(delivery.markedBy.email, {
        type: "DELIVERY_STATUS_UPDATE",
        data: {
          assignmentId: delivery._id.toString(),
          productName: delivery.productName,
          driverName: delivery.deliveryPersonnel.fullName,
          previousStatus,
          newStatus: status,
          destination: delivery.destination,
        },
      });
    } catch (sseError) {
      console.error("Error sending SSE notification:", sseError);
    }

    return NextResponse.json({
      message: "Delivery status updated successfully",
      delivery: {
        id: delivery._id.toString(),
        product: {
          name: delivery.productName,
          image: delivery.productImage,
          quantity: delivery.quantity,
        },
        customerAddress: {
          destination: delivery.destination,
          coordinates: delivery.destinationCoordinates
            ? {
                lat: delivery.destinationCoordinates.lat,
                lng: delivery.destinationCoordinates.lng,
              }
            : undefined,
        },
        driver: {
          fullName: delivery.deliveryPersonnel.fullName,
          email: delivery.deliveryPersonnel.email,
        },
        status: delivery.status,
        note: delivery.note || undefined,
        assignedDate: delivery.createdAt,
        startedAt: delivery.startedAt || undefined,
        deliveredAt: delivery.deliveredAt || undefined,
        estimatedDelivery: delivery.estimatedDelivery || undefined, // Add this line
        markedBy: {
          name: delivery.markedBy.name,
          email: delivery.markedBy.email,
        },
      },
    });
  } catch (error) {
    console.error("Error updating delivery status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
