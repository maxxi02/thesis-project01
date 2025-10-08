// models/category.ts
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    createdBy: {
      name: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        required: true,
      },
    },
  },
  { timestamps: true }
);

export const Category =
  mongoose.models.Category || mongoose.model("Category", categorySchema);
