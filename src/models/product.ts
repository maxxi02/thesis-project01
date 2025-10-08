// models/product.ts
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "out-of-stock"],
      default: "active",
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    createdBy: {
      name: {
        type: String,
        required: [true, "Creator name is required"],
        trim: true,
      },
      role: {
        type: String,
        required: [true, "Creator role is required"],
        trim: true,
      },
    },
    updatedBy: {
      name: {
        type: String,
        trim: true,
      },
      role: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Basic indexes
productSchema.index({ name: "text" });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });

// Auto-set status based on stock
productSchema.pre("save", function (next) {
  if (this.stock === 0) {
    this.status = "out-of-stock";
  } else if (this.status === "out-of-stock" && this.stock > 0) {
    this.status = "active";
  }
  next();
});

// Pre-update middleware
productSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const update = this.getUpdate() as Record<string, unknown>;

  if (typeof update.stock === "number") {
    if (update.stock === 0) {
      update.status = "out-of-stock";
    } else if (update.status === "out-of-stock" && update.stock > 0) {
      update.status = "active";
    }
  }

  // Note: timestamps: true already handles updatedAt, but if you want to set updatedBy, you can do it here
  // For example, to set updatedBy, you'd need access to the session/user, which might require passing it via options

  next();
});

export const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);
