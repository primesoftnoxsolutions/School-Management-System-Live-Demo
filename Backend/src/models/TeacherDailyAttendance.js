import mongoose from "mongoose";
import { baseFields } from "./baseFields.js";

const teacherDailyAttendanceSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "LATE", "LEAVE"],
      default: "PRESENT",
      index: true,
    },
    remarks: { type: String, default: "", trim: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    source: {
      type: String,
      enum: ["ADMIN", "TEACHER"],
      default: "ADMIN",
      index: true,
    },
    ...baseFields,
  },
  { timestamps: true }
);

teacherDailyAttendanceSchema.index({ teacherId: 1, date: 1 }, { unique: true });

export const TeacherDailyAttendance = mongoose.model("TeacherDailyAttendance", teacherDailyAttendanceSchema);
