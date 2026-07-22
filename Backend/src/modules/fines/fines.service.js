import { Fine } from "../../models/Fine.js";
import { Student } from "../../models/Student.js";
import { FeePayment } from "../../models/FeePayment.js";
import { ApiError } from "../../utils/apiError.js";

const genReceipt = () => `RCP-${Date.now()}`;

const parsePage = (query) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  return { page, limit, search: (query.search || "").trim(), skip: (page - 1) * limit };
};

export const listFines = async (query) => {
  const { page, limit, search, skip } = parsePage(query);
  const filter = { isDeleted: false };
  if (query.status) filter.status = query.status;
  if (query.fineType) filter.fineType = query.fineType;
  if (query.studentId) filter.studentId = query.studentId;

  if (search) {
    filter.$or = [{ reason: { $regex: search, $options: "i" } }];
  }

  const [items, total] = await Promise.all([
    Fine.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("studentId", "firstName lastName rollNumber className admissionNo")
      .populate("issuedBy", "fullName")
      .lean(),
    Fine.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
};

export const createFine = async (payload, actorId) => {
  const { studentId, fineType, amount, reason, dueDate } = payload;
  if (!studentId || !amount || !reason) {
    throw new ApiError(400, "studentId, amount and reason are required");
  }

  const student = await Student.findOne({ _id: studentId, isDeleted: false });
  if (!student) throw new ApiError(404, "Student not found");

  return Fine.create({
    studentId,
    fineType: fineType || "OTHER",
    amount: Number(amount),
    reason: reason.trim(),
    dueDate: dueDate ? new Date(dueDate) : null,
    issuedBy: actorId,
    createdBy: actorId,
    updatedBy: actorId,
  });
};

export const updateFine = async (id, payload, actorId) => {
  const item = await Fine.findById(id);
  if (!item || item.isDeleted) throw new ApiError(404, "Fine not found");

  if (payload.fineType !== undefined) item.fineType = payload.fineType;
  if (payload.amount !== undefined) item.amount = Number(payload.amount);
  if (payload.reason !== undefined) item.reason = payload.reason;
  if (payload.dueDate !== undefined) item.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
  item.updatedBy = actorId;
  await item.save();
  return item;
};

export const payFine = async (id, payload, actorId) => {
  const item = await Fine.findById(id);
  if (!item || item.isDeleted) throw new ApiError(404, "Fine not found");
  if (item.status === "PAID") throw new ApiError(400, "Fine already paid");

  const paidAt = new Date();
  const paymentMethod = payload.paymentMethod || "CASH";
  await FeePayment.create({
    studentId: item.studentId,
    receiptNo: genReceipt(),
    feeType: "FINE",
    amount: Number(item.amount || 0),
    discount: 0,
    fineAmount: 0,
    netAmount: Number(item.amount || 0),
    fineIds: [item._id],
    paymentMethod,
    remarks: payload.remarks?.trim() || `Fine collected (${item.fineType})`,
    paidAt,
    receivedBy: actorId,
    createdBy: actorId,
    updatedBy: actorId,
  });

  item.status = "PAID";
  item.paymentMethod = paymentMethod;
  item.paidAt = paidAt;
  item.updatedBy = actorId;
  await item.save();
  return item;
};

export const waiveFine = async (id, payload, actorId) => {
  const item = await Fine.findById(id);
  if (!item || item.isDeleted) throw new ApiError(404, "Fine not found");

  item.status = "WAIVED";
  item.waivedReason = payload.waivedReason?.trim() || "";
  item.updatedBy = actorId;
  await item.save();
  return item;
};

export const deleteFine = async (id, actorId) => {
  const item = await Fine.findById(id);
  if (!item || item.isDeleted) throw new ApiError(404, "Fine not found");
  item.isDeleted = true;
  item.updatedBy = actorId;
  await item.save();
  return { id };
};
