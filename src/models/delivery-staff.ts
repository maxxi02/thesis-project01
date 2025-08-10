import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  fcmToken: { type: String },
});

export const Driver =
  mongoose.models.Driver || mongoose.model("Driver", driverSchema);
