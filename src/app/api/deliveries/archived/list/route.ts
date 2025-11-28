import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/database/mongodb";
import { getServerSession } from "@/better-auth/action";
import { ArchivedDelivery } from "@/models/archived-delivery";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const driverEmail = searchParams.get("driverEmail");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = parseInt(searchParams.get("skip") || "0");

    if (!driverEmail) {
      return NextResponse.json(
        { error: "Driver email is required" },
        { status: 400 }
      );
    }

    // Fetch archived deliveries for this driver
    const archivedDeliveries = await ArchivedDelivery.find({
      "deliveryPersonnel.email": driverEmail.toLowerCase(),
    })
      .sort({ archivedAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalCount = await ArchivedDelivery.countDocuments({
      "deliveryPersonnel.email": driverEmail.toLowerCase(),
    });

    // Format the response to match your DeliveryAssignment interface
    const formattedDeliveries = archivedDeliveries.map((delivery) => ({
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
      archivedAt: delivery.archivedAt,
      markedBy: {
        name: delivery.markedBy.name,
        email: delivery.markedBy.email,
      },
    }));

    return NextResponse.json({
      deliveries: formattedDeliveries,
      totalCount,
      hasMore: skip + limit < totalCount,
    });
  } catch (error) {
    console.error("Error fetching archived deliveries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
