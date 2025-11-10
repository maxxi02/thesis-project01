// app/api/notifications/newShipment/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/better-auth/action";
import { sendEventToUser } from "@/sse/sse";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { driverEmail, shipmentData } = body;

    if (!driverEmail || !shipmentData) {
      return NextResponse.json(
        { error: "Missing required fields: driverEmail, shipmentData" },
        { status: 400 }
      );
    }

    // ONLY send SSE notification - DO NOT create database record
    const sent = sendEventToUser(driverEmail, {
      type: "NEW_ASSIGNMENT",
      data: {
        assignmentId: shipmentData.id,
        productName: shipmentData.product.name,
        productImage: shipmentData.product.image,
        quantity: shipmentData.product.quantity,
        destination: shipmentData.customerAddress.destination,
        coordinates: shipmentData.customerAddress.coordinates,
        note: shipmentData.note,
        assignedBy: shipmentData.markedBy.name,
        estimatedDelivery: shipmentData.estimatedDelivery,
      },
    });

    return NextResponse.json({
      success: true,
      sent,
      message: "Notification sent successfully",
    });
  } catch (error) {
    console.error("Error sending notification:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
