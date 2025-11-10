// models/archived-delivery.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IArchivedDelivery extends Document {
  productId: mongoose.Types.ObjectId;
  productName: string;
  productImage: string;
  productSku: string;
  quantity: number;
  deliveryPersonnel: {
    id: string;
    fullName: string;
    email: string;
    fcmToken?: string;
  };
  customerAddress: {
    destination: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  status: "delivered" | "cancelled";
  note?: string;
  assignedDate: Date;
  startedAt?: Date;
  deliveredAt?: Date;
  estimatedDelivery?: Date;
  markedBy: {
    name: string;
    email: string;
    role?: string;
  };
  archivedAt: Date;
  notifications?: Array<{
    type: string;
    read: boolean;
  }>;
}

const ArchivedDeliverySchema: Schema = new Schema<IArchivedDelivery>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    productImage: {
      type: String,
      default: "/placeholder.svg?height=300&width=300",
    },
    productSku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    deliveryPersonnel: {
      id: {
        type: String,
        required: true,
      },
      fullName: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
      fcmToken: {
        type: String,
        default: "",
      },
    },
    customerAddress: {
      destination: {
        type: String,
        required: true,
        trim: true,
      },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    status: {
      type: String,
      enum: ["delivered", "cancelled"],
      required: true,
      default: "delivered",
    },
    note: {
      type: String,
      trim: true,
    },
    assignedDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    startedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    estimatedDelivery: {
      type: Date,
    },
    markedBy: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
      role: {
        type: String,
        default: "admin",
      },
    },
    archivedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    notifications: [
      {
        type: {
          type: String,
          required: true,
        },
        read: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for efficient queries by driver email
ArchivedDeliverySchema.index({ "deliveryPersonnel.email": 1, archivedAt: -1 });

// Ensure unique archived entries per original shipment (if migrating from ToShip)
ArchivedDeliverySchema.index(
  { productId: 1, "deliveryPersonnel.id": 1, status: 1 },
  { unique: true }
);

export const ArchivedDelivery = mongoose.model<IArchivedDelivery>(
  "ArchivedDelivery",
  ArchivedDeliverySchema
);
