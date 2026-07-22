import mongoose from "mongoose";
import { ASSET_CATEGORIES } from "../constants/assetCategories.js";
import { baseFields } from "./baseFields.js";

const schoolPurchaseSchema = new mongoose.Schema(
  {
    purchaseNo: { type: String, required: true, unique: true, index: true },
    date: { type: Date, required: true, index: true },
    branch: { type: String, enum: ["Boys", "Girls"], default: "Boys", index: true },
    className: { type: String, default: "", trim: true, index: true },
    section: { type: String, default: "", trim: true, index: true },
    category: { type: String, enum: ASSET_CATEGORIES, required: true, index: true },
    purchaseType: {
      type: String,
      enum: ["BROKEN_REPLACEMENT", "NEW_EXTRA"],
      default: "NEW_EXTRA",
      index: true,
    },
    itemName: { type: String, default: "", trim: true },
    vendor: { type: String, default: "", trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: "", trim: true },
    status: { type: String, enum: ["APPROVED"], default: "APPROVED", index: true },
    syncedToAssets: { type: Boolean, default: false, index: true },
    ...baseFields,
  },
  { timestamps: true }
);

export const SchoolPurchase = mongoose.model("SchoolPurchase", schoolPurchaseSchema);
