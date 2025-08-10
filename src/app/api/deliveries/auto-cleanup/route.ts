import { ToShip } from "@/models/toship";
import { connectDB } from "@/database/mongodb";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await connectDB();

    // Calculate 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find and delete deliveries completed more than 7 days ago
    const result = await ToShip.deleteMany({
      completedAt: { $lte: sevenDaysAgo },
      status: { $in: ["delivered", "cancelled"] },
    });

    console.log(
      `Auto-cleanup: Deleted ${result.deletedCount} old delivery records`
    );

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      cleanupTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Auto-cleanup error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
