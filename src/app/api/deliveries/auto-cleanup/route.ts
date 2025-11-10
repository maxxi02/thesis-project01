import { ToShip } from "@/models/toship";
import { ArchivedDelivery } from "@/models/archived-delivery";
import { connectDB } from "@/database/mongodb";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await connectDB();

    // Find all delivered deliveries for immediate archiving
    // (Removed time threshold to ensure immediate cleanup after status update;
    // adjust if a delay is needed in production to avoid race conditions)
    const deliveriesToArchive = await ToShip.find({
      status: "delivered",
    });

    let archivedCount = 0;

    // Archive each delivery
    for (const delivery of deliveriesToArchive) {
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

        // Delete original
        await ToShip.findByIdAndDelete(delivery._id);
        archivedCount++;
      } catch (archiveError) {
        console.error(
          `Failed to archive delivery ${delivery._id}:`,
          archiveError
        );
      }
    }

    console.log(
      "Auto-cleanup endpoint called but disabled - archiving handled in PATCH"
    );

    return NextResponse.json({
      success: true,
      archivedCount,
      message: "Cleanup deprecated; use immediate archiving in status update",
      cleanupTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Auto-cleanup error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
