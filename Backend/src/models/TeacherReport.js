import mongoose from "mongoose";
import { baseFields } from "./baseFields.js";

const teacherReportSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    reportType: {
      type: String,
      enum: ["ATTENDANCE", "ACADEMIC", "CLASS", "GENERAL"],
      default: "GENERAL",
      index: true,
    },
    summary: { type: String, required: true, trim: true },
    periodFrom: { type: Date, default: null },
    periodTo: { type: Date, default: null },
    ...baseFields,
  },
  { timestamps: true }
);

teacherReportSchema.index({ teacherId: 1, createdAt: -1 });

export const TeacherReport = mongoose.model("TeacherReport", teacherReportSchema);
