import mongoose from "mongoose";
import { baseFields } from "./baseFields.js";

const academicDocumentSchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
      enum: ["ROLL_SLIP", "DATE_SHEET", "RESULT_CARD"],
      required: true,
      index: true,
    },
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
    className: { type: String, required: true, trim: true, index: true },
    section: { type: String, default: "A", trim: true, index: true },
    term: { type: String, default: "", trim: true, index: true },
    releaseAt: { type: Date, default: null },
    releasedAt: { type: Date, default: null },
    isReleased: { type: Boolean, default: false, index: true },
    batchKey: { type: String, default: "", trim: true, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    ...baseFields,
  },
  { timestamps: true }
);

academicDocumentSchema.index(
  { documentType: 1, studentId: 1, className: 1, section: 1, term: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const AcademicDocument = mongoose.model("AcademicDocument", academicDocumentSchema);
