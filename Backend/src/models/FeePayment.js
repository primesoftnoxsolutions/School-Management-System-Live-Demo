import mongoose from "mongoose";
import { baseFields } from "./baseFields.js";

const feePaymentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    receiptNo: { type: String, required: true, unique: true, index: true },
    feeType: {
      type: String,
      enum: ["TUITION", "TRANSPORT", "EXAM", "ADMISSION", "LAB", "LIBRARY", "SPORTS", "ANNUAL", "FINE", "OTHER"],
      default: "TUITION",
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    fineAmount: { type: Number, default: 0, min: 0 },
    netAmount: { type: Number, required: true, min: 0 },
    assignmentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "FeeAssignment" }],
    fineIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Fine" }],
    paymentMethod: {
      type: String,
      enum: ["CASH", "BANK", "ONLINE", "CHEQUE"],
      default: "CASH",
    },
    chequeNo: { type: String, default: "", trim: true },
    transactionRef: { type: String, default: "", trim: true },
    month: { type: String, default: "", trim: true, index: true },
    academicYear: { type: String, default: "", trim: true },
    remarks: { type: String, default: "", trim: true },
    paidAt: { type: Date, default: Date.now, index: true },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ...baseFields,
  },
  { timestamps: true }
);

export const FeePayment = mongoose.model("FeePayment", feePaymentSchema);
