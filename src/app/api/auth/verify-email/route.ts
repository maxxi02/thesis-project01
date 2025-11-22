import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/database/mongodb";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string" || email.trim().length === 0) {
      return NextResponse.json(
        { exists: false, error: "Email is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Get the MongoDB URI and replace the database name with 'LGW'
    const mongoUri = process.env.MONGODB_URI || "";
    const authDbUri = mongoUri.replace(/\/[^\/]*(\?|$)/, "/LGW$1");

    // Create a separate connection to the LGW database
    const authConnection = await mongoose
      .createConnection(authDbUri)
      .asPromise();

    try {
      const userCollection = authConnection.collection("user");

      const existingUser = await userCollection.findOne({
        email: { $regex: new RegExp(`^${email.trim()}$`, "i") },
      });

      console.log(
        `Email ${email} ${
          existingUser ? "found" : "not found"
        } in LGW.user collection`
      );

      return NextResponse.json({ exists: !!existingUser });
    } finally {
      // Close the auth connection
      await authConnection.close();
    }
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { exists: false, error: "Failed to verify email" },
      { status: 500 }
    );
  }
}
