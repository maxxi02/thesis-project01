import { db } from "@/database/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const { key } = await request.json();
    const collection = db.collection("rateLimit");

    await collection.deleteOne({ key });

    return NextResponse.json({ success: true });
}