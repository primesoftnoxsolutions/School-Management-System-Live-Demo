import mongoose from "mongoose";
import { ASSET_CATEGORIES } from "../constants/assetCategories.js";
import { baseFields } from "./baseFields.js";

const assetInventorySchema = new mongoose.Schema(
  {
    branch: { type: String, enum: ["Boys", "Girls"], default: "Boys", index: true },
    className: { type: String, default: "", trim: true, index: true },
    section: { type: String, default: "", trim: true, index: true },
    category: { type: String, enum: ASSET_CATEGORIES, required: true, index: true },
    itemName: { type: String, default: "", trim: true },
    working: { type: Number, default: 0, min: 0 },
    broken: { type: Number, default: 0, min: 0 },
    underMaintenance: { type: Number, default: 0, min: 0 },
    missing: { type: Number, default: 0, min: 0 },
    replaced: { type: Number, default: 0, min: 0 },
    totalPurchased: { type: Number, default: 0, min: 0 },
    lastPurchaseDate: { type: Date, default: null },
    lastPurchaseId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolPurchase", default: null },
    remarks: { type: String, default: "", trim: true },
    ...baseFields,
  },
  { timestamps: true }
);

assetInventorySchema.index(
  { branch: 1, className: 1, section: 1, category: 1, isDeleted: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const AssetInventory = mongoose.model("AssetInventory", assetInventorySchema);
