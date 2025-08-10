// app/api/deliveries/[id]/route.ts
import { getServerSession } from "@/better-auth/action";
import { ToShip } from "@/models/toship";
import { connectDB } from "@/database/mongodb";
import { sendEventToUser } from "@/sse/sse";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    const { id } = await context.params;

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Validate status values
    const validStatuses = ["pending", "in-transit", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    await connectDB();

    const delivery = await ToShip.findById(id);

    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    // Check authorization - driver can only update their own deliveries
    if (delivery.deliveryPersonnel?.email !== session.user.email) {
      return NextResponse.json(
        { error: "Unauthorized: You can only update your own deliveries" },
        { status: 403 }
      );
    }

    const oldStatus = delivery.status;

    // Update the delivery status with timestamp
    delivery.status = status;
    delivery.updatedAt = new Date();

    if (status === "in-transit" && oldStatus === "pending") {
      delivery.startedAt = new Date();
    } else if (status === "delivered" && oldStatus === "in-transit") {
      delivery.deliveredAt = new Date();
      delivery.completedAt = new Date(); // Auto-deletion timer starts
    } else if (status === "cancelled") {
      delivery.cancelledAt = new Date();
      delivery.completedAt = new Date(); // Auto-deletion timer starts
    }
    
    // Add notification to the delivery record
    delivery.notifications = delivery.notifications || [];
    delivery.notifications.push({
      type: "status_update",
      createdAt: new Date(),
      read: false,
      message: `Status changed from ${oldStatus} to ${status}`,
      updatedBy: {
        name: session.user.name || session.user.email,
        email: session.user.email,
      },
    });

    await delivery.save();

    try {
      if (delivery.markedBy?.email) {
        sendEventToUser(delivery.markedBy.email, {
          type: "DELIVERY_STATUS_UPDATE",
          data: {
            assignmentId: delivery._id.toString(),
            productName: delivery.productName,
            driverName: delivery.deliveryPersonnel.fullName,
            driverEmail: delivery.deliveryPersonnel.email,
            oldStatus,
            newStatus: status,
            destination: delivery.destination,
            updatedAt: delivery.updatedAt.toISOString(),
            updatedBy: session.user.name || session.user.email,
          },
        });
      }

      // Send delivery completion notification
      if (status === "delivered") {
        sendEventToUser(delivery.markedBy.email, {
          type: "DELIVERY_COMPLETED",
          data: {
            assignmentId: delivery._id.toString(),
            productName: delivery.productName,
            driverName: delivery.deliveryPersonnel.fullName,
            destination: delivery.destination,
            deliveredAt: delivery.deliveredAt?.toISOString(),
          },
        });
      }
    } catch (sseError) {
      console.error("Error sending SSE notification:", sseError);
    }

    // Return updated delivery data
    const responseData = {
      id: delivery._id.toString(),
      product: {
        name: delivery.productName,
        image: delivery.productImage,
        quantity: delivery.quantity,
      },
      customerAddress: {
        destination: delivery.destination,
      },
      driver: {
        fullName: delivery.deliveryPersonnel.fullName,
        email: delivery.deliveryPersonnel.email,
      },
      status: delivery.status,
      note: delivery.note,
      assignedDate: delivery.createdAt.toISOString(),
      updatedAt: delivery.updatedAt.toISOString(),
      markedBy: delivery.markedBy,
      startedAt: delivery.startedAt?.toISOString(),
      deliveredAt: delivery.deliveredAt?.toISOString(),
      cancelledAt: delivery.cancelledAt?.toISOString(),
    };

    return NextResponse.json({
      message: "Delivery updated successfully",
      delivery: responseData,
    });
  } catch (error) {
    console.error("Error updating delivery:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    const { id } = await context.params;

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const delivery = await ToShip.findById(id);

    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    // Check authorization - driver can only delete their own deliveries
    if (delivery.deliveryPersonnel?.email !== session.user.email) {
      return NextResponse.json(
        { error: "Unauthorized: You can only delete your own deliveries" },
        { status: 403 }
      );
    }

    // Only allow deletion of completed/cancelled deliveries
    if (delivery.status !== "delivered" && delivery.status !== "cancelled") {
      return NextResponse.json(
        { error: "Can only delete completed or cancelled deliveries" },
        { status: 400 }
      );
    }

    // Soft delete by setting archivedAt
    delivery.archivedAt = new Date();
    await delivery.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting delivery:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
