import mongoose from "mongoose";
import { baseFields } from "./baseFields.js";

const syllabusRowSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    syllabus: { type: String, default: "", trim: true },
    covered: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const teacherSyllabusSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    className: { type: String, required: true, trim: true, index: true },
    section: { type: String, default: "A", trim: true, index: true },
    branch: { type: String, enum: ["Girls", "Boys"], default: "Girls", trim: true, index: true },
    mode: { type: String, enum: ["MONTHLY", "ANNUALLY"], default: "MONTHLY", index: true },
    month: { type: Number, default: null, min: 0, max: 11, index: true },
    year: { type: Number, required: true, index: true },
    bookTitle: { type: String, default: "BOOKS NAME", trim: true },
    monthTitle: { type: String, default: "", trim: true },
    rows: { type: [syllabusRowSchema], default: [] },
    notes: { type: String, default: "", trim: true },
    ...baseFields,
  },
  { timestamps: true }
);

teacherSyllabusSchema.index({ teacherId: 1, className: 1, section: 1, mode: 1, month: 1, year: 1, isDeleted: 1 });

export const TeacherSyllabus = mongoose.model("TeacherSyllabus", teacherSyllabusSchema);
