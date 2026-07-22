import mongoose from "mongoose";
import { baseFields } from "./baseFields.js";

const studentSchema = new mongoose.Schema(
  {
    admissionNo: { type: String, required: true, unique: true, index: true },
    loginId: { type: String, default: "", trim: true, index: true },
    loginPassword: { type: String, default: "", trim: true },
    rollNumber: { type: String, default: "", trim: true, index: true },
    firstName: { type: String, required: true, trim: true, index: true },
    lastName: { type: String, required: true, trim: true },
    fatherName: { type: String, default: "", trim: true },
    fatherCnic: { type: String, default: "", trim: true },
    fatherOccupation: { type: String, default: "", trim: true },
    alternativePhone: { type: String, default: "", trim: true },
    phoneNumber: { type: String, default: "", trim: true },
    maritalStatus: {
      type: String,
      enum: ["SINGLE", "MARRIED", "OTHER"],
      default: "SINGLE",
    },
    previousClass: { type: String, default: "", trim: true },
    previousResultGrade: { type: String, default: "", trim: true },
    previousResultPercentage: { type: String, default: "", trim: true },
    previousResults: [
      {
        previousClass: { type: String, default: "", trim: true },
        resultGrade: { type: String, default: "", trim: true },
        percentage: { type: String, default: "", trim: true },
        documentUrl: { type: String, default: "" },
      },
    ],
    subjects: { type: [String], default: [] },
    schoolLeavingCertificate: { type: String, default: "" },
    characterCertificate: { type: String, default: "" },
    cnicBForm: { type: String, default: "", trim: true, index: true },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"], required: true },
    dateOfBirth: { type: Date, required: true },
    guardianName: { type: String, required: true, trim: true },
    guardianPhone: { type: String, required: true, trim: true },
    address: { type: String, default: "", trim: true },
    academicStream: { type: String, default: "", trim: true },
    streamDetail: { type: String, default: "", trim: true },
    monthlyFee: { type: Number, default: 0, min: 0 },
    annualFee: { type: Number, default: 0, min: 0 },
    installmentCount: { type: Number, default: 0, min: 0 },
    admissionFee: { type: Number, default: 0, min: 0 },
    admissionFeePaid: { type: Boolean, default: false },
    className: { type: String, required: true, trim: true, index: true },
    section: { type: String, default: "A", trim: true },
    admissionDate: { type: Date, default: Date.now, index: true },
    studentPhotoUrl: { type: String, default: null },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },
    enrollmentStatus: {
      type: String,
      enum: ["ENROLLED", "LEFT_SCHOOL", "TERMINATED"],
      default: "ENROLLED",
      index: true,
    },
    portalAccessEnabled: { type: Boolean, default: true, index: true },
    leftSchoolAt: { type: Date, default: null },
    lastAttendanceDate: { type: Date, default: null },
    leavingReason: { type: String, default: "", trim: true },
    terminationRemarks: { type: String, default: "", trim: true },
    ...baseFields,
  },
  { timestamps: true }
);

studentSchema.index({ firstName: 1, className: 1, isDeleted: 1 });

export const Student = mongoose.model("Student", studentSchema);
