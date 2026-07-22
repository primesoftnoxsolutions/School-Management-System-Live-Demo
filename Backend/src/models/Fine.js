import mongoose from "mongoose";
import { baseFields } from "./baseFields.js";

const fineSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    fineType: {
      type: String,
      enum: ["LATE_FEE", "DISCIPLINE", "LIBRARY", "UNIFORM", "DAMAGE", "ABSENCE", "OTHER"],
      default: "OTHER",
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ["PENDING", "PAID", "WAIVED"], default: "PENDING", index: true },
    dueDate: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    paymentMethod: {
      type: String,
      enum: ["CASH", "BANK", "ONLINE", "CHEQUE", "NONE"],
      default: "NONE",
    },
    waivedReason: { type: String, default: "", trim: true },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ...baseFields,
  },
  { timestamps: true }
);

export const Fine = mongoose.model("Fine", fineSchema);
