import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/database/mongodb";
import { ToShip } from "@/models/toship";
import { getServerSession } from "@/better-auth/action";
import { sendEventToUser } from "@/sse/sse";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { deliveryId, newStatus, driverEmail } = body;

    if (!deliveryId || !newStatus || !driverEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update the delivery status
    const updatedDelivery = await ToShip.findByIdAndUpdate(
      deliveryId,
      {
        status: newStatus,
        ...(newStatus === "in-transit" ? { startedAt: new Date() } : {}),
        ...(newStatus === "delivered" ? { deliveredAt: new Date() } : {}),
        ...(newStatus === "cancelled" ? { cancelledAt: new Date() } : {}),
      },
      { new: true }
    );

    if (!updatedDelivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    // Notify admin and driver
    sendEventToUser(driverEmail, {
      type: "DELIVERY_STATUS_UPDATE",
      data: {
        deliveryId,
        newStatus,
        productName: updatedDelivery.product.name,
      },
    });

    sendEventToUser(updatedDelivery.markedBy.email, {
      type: "DELIVERY_STATUS_UPDATE",
      data: {
        deliveryId,
        newStatus,
        productName: updatedDelivery.product.name,
        driverName: updatedDelivery.driver.fullName,
      },
    });

    return NextResponse.json({
      success: true,
      delivery: updatedDelivery,
    });
  } catch (error) {
    console.error("Error updating delivery status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
