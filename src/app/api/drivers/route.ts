import { NextResponse } from "next/server";
import { getServerSession } from "@/better-auth/action";
import { connectDB } from "@/database/mongodb";
import { Driver } from "@/models/delivery-staff";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["admin", "cashier"];
    
    if (!allowedRoles.includes(session.user.role?.toLowerCase() || "")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await connectDB();

    const db = mongoose.connection.db;
    
    // Use the correct collection name with prefix
    const usersCollection = db?.collection("user");
    
    // Find users with delivery role
    const deliveryUsers = await usersCollection
      ?.find({ role: { $regex: /^delivery$/i } })
      .toArray();

    console.log("Found delivery users:", deliveryUsers?.length);

    if (!deliveryUsers || deliveryUsers.length === 0) {
      return NextResponse.json({ 
        success: true, 
        drivers: []
      });
    }

    // Get FCM tokens for each driver
    const driversWithTokens = await Promise.all(
      deliveryUsers.map(async (user) => {
        try {
          // Use _id since that's what's in your database
          const userId = user._id?.toString();
          const driverInfo = await Driver.findOne({ userId });
          
          return {
            id: userId,
            name: user.name || "",
            email: user.email,
            role: user.role || "delivery",
            fcmToken: driverInfo?.fcmToken || "",
          };
        } catch (error) {
          console.error(`Error fetching driver info for ${user._id}:`, error);
          return {
            id: user._id?.toString(),
            name: user.name || "",
            email: user.email,
            role: user.role || "delivery",
            fcmToken: "",
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      drivers: driversWithTokens,
    });
  } catch (error) {
    console.error("Failed to fetch drivers:", error);
    return NextResponse.json(
      { error: "Failed to fetch drivers" },
      { status: 500 }
    );
  }
}