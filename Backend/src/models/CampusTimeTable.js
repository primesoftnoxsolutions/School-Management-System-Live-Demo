import mongoose from "mongoose";
import { baseFields } from "./baseFields.js";

const campusTimeTableSchema = new mongoose.Schema(
  {
    branch: { type: String, enum: ["Girls", "Boys"], required: true, unique: true, index: true },
    breakTime: {
      label: { type: String, default: "BREAK TIME", trim: true },
      start: { type: String, default: "11:45", trim: true },
      end: { type: String, default: "12:15", trim: true },
      afterPeriod: { type: Number, default: 5 },
    },
    classTeachers: { type: Map, of: String, default: {} },
    periods: [
      {
        number: { type: Number, required: true },
        start: { type: String, default: "", trim: true },
        end: { type: String, default: "", trim: true },
        assignments: { type: Map, of: String, default: {} },
      },
    ],
    ...baseFields,
  },
  { timestamps: true }
);

export const CampusTimeTable = mongoose.model("CampusTimeTable", campusTimeTableSchema);
