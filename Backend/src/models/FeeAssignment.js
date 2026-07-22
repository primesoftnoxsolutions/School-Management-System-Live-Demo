import mongoose from "mongoose";
import { baseFields } from "./baseFields.js";

const feeAssignmentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    feeType: {
      type: String,
      enum: ["TUITION", "TRANSPORT", "EXAM", "ADMISSION", "LAB", "LIBRARY", "SPORTS", "ANNUAL", "OTHER"],
      default: "TUITION",
    },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date, default: null },
    month: { type: String, default: "", trim: true },
    academicYear: { type: String, default: "", trim: true },
    status: { type: String, enum: ["PENDING", "PARTIAL", "PAID"], default: "PENDING", index: true },
    ...baseFields,
  },
  { timestamps: true }
);

export const FeeAssignment = mongoose.model("FeeAssignment", feeAssignmentSchema);
