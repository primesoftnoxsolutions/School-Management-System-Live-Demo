import mongoose from "mongoose";
import { baseFields } from "./baseFields.js";

const admissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    /** Unique number for admission history only (e.g. ADM-...). Separate from Student ID. */
    admissionNo: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "APPROVED",
      index: true,
    },
    remarks: { type: String, default: null, trim: true },
    ...baseFields,
  },
  { timestamps: true }
);

admissionSchema.index({ createdAt: -1, status: 1, isDeleted: 1 });
admissionSchema.index(
  { admissionNo: 1 },
  { unique: true, partialFilterExpression: { admissionNo: { $type: "string", $gt: "" } } }
);

export const Admission = mongoose.model("Admission", admissionSchema);
