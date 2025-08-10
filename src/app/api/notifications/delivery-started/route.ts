// app/api/notifications/delivery-started/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/database/mongodb";
import { ToShip } from "@/models/toship";
import { getServerSession } from "@/better-auth/action";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { deliveryId, driverName, driverEmail } = body;

    // Validation
    if (!deliveryId || !driverName || !driverEmail) {
      return NextResponse.json(
        {
          error: "Missing required fields: deliveryId, driverName, driverEmail",
        },
        { status: 400 }
      );
    }

    // Find the delivery assignment
    const delivery = await ToShip.findById(deliveryId);
    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery assignment not found" },
        { status: 404 }
      );
    }

    // Verify the driver matches
    if (delivery.deliveryPersonnel.email !== driverEmail) {
      return NextResponse.json(
        { error: "Driver email mismatch" },
        { status: 403 }
      );
    }

    // Update the delivery with started timestamp if not already set
    if (!delivery.startedAt) {
      delivery.startedAt = new Date();
      delivery.status = "in-transit";
      await delivery.save();
    }

    console.log(
      `Delivery started - ID: ${deliveryId}, Driver: ${driverName}, Product: ${delivery.productName}`
    );

    return NextResponse.json({
      message: "Delivery started notification processed successfully",
      delivery: {
        id: delivery._id,
        productName: delivery.productName,
        driverName: delivery.deliveryPersonnel.fullName,
        destination: delivery.destination,
        status: delivery.status,
        startedAt: delivery.startedAt,
      },
    });
  } catch (error) {
    console.error("Error processing delivery started notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
