import mongoose from "mongoose";
import { baseFields } from "./baseFields.js";

const payrollSchema = new mongoose.Schema(
  {
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    staffName: { type: String, required: true, trim: true },
    staffRole: { type: String, required: true, trim: true },
    month: { type: String, required: true, trim: true, index: true },
    year: { type: Number, required: true, index: true },
    basicSalary: { type: Number, required: true, min: 0 },
    paySalary: { type: Number, default: 0, min: 0 },
    allowances: { type: Number, default: 0, min: 0 },
    deductions: { type: Number, default: 0, min: 0 },
    bonus: { type: Number, default: 0, min: 0 },
    netSalary: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["CASH", "BANK", "ONLINE", "CHEQUE"],
      default: "BANK",
    },
    status: { type: String, enum: ["PENDING", "PAID"], default: "PENDING", index: true },
    paidAt: { type: Date, default: null },
    payslipNo: { type: String, default: "", trim: true, index: true },
    transactionRef: { type: String, default: "", trim: true },
    campus: { type: String, default: "", trim: true, index: true },
    department: { type: String, default: "", trim: true, index: true },
    designation: { type: String, default: "", trim: true },
    employeeCode: { type: String, default: "", trim: true, index: true },
    remarks: { type: String, default: "", trim: true },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ...baseFields,
  },
  { timestamps: true }
);

payrollSchema.index({ staffId: 1, month: 1, year: 1, isDeleted: 1 });

export const Payroll = mongoose.model("Payroll", payrollSchema);
