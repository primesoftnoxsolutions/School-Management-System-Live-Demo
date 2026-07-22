import { FeeRefund } from "../../models/FeeRefund.js";
import { FeePayment } from "../../models/FeePayment.js";
import { Student } from "../../models/Student.js";
import { ApiError } from "../../utils/apiError.js";

const genRefundNo = () => `REF-${Date.now()}`;

const parsePage = (query) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  return { page, limit, search: (query.search || "").trim(), skip: (page - 1) * limit };
};

export const listRefunds = async (query) => {
  const { page, limit, search, skip } = parsePage(query);
  const filter = { isDeleted: false };
  if (query.status) filter.status = query.status;

  if (search) {
    filter.$or = [
      { refundNo: { $regex: search, $options: "i" } },
      { reason: { $regex: search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    FeeRefund.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("studentId", "firstName lastName rollNumber className admissionNo")
      .populate("paymentId", "receiptNo netAmount")
      .populate("requestedBy", "fullName")
      .lean(),
    FeeRefund.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
};

export const createRefund = async (payload, actorId) => {
  const { studentId, paymentId, amount, reason, refundMethod, refundType, remarks } = payload;
  if (!studentId || !amount || !reason) {
    throw new ApiError(400, "studentId, amount and reason are required");
  }

  const student = await Student.findOne({ _id: studentId, isDeleted: false });
  if (!student) throw new ApiError(404, "Student not found");

  if (paymentId) {
    const payment = await FeePayment.findOne({ _id: paymentId, isDeleted: false });
    if (!payment) throw new ApiError(404, "Payment not found");
    if (Number(amount) > payment.netAmount) {
      throw new ApiError(400, "Refund amount cannot exceed payment amount");
    }
  }

  return FeeRefund.create({
    studentId,
    paymentId: paymentId || null,
    refundNo: genRefundNo(),
    amount: Number(amount),
    reason: reason.trim(),
    refundType: refundType || "FEES",
    refundMethod: refundMethod || "CASH",
    remarks: remarks?.trim() || "",
    requestedBy: actorId,
    createdBy: actorId,
    updatedBy: actorId,
  });
};

export const updateRefundStatus = async (id, payload, actorId) => {
  const item = await FeeRefund.findById(id);
  if (!item || item.isDeleted) throw new ApiError(404, "Refund not found");

  const { status, remarks } = payload;
  if (!["PENDING", "APPROVED", "REJECTED", "PROCESSED"].includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  item.status = status;
  if (remarks !== undefined) item.remarks = remarks;
  if (status === "PROCESSED") item.processedAt = new Date();
  item.updatedBy = actorId;
  await item.save();
  return item;
};

export const deleteRefund = async (id, actorId) => {
  const item = await FeeRefund.findById(id);
  if (!item || item.isDeleted) throw new ApiError(404, "Refund not found");
  item.isDeleted = true;
  item.updatedBy = actorId;
  await item.save();
  return { id };
};
