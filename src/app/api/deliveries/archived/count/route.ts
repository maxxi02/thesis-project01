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

    if (!driverEmail) {
      return NextResponse.json(
        { error: "Driver email is required" },
        { status: 400 }
      );
    }

    const count = await ArchivedDelivery.countDocuments({
      "deliveryPersonnel.email": driverEmail.toLowerCase(),
    });

    return NextResponse.json({ count, success: true });
  } catch (error) {
    console.error("Error fetching archived delivery count:", error);
    return NextResponse.json(
      { error: "Internal server error", count: 0 },
      { status: 500 }
    );
  }
}
