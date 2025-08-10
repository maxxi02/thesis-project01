// app/api/deliveries/assigned/route.ts
import { getServerSession } from "@/better-auth/action";
import { ToShip } from "@/models/toship";
import { connectDB } from "@/database/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const driverEmail = searchParams.get("driverEmail");

    if (!driverEmail) {
      return NextResponse.json(
        { error: "Driver email is required" },
        { status: 400 }
      );
    }

    const deliveries = await ToShip.find({
      "deliveryPersonnel.email": driverEmail,
      status: { $in: ["pending", "in-transit", "delivered", "cancelled"] },
    }).sort({ createdAt: -1 });

    const formattedDeliveries = deliveries.map((delivery) => ({
      id: delivery._id.toString(),
      product: {
        name: delivery.productName,
        image: delivery.productImage,
        quantity: delivery.quantity,
      },
      customerAddress: {
        destination: delivery.destination,
        // INCLUDE COORDINATES
        coordinates: delivery.destinationCoordinates
          ? {
              lat: delivery.destinationCoordinates.lat,
              lng: delivery.destinationCoordinates.lng,
            }
          : null,
      },
      driver: {
        fullName: delivery.deliveryPersonnel.fullName,
        email: delivery.deliveryPersonnel.email,
      },
      status: delivery.status,
      note: delivery.note,
      assignedDate: delivery.createdAt.toISOString(),
      markedBy: delivery.markedBy,
    }));

    return NextResponse.json(formattedDeliveries);
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
