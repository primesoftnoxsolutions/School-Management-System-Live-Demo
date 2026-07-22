import mongoose from "mongoose";
import { baseFields } from "./baseFields.js";

const feeRefundSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "FeePayment", default: null },
    refundNo: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, trim: true },
    refundType: {
      type: String,
      enum: ["FEES", "FINE", "ADMISSION", "TRANSPORT", "OTHER"],
      default: "FEES",
    },
    refundMethod: {
      type: String,
      enum: ["CASH", "BANK", "ONLINE", "CHEQUE"],
      default: "CASH",
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "PROCESSED"],
      default: "PENDING",
      index: true,
    },
    processedAt: { type: Date, default: null },
    remarks: { type: String, default: "", trim: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ...baseFields,
  },
  { timestamps: true }
);

export const FeeRefund = mongoose.model("FeeRefund", feeRefundSchema);
