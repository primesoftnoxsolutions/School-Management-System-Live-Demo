import mongoose from "mongoose";
import { baseFields } from "./baseFields.js";

const teacherActivitySchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: { type: String, required: true, trim: true, index: true },
    module: { type: String, required: true, trim: true, index: true },
    details: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["SUCCESS", "PENDING", "FAILED"],
      default: "SUCCESS",
      index: true,
    },
    performedAt: { type: Date, default: Date.now, index: true },
    ...baseFields,
  },
  { timestamps: true }
);

teacherActivitySchema.index({ teacherId: 1, performedAt: -1 });

export const TeacherActivity = mongoose.model("TeacherActivity", teacherActivitySchema);
