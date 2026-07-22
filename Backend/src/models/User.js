import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { baseFields } from "./baseFields.js";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ACCOUNTANT", "TEACHER"],
      default: "TEACHER",
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    signatureDataUrl: { type: String, default: "" },
    ...baseFields,
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema);
