import { getServerSession } from "@/better-auth/action";
import { ToShip } from "@/models/toship";
import { connectDB } from "@/database/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { Types, Document } from "mongoose";

interface MarkedBy {
  name: string;
  email: string;
  role: string;
}

interface DeliveryPersonnel {
  id: string;
  fullName: string;
  email: string;
  fcmToken?: string;
}

interface Notification {
  type: "assigned" | "status_update" | "note_added";
  createdAt: Date;
  read: boolean;
}

// Raw delivery data from database (matches MongoDB schema)
interface RawDelivery extends Document {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  productName: string;
  productImage: string;
  productSku: string;
  quantity: number;
  deliveryPersonnel: DeliveryPersonnel;
  destination: string;
  note: string;
  status: "pending" | "in-transit" | "delivered" | "cancelled";
  estimatedDelivery?: Date;
  markedBy: MarkedBy;
  markedDate: Date;
  notifications: Notification[];
  createdAt: Date;
  updatedAt: Date;
}

// Formatted delivery data for API response
interface FormattedDelivery {
  id: string;
  product: {
    name: string;
    image: string;
    quantity: number;
    sku: string;
  };
  customerAddress: {
    destination: string;
  };
  driver: {
    id: string;
    fullName: string;
    email: string;
    fcmToken?: string;
  };
  status: string;
  note: string;
  assignedDate: string;
  updatedAt: string;
  estimatedDelivery?: string;
  markedBy: MarkedBy;
  markedDate: string;
  notifications: Array<{
    type: string;
    createdAt: string;
    read: boolean;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const deliveryId = searchParams.get("deliveryId");

    if (deliveryId) {
      // Get specific delivery
      const delivery = await ToShip.findById(deliveryId);
      if (!delivery) {
        return NextResponse.json(
          { error: "Delivery not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(formatDeliveryData(delivery));
    }

    // Get all deliveries for tracking dashboard
    const deliveries = await ToShip.find({}).sort({ createdAt: -1 });

    const formattedDeliveries = deliveries.map(formatDeliveryData);
    return NextResponse.json(formattedDeliveries);
  } catch (error) {
    console.error("Error fetching delivery tracking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function formatDeliveryData(delivery: RawDelivery): FormattedDelivery {
  return {
    id: delivery._id.toString(),
    product: {
      name: delivery.productName,
      image: delivery.productImage,
      quantity: delivery.quantity,
      sku: delivery.productSku,
    },
    customerAddress: {
      destination: delivery.destination,
    },
    driver: {
      id: delivery.deliveryPersonnel.id,
      fullName: delivery.deliveryPersonnel.fullName,
      email: delivery.deliveryPersonnel.email,
      fcmToken: delivery.deliveryPersonnel.fcmToken,
    },
    status: delivery.status,
    note: delivery.note,
    assignedDate: delivery.createdAt.toISOString(),
    updatedAt: delivery.updatedAt.toISOString(),
    estimatedDelivery: delivery.estimatedDelivery?.toISOString(),
    markedBy: delivery.markedBy,
    markedDate: delivery.markedDate.toISOString(),
    notifications: delivery.notifications.map((notification) => ({
      type: notification.type,
      createdAt: notification.createdAt.toISOString(),
      read: notification.read,
    })),
  };
}
