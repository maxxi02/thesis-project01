import mongoose from "mongoose";

const archivedDeliverySchema = new mongoose.Schema({
  originalId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  productImage: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  destinationCoordinates: {
    lat: Number,
    lng: Number,
  },
  deliveryPersonnel: {
    fullName: String,
    email: String,
  },
  status: {
    type: String,
    enum: ["delivered", "cancelled"],
    required: true,
  },
  note: String,
  createdAt: Date,
  startedAt: Date,
  deliveredAt: Date,
  estimatedDelivery: Date,
  markedBy: {
    name: String,
    email: String,
  },
  archivedAt: {
    type: Date,
    default: Date.now,
  },
});

export const ArchivedDelivery =
  mongoose.models.ArchivedDelivery ||
  mongoose.model("ArchivedDelivery", archivedDeliverySchema);
