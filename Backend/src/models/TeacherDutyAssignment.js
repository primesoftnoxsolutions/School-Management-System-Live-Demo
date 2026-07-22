import mongoose from "mongoose";
import { baseFields } from "./baseFields.js";

const teacherDutyDaySchema = new mongoose.Schema(
  {
    day: { type: String, required: true, trim: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    teacherName: { type: String, default: "", trim: true },
    duties: {
      type: [
        {
          key: { type: String, required: true, trim: true },
          label: { type: String, required: true, trim: true },
          assigned: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
  },
  { _id: false }
);

const teacherDutyAssignmentSchema = new mongoose.Schema(
  {
    weekCommencing: { type: String, required: true, trim: true, index: true },
    rows: { type: [teacherDutyDaySchema], default: [] },
    notes: { type: String, default: "", trim: true },
    signatureTeacherName: { type: String, default: "", trim: true },
    signatureDate: { type: String, default: "", trim: true },
    ...baseFields,
  },
  { timestamps: true }
);

teacherDutyAssignmentSchema.index({ weekCommencing: 1, isDeleted: 1 });

export const TeacherDutyAssignment = mongoose.model("TeacherDutyAssignment", teacherDutyAssignmentSchema);
