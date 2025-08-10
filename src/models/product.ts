import mongoose from "mongoose";

// const shippingHistorySchema = new mongoose.Schema({
//   quantityShipped: {
//     type: Number,
//     required: true,
//     min: [1, "Quantity shipped must be at least 1"],
//   },
//   shippingDate: {
//     type: Date,
//     default: Date.now,
//   },
//   trackingNumber: {
//     type: String,
//     trim: true,
//   },
//   carrier: {
//     type: String,
//     trim: true,
//   },
//   destination: {
//     type: String,
//     trim: true,
//   },
//   notes: {
//     type: String,
//     trim: true,
//   },
//   shippedBy: {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     email: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//   },
//   status: {
//     type: String,
//     enum: ["pending", "shipped", "delivered", "cancelled"],
//     default: "shipped",
//   },
// });

// models/product.ts

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

  update.updatedAt = new Date();
  next();
});

export const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);
