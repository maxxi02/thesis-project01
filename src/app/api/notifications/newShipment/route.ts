// app/api/notifications/newShipment/route.ts

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
    const { driverEmail, shipmentData } = body;

    if (!driverEmail || !shipmentData) {
      return NextResponse.json(
        { error: "Missing required fields: driverEmail, shipmentData" },
        { status: 400 }
      );
    }

    // Map the frontend data to match the ToShip schema
    const toShipData = {
      productId: shipmentData.product.id,
      productName: shipmentData.product.name,
      productSku: shipmentData.product.sku,
      productImage: shipmentData.product.image || "",
      quantity: shipmentData.product.quantity,
      deliveryPersonnel: {
        id: shipmentData.deliveryPersonnel.id,
        fullName: shipmentData.deliveryPersonnel.fullName,
        email: shipmentData.deliveryPersonnel.email,
        fcmToken: shipmentData.deliveryPersonnel.fcmToken || "",
      },
      destination: shipmentData.customerAddress.destination,
      destinationCoordinates: shipmentData.customerAddress.coordinates || {},
      note: shipmentData.note || "",
      status: shipmentData.status || "pending",
      estimatedDelivery: shipmentData.estimatedDelivery
        ? new Date(shipmentData.estimatedDelivery)
        : undefined,
      markedBy: {
        name: shipmentData.markedBy.name,
        email: shipmentData.markedBy.email,
        role: shipmentData.markedBy.role,
      },
      notifications: [
        {
          type: "assigned",
          createdAt: new Date(),
          read: false,
        },
      ],
    };

    // Validate required fields with proper TypeScript handling
    const validationErrors: string[] = [];

    // Check top-level required fields
    if (!toShipData.productId) validationErrors.push("productId");
    if (!toShipData.productName) validationErrors.push("productName");
    if (!toShipData.productSku) validationErrors.push("productSku");
    if (!toShipData.quantity) validationErrors.push("quantity");
    if (!toShipData.destination) validationErrors.push("destination");

    // Check nested deliveryPersonnel fields
    if (!toShipData.deliveryPersonnel.id)
      validationErrors.push("deliveryPersonnel.id");
    if (!toShipData.deliveryPersonnel.fullName)
      validationErrors.push("deliveryPersonnel.fullName");
    if (!toShipData.deliveryPersonnel.email)
      validationErrors.push("deliveryPersonnel.email");

    // Check nested markedBy fields
    if (!toShipData.markedBy.name) validationErrors.push("markedBy.name");
    if (!toShipData.markedBy.email) validationErrors.push("markedBy.email");
    if (!toShipData.markedBy.role) validationErrors.push("markedBy.role");

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${validationErrors.join(", ")}` },
        { status: 400 }
      );
    }

    // Send SSE notification to the driver first
    const sent = sendEventToUser(driverEmail, {
      type: "NEW_SHIPMENT",
      data: shipmentData,
    });

    // Save to database
    const newShipment = new ToShip(toShipData);
    await newShipment.save();

    return NextResponse.json({
      success: true,
      sent,
      shipmentId: newShipment._id,
      message: "Shipment created and notification sent",
    });
  } catch (error) {
    console.error("Error creating shipment notification:", error);

    // Provide more detailed error information
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
