// app/api/deliveries/[id]/route.ts (updated PATCH handler)
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/database/mongodb";
import { ToShip } from "@/models/toship";
import { ArchivedDelivery } from "@/models/archived-delivery";
import { ProductHistory } from "@/models/product-history"; // Add this import
import { Product } from "@/models/product"; // Add this import
import { sendEventToUser } from "@/sse/sse";
import mongoose from "mongoose";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession();

  try {
    await connectDB();
    const { id } = await params;
    const { status, driverEmail } = await request.json();
    
    if (!status || !driverEmail) {
      return NextResponse.json(
        { error: "Status and driver email are required" },
        { status: 400 }
      );
    }

    // Start transaction for data consistency
    session.startTransaction();

    const delivery = await ToShip.findById(id).session(session);
    if (!delivery) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    if (
      delivery.deliveryPersonnel.email.toLowerCase() !==
      driverEmail.toLowerCase()
    ) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Unauthorized: You can only update your own deliveries" },
        { status: 403 }
      );
    }

    const previousStatus = delivery.status;
    delivery.status = status;

    // Set timestamps based on status
    const now = new Date();
    if (status === "in-transit" && !delivery.startedAt) {
      delivery.startedAt = now;
    }

    if (status === "delivered" && !delivery.deliveredAt) {
      delivery.deliveredAt = now;

      // ✅ ADDED: Update product history when delivery is completed
      const productHistoryEntry = await ProductHistory.findOne({
        shipmentId: delivery._id,
        status: "pending"
      }).session(session);

      if (productHistoryEntry) {
        productHistoryEntry.status = "completed";
        productHistoryEntry.deliveredAt = now;
        await productHistoryEntry.save({ session });
        console.log(`✅ Updated product history entry ${productHistoryEntry._id} to completed`);
      } else {
        console.warn(`⚠️ No pending product history entry found for shipment ${delivery._id}`);
        
        // Fallback: Try to find product to create complete history entry
        const product = await Product.findById(delivery.productId).session(session);
        
        const fallbackHistoryEntry = new ProductHistory({
          productId: delivery.productId,
          productName: delivery.productName,
          productSku: delivery.productSku || "Unknown",
          category: product?.category || "Unknown",
          quantitySold: delivery.quantity,
          unitPrice: product?.price || 0,
          totalAmount: (product?.price || 0) * delivery.quantity,
          saleDate: now,
          soldBy: {
            name: delivery.deliveryPersonnel.fullName,
            email: delivery.deliveryPersonnel.email,
          },
          notes: `Delivered to: ${delivery.destination}. ${delivery.note || ''}`,
          saleType: "delivery",
          status: "completed",
          deliveredAt: now,
          shipmentId: delivery._id,
        });
        
        await fallbackHistoryEntry.save({ session });
        console.log(`✅ Created fallback product history entry ${fallbackHistoryEntry._id}`);
      }
    } else if (status === "cancelled") {
      delivery.cancelledAt = now;

      // ✅ ADDED: Update product history when delivery is cancelled
      const productHistoryEntry = await ProductHistory.findOne({
        shipmentId: delivery._id,
        status: "pending"
      }).session(session);

      if (productHistoryEntry) {
        productHistoryEntry.status = "cancelled";
        productHistoryEntry.cancelledAt = now;
        await productHistoryEntry.save({ session });
        console.log(`✅ Updated product history entry ${productHistoryEntry._id} to cancelled`);
      }
    }

    await delivery.save({ session });

    // Handle archiving for delivered shipments
    if (status === "delivered") {
      try {
        // Validate required fields before archiving
        const productId = delivery.productId || delivery._id;
        const deliveryPersonnelId =
          delivery.deliveryPersonnel.id ||
          delivery.deliveryPersonnel._id?.toString() ||
          delivery.deliveryPersonnel.email;

        if (!deliveryPersonnelId) {
          throw new Error("Missing delivery personnel ID");
        }

        // Create archived delivery
        await ArchivedDelivery.create([{
          originalId: delivery._id,
          productId: productId,
          productName: delivery.productName,
          productImage: delivery.productImage,
          productSku: delivery.productSku,
          quantity: delivery.quantity,
          destination: delivery.destination,
          destinationCoordinates: delivery.destinationCoordinates,
          deliveryPersonnel: {
            id: deliveryPersonnelId,
            fullName: delivery.deliveryPersonnel.fullName,
            email: delivery.deliveryPersonnel.email,
          },
          status: delivery.status,
          note: delivery.note,
          createdAt: delivery.createdAt,
          startedAt: delivery.startedAt,
          deliveredAt: delivery.deliveredAt,
          estimatedDelivery: delivery.estimatedDelivery,
          markedBy: delivery.markedBy,
          archivedAt: new Date(),
        }], { session });

        // Delete from active deliveries
        await ToShip.findByIdAndDelete(delivery._id).session(session);

        console.log(`✅ Successfully archived delivery ${delivery._id}`);

      } catch (archiveError) {
        await session.abortTransaction();
        console.error(`Failed to archive delivery ${delivery._id}:`, archiveError);
        return NextResponse.json(
          { error: "Failed to archive delivery" },
          { status: 500 }
        );
      }
    }

    // Commit transaction if everything succeeded
    await session.commitTransaction();

    // Send SSE notifications (non-blocking, outside transaction)
    setImmediate(async () => {
      try {
        sendEventToUser(delivery.markedBy.email, {
          type: "DELIVERY_STATUS_UPDATE",
          data: {
            assignmentId: delivery._id.toString(),
            productName: delivery.productName,
            driverName: delivery.deliveryPersonnel.fullName,
            previousStatus,
            newStatus: status,
            destination: delivery.destination,
          },
        });

        // Also notify the driver
        sendEventToUser(delivery.deliveryPersonnel.email, {
          type: "DELIVERY_STATUS_UPDATE",
          data: {
            assignmentId: delivery._id.toString(),
            productName: delivery.productName,
            previousStatus,
            newStatus: status,
            destination: delivery.destination,
          },
        });

        // Send delivery completion notification
        if (status === "delivered") {
          sendEventToUser(delivery.markedBy.email, {
            type: "SHIPMENT_DELIVERED",
            data: {
              assignmentId: delivery._id.toString(),
              productName: delivery.productName,
              driverName: delivery.deliveryPersonnel.fullName,
              deliveredAt: now.toISOString(),
            },
          });
        }
      } catch (sseError) {
        console.error("Error sending SSE notification:", sseError);
      }
    });

    // Return the updated delivery response
    const responseDelivery = {
      id: delivery._id.toString(),
      product: {
        id: delivery.productId,
        name: delivery.productName,
        image: delivery.productImage,
        quantity: delivery.quantity,
        sku: delivery.productSku,
      },
      customerAddress: {
        destination: delivery.destination,
        coordinates: delivery.destinationCoordinates
          ? {
              lat: delivery.destinationCoordinates.lat,
              lng: delivery.destinationCoordinates.lng,
            }
          : undefined,
      },
      driver: {
        id: delivery.deliveryPersonnel.id,
        fullName: delivery.deliveryPersonnel.fullName,
        email: delivery.deliveryPersonnel.email,
      },
      status: delivery.status,
      note: delivery.note || undefined,
      assignedDate: delivery.createdAt,
      startedAt: delivery.startedAt || undefined,
      deliveredAt: delivery.deliveredAt || undefined,
      estimatedDelivery: delivery.estimatedDelivery || undefined,
      markedBy: {
        name: delivery.markedBy.name,
        email: delivery.markedBy.email,
        role: delivery.markedBy.role,
      },
    };

    return NextResponse.json({
      message: "Delivery status updated successfully",
      delivery: responseDelivery,
      historyUpdated: status === "delivered" || status === "cancelled", // ✅ ADDED: Indicate history was updated
    });

  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    console.error("Error updating delivery status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}

// GET method for fetching single delivery
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const delivery = await ToShip.findById(id);
    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    const responseDelivery = {
      id: delivery._id.toString(),
      product: {
        id: delivery.productId,
        name: delivery.productName,
        image: delivery.productImage,
        quantity: delivery.quantity,
        sku: delivery.productSku,
      },
      customerAddress: {
        destination: delivery.destination,
        coordinates: delivery.destinationCoordinates
          ? {
              lat: delivery.destinationCoordinates.lat,
              lng: delivery.destinationCoordinates.lng,
            }
          : undefined,
      },
      driver: {
        id: delivery.deliveryPersonnel.id,
        fullName: delivery.deliveryPersonnel.fullName,
        email: delivery.deliveryPersonnel.email,
      },
      status: delivery.status,
      note: delivery.note || undefined,
      assignedDate: delivery.createdAt,
      startedAt: delivery.startedAt || undefined,
      deliveredAt: delivery.deliveredAt || undefined,
      estimatedDelivery: delivery.estimatedDelivery || undefined,
      markedBy: {
        name: delivery.markedBy.name,
        email: delivery.markedBy.email,
        role: delivery.markedBy.role,
      },
    };

    return NextResponse.json({ delivery: responseDelivery });
  } catch (error) {
    console.error("Error fetching delivery:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE method for cancelling delivery (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession();

  try {
    await connectDB();
    const { id } = await params;

    session.startTransaction();

    const delivery = await ToShip.findById(id).session(session);
    if (!delivery) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    // ✅ ADDED: Update product history when delivery is deleted/cancelled
    const productHistoryEntry = await ProductHistory.findOne({
      shipmentId: delivery._id,
      status: "pending"
    }).session(session);

    if (productHistoryEntry) {
      productHistoryEntry.status = "cancelled";
      productHistoryEntry.cancelledAt = new Date();
      await productHistoryEntry.save({ session });
      console.log(`✅ Updated product history entry ${productHistoryEntry._id} to cancelled`);
    }

    // Delete the delivery
    await ToShip.findByIdAndDelete(id).session(session);

    await session.commitTransaction();

    return NextResponse.json({
      message: "Delivery cancelled successfully",
      historyUpdated: true, // ✅ ADDED: Indicate history was updated
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Error cancelling delivery:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}