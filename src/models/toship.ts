import mongoose from "mongoose";

const toShipSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productImage: {
      type: String,
      default: "",
    },
    productSku: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    deliveryPersonnel: {
      id: { type: String, required: true },
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      fcmToken: { type: String }, // For push notifications
    },
    destination: {
      type: String,
      required: true,
    },
    destinationCoordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    note: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "in-transit", "delivered", "cancelled"],
      default: "pending",
    },
    estimatedDelivery: {
      type: Date,
    },
    markedBy: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      role: { type: String, required: true },
    },
    markedDate: {
      type: Date,
      default: Date.now,
    },
    // Add notification tracking
    notifications: [
      {
        type: {
          type: String,
          enum: ["assigned", "status_update", "note_added"],
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        read: {
          type: Boolean,
          default: false,
        },
      },
    ],
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const ToShip =
  mongoose.models.ToShip || mongoose.model("ToShip", toShipSchema);
