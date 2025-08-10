// api/drivers/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/database/mongodb";
import { Driver } from "@/models/delivery-staff";
import { getServerSession } from "@/better-auth/action"; 

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const { userId } = await params;

    const driver = await Driver.findOne({ userId });

    return NextResponse.json({
      success: true,
      driver: driver || null,
    });
  } catch (error) {
    console.error("Error fetching driver:", error);
    return NextResponse.json(
      { error: "Failed to fetch driver info" },
      { status: 500 }
    );
  }
}

// Also create endpoint to update FCM token
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const { userId } = await params;
    const { fcmToken } = await request.json();

    const driver = await Driver.findOneAndUpdate(
      { userId },
      { fcmToken },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      driver,
    });
  } catch (error) {
    console.error("Error updating driver FCM token:", error);
    return NextResponse.json(
      { error: "Failed to update FCM token" },
      { status: 500 }
    );
  }
}
