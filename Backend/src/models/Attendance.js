import mongoose from "mongoose";
import { baseFields } from "./baseFields.js";

const attendanceSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    className: { type: String, required: true, trim: true },
    section: { type: String, default: "A", trim: true },
    date: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "LATE", "LEAVE"],
      default: "PRESENT",
      index: true,
    },
    remarks: { type: String, default: "", trim: true },
    ...baseFields,
  },
  { timestamps: true }
);

attendanceSchema.index({ teacherId: 1, studentId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", attendanceSchema);
