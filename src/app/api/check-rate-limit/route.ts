import { db } from "@/database/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const { key, window, max } = await request.json();
    const collection = db.collection("rateLimit");

    const now = Date.now();
    const record = await collection.findOne({ key });

    if (!record) {
        return NextResponse.json({ allowed: true });
    }

    const windowMs = window * 1000;
    if (now - record.lastRequest > windowMs) {
        // Window expired, reset
        await collection.updateOne({ key }, { $set: { count: 0, lastRequest: now } });
        return NextResponse.json({ allowed: true });
    }

    if (record.count >= max) {
        const retryAfter = Math.ceil((record.lastRequest + windowMs - now) / 1000);
        return NextResponse.json({ allowed: false, retryAfter }, { status: 429 });
    }

    return NextResponse.json({ allowed: true });
}