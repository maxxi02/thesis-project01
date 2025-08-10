// lib/models/productHistory.ts
import mongoose from "mongoose";

const productHistorySchema = new mongoose.Schema(
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
    productSku: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    quantitySold: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    saleDate: {
      type: Date,
      default: Date.now,
    },
    soldBy: {
      name: String,
      role: String,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
productHistorySchema.index({ productId: 1, saleDate: -1 });
productHistorySchema.index({ saleDate: -1 });
productHistorySchema.index({ productSku: 1 });

export const ProductHistory =
  mongoose.models.ProductHistory ||
  mongoose.model("ProductHistory", productHistorySchema);
