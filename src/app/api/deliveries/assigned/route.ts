// app/api/deliveries/assigned/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/database/mongodb";
import { ToShip } from "@/models/toship";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const driverEmail = searchParams.get("driverEmail");

    if (!driverEmail) {
      return NextResponse.json(
        { error: "Driver email is required" },
        { status: 400 }
      );
    }

    const assignments = await ToShip.find({
      "deliveryPersonnel.email": driverEmail.toLowerCase(),
      status: { $in: ["pending", "in-transit"] },
    }).sort({ createdAt: -1 });

    if (!assignments || assignments.length === 0) {
      return NextResponse.json(
        { error: "No assignments found" },
        { status: 404 }
      );
    }

    const formattedAssignments = assignments.map((assignment) => ({
      id: assignment._id.toString(),
      product: {
        name: assignment.productName,
        image: assignment.productImage,
        quantity: assignment.quantity,
      },
      customerAddress: {
        destination: assignment.destination,
        coordinates: assignment.destinationCoordinates
          ? {
              lat: assignment.destinationCoordinates.lat,
              lng: assignment.destinationCoordinates.lng,
            }
          : undefined,
      },
      driver: {
        fullName: assignment.deliveryPersonnel.fullName,
        email: assignment.deliveryPersonnel.email,
      },
      status: assignment.status,
      note: assignment.note || undefined,
      assignedDate: assignment.createdAt,
      startedAt: assignment.startedAt || undefined,
      deliveredAt: assignment.deliveredAt || undefined,
      estimatedDelivery: assignment.estimatedDelivery || undefined, // Add this line
      markedBy: {
        name: assignment.markedBy.name,
        email: assignment.markedBy.email,
      },
    }));

    return NextResponse.json(formattedAssignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
