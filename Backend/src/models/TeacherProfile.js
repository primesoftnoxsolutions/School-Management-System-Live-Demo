import mongoose from "mongoose";
import { baseFields } from "./baseFields.js";

const teacherProfileSchema = new mongoose.Schema(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    cnic: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    phoneNumber: { type: String, trim: true, default: "" },
    branch: { type: String, trim: true, default: "" },
    designation: { type: String, trim: true, default: "" },
    qualification: { type: String, trim: true, default: "" },
    expertise: { type: String, trim: true, default: "" },
    salary: { type: Number, default: null },
    classInchargeClasses: { type: [String], default: [] },
    joiningDate: { type: Date, default: null },
    allowPasswordReset: { type: Boolean, default: true },
    loginPassword: { type: String, default: "", select: false },
    documents: {
      type: [
        {
          originalName: { type: String, trim: true, default: "" },
          fileName: { type: String, trim: true, default: "" },
          url: { type: String, trim: true, default: "" },
          mimeType: { type: String, trim: true, default: "" },
          size: { type: Number, default: 0 },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    signatureDataUrl: { type: String, default: "" },
    ...baseFields,
  },
  { timestamps: true }
);

export const TeacherProfile = mongoose.model("TeacherProfile", teacherProfileSchema);
