// app/api/notifications/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { MongoClient, ObjectId } from "mongodb";
import { getServerSession } from "@/better-auth/action";

const client = new MongoClient(process.env.MONGODB_URI || "");

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { error: "User is not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unread") === "true";

    await client.connect();
    const db = client.db();
    const notificationsCollection = db.collection("notifications");

    const query: Record<string, unknown> = { userId: session.user.id };
    if (unreadOnly) {
      query.read = false;
    }

    const skip = (page - 1) * limit;

    const [notifications, totalCount, unreadCount] = await Promise.all([
      notificationsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      notificationsCollection.countDocuments(query),
      notificationsCollection.countDocuments({
        userId: session.user.id,
        read: false,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "User is not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationIds, markAsRead } = body;

    if (!Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: "notificationIds must be an array" },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db();
    const notificationsCollection = db.collection("notifications");

    const objectIds = notificationIds.map((id) => new ObjectId(id));

    const updateResult = await notificationsCollection.updateMany(
      {
        _id: { $in: objectIds },
        userId: session.user.id, // Ensure user can only update their own notifications
      },
      {
        $set: {
          read: markAsRead !== false, // Default to true if not specified
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `${updateResult.modifiedCount} notifications updated`,
      modifiedCount: updateResult.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
