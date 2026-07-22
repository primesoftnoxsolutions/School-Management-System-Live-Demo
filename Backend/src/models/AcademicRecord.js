import mongoose from "mongoose";
import { baseFields } from "./baseFields.js";

const academicRecordSchema = new mongoose.Schema(
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
    subject: { type: String, required: true, trim: true },
    examType: { type: String, required: true, trim: true },
    marks: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, required: true, min: 1 },
    grade: { type: String, default: "", trim: true },
    remarks: { type: String, default: "", trim: true },
    ...baseFields,
  },
  { timestamps: true }
);

academicRecordSchema.index({ teacherId: 1, studentId: 1, subject: 1, examType: 1, isDeleted: 1 });

export const AcademicRecord = mongoose.model("AcademicRecord", academicRecordSchema);
