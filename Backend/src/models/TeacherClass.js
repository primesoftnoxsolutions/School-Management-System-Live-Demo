import mongoose from "mongoose";
import { baseFields } from "./baseFields.js";

const teacherClassSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    className: { type: String, required: true, trim: true, index: true },
    branch: { type: String, enum: ["Girls", "Boys"], default: "Girls", trim: true, index: true },
    section: { type: String, default: "A", trim: true },
    subject: { type: String, required: true, trim: true },
    roomNo: { type: String, default: "", trim: true },
    schedule: { type: String, default: "", trim: true },
    ...baseFields,
  },
  { timestamps: true }
);

teacherClassSchema.index({ teacherId: 1, className: 1, section: 1, subject: 1, isDeleted: 1 });

export const TeacherClass = mongoose.model("TeacherClass", teacherClassSchema);
