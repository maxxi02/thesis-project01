import { db } from "@/database/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const { key } = await request.json();
    const collection = db.collection("rateLimit");

    await collection.updateOne(
        { key },
        { $inc: { count: 1 }, $set: { lastRequest: Date.now() } },
        { upsert: true }
    );

    return NextResponse.json({ success: true });
}