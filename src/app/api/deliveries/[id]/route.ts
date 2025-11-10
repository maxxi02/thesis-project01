// app/api/deliveries/[id]/route.ts (updated PATCH handler)
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/database/mongodb";
import { ToShip } from "@/models/toship";
import { ArchivedDelivery } from "@/models/archived-delivery";
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

    // Immediately archive if status is "delivered"
    if (status === "delivered") {
      try {
        // Create archived copy
        await ArchivedDelivery.create({
          originalId: delivery._id,
          productName: delivery.productName,
          productImage: delivery.productImage,
          quantity: delivery.quantity,
          destination: delivery.destination,
          destinationCoordinates: delivery.destinationCoordinates,
          deliveryPersonnel: delivery.deliveryPersonnel,
          status: delivery.status,
          note: delivery.note,
          createdAt: delivery.createdAt,
          startedAt: delivery.startedAt,
          deliveredAt: delivery.deliveredAt,
          estimatedDelivery: delivery.estimatedDelivery,
          markedBy: delivery.markedBy,
          archivedAt: new Date(),
        });
        // Delete original from ToShip
        await ToShip.findByIdAndDelete(delivery._id);
      } catch (archiveError) {
        console.error(
          `Failed to archive delivery ${delivery._id}:`,
          archiveError
        );
        // Don't fail the whole request; log and continue
      }
    }

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

    // Return the updated delivery (for "delivered", it might be archived, but we return a copy for response)
    const responseDelivery =
      status === "delivered"
        ? {
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
            estimatedDelivery: delivery.estimatedDelivery || undefined,
            markedBy: {
              name: delivery.markedBy.name,
              email: delivery.markedBy.email,
            },
          }
        : {
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
            estimatedDelivery: delivery.estimatedDelivery || undefined,
            markedBy: {
              name: delivery.markedBy.name,
              email: delivery.markedBy.email,
            },
          };

    return NextResponse.json({
      message: "Delivery status updated successfully",
      delivery: responseDelivery,
    });
  } catch (error) {
    console.error("Error updating delivery status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
