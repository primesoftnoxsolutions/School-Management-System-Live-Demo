import { FeePayment } from "../../models/FeePayment.js";
import { FeeAssignment } from "../../models/FeeAssignment.js";
import { Fine } from "../../models/Fine.js";
import { Student } from "../../models/Student.js";
import { User } from "../../models/User.js";
import { ApiError } from "../../utils/apiError.js";

const genReceipt = () => `RCP-${Date.now()}`;

const parsePage = (query) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  return { page, limit, search: (query.search || "").trim(), skip: (page - 1) * limit };
};

const paginate = (items, total, page, limit) => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit) || 1,
});

const studentIdsForClass = async (className, section) => {
  if (!className) return null;
  const filter = { isDeleted: false, className: className.trim() };
  if (section) filter.section = section.trim();
  const students = await Student.find(filter).select("_id").lean();
  return students.map((s) => s._id);
};

const syncAssignmentStatus = (assignment) => {
  if (assignment.paidAmount >= assignment.amount) {
    assignment.status = "PAID";
  } else if (assignment.paidAmount > 0) {
    assignment.status = "PARTIAL";
  } else {
    assignment.status = "PENDING";
  }
};

// --- Assignments ---

export const listAssignments = async (query) => {
  const { page, limit, search, skip } = parsePage(query);
  const filter = { isDeleted: false };
  if (query.status) filter.status = query.status;
  if (query.studentId) filter.studentId = query.studentId;

  const classStudentIds = await studentIdsForClass(query.className, query.section);
  if (classStudentIds) {
    if (!classStudentIds.length) return paginate([], 0, page, limit);
    filter.studentId = { $in: classStudentIds };
  }

  if (search) {
    const students = await Student.find({
      isDeleted: false,
      $or: [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { rollNumber: { $regex: search, $options: "i" } },
      ],
    }).select("_id");
    const studentIds = students.map((s) => s._id);
    if (filter.studentId?.$in) {
      const allowed = new Set(filter.studentId.$in.map(String));
      filter.studentId = { $in: studentIds.filter((id) => allowed.has(String(id))) };
    } else {
      filter.studentId = { $in: studentIds };
    }
  }

  if (query.pendingOnly === "true") {
    filter.status = { $in: ["PENDING", "PARTIAL"] };
  }

  const [items, total] = await Promise.all([
    FeeAssignment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("studentId", "firstName lastName rollNumber className section admissionNo")
      .lean(),
    FeeAssignment.countDocuments(filter),
  ]);

  return paginate(items, total, page, limit);
};

export const createAssignment = async (payload, actorId) => {
  const { studentId, feeType, title, amount, dueDate, month, academicYear } = payload;
  if (!studentId || !title || amount === undefined) {
    throw new ApiError(400, "studentId, title and amount are required");
  }

  const student = await Student.findOne({ _id: studentId, isDeleted: false });
  if (!student) throw new ApiError(404, "Student not found");

  return FeeAssignment.create({
    studentId,
    feeType: feeType || "TUITION",
    title: title.trim(),
    amount: Number(amount),
    dueDate: dueDate ? new Date(dueDate) : null,
    month: month?.trim() || "",
    academicYear: academicYear?.trim() || "",
    createdBy: actorId,
    updatedBy: actorId,
  });
};

export const updateAssignment = async (id, payload, actorId) => {
  const item = await FeeAssignment.findById(id);
  if (!item || item.isDeleted) throw new ApiError(404, "Fee assignment not found");

  ["title", "feeType", "month", "academicYear"].forEach((k) => {
    if (payload[k] !== undefined) item[k] = payload[k];
  });
  if (payload.amount !== undefined) item.amount = Number(payload.amount);
  if (payload.dueDate !== undefined) item.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
  item.updatedBy = actorId;
  syncAssignmentStatus(item);
  await item.save();
  return item;
};

export const deleteAssignment = async (id, actorId) => {
  const item = await FeeAssignment.findById(id);
  if (!item || item.isDeleted) throw new ApiError(404, "Fee assignment not found");
  item.isDeleted = true;
  item.updatedBy = actorId;
  await item.save();
  return { id };
};

// --- Payments ---

export const listPayments = async (query) => {
  const { page, limit, search, skip } = parsePage(query);
  const filter = { isDeleted: false };

  const classStudentIds = await studentIdsForClass(query.className, query.section);
  if (classStudentIds) {
    if (!classStudentIds.length) return paginate([], 0, page, limit);
    filter.studentId = { $in: classStudentIds };
  }

  if (query.from || query.to) {
    filter.paidAt = {};
    if (query.from) filter.paidAt.$gte = new Date(query.from);
    if (query.to) filter.paidAt.$lte = new Date(query.to);
  }
  if (query.feeType) filter.feeType = query.feeType;
  if (search) {
    filter.$or = [
      { receiptNo: { $regex: search, $options: "i" } },
      { month: { $regex: search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    FeePayment.find(filter)
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("studentId", "firstName lastName rollNumber className section admissionNo fatherName guardianPhone")
      .populate("receivedBy", "fullName")
      .lean(),
    FeePayment.countDocuments(filter),
  ]);

  return paginate(items, total, page, limit);
};

export const receivePayment = async (payload, actorId) => {
  const {
    studentId,
    assignmentId,
    assignmentIds,
    fineId,
    fineIds,
    feeType,
    amount,
    discount,
    fineAmount,
    paymentMethod,
    chequeNo,
    transactionRef,
    month,
    academicYear,
    remarks,
    paidAt,
  } = payload;

  const selectedAssignmentIds = [
    ...(Array.isArray(assignmentIds) ? assignmentIds : []),
    ...(assignmentId ? [assignmentId] : []),
  ]
    .filter(Boolean)
    .map(String);

  const selectedFineIds = [
    ...(Array.isArray(fineIds) ? fineIds : []),
    ...(fineId ? [fineId] : []),
  ]
    .filter(Boolean)
    .map(String);

  if (!studentId || (amount === undefined && !selectedAssignmentIds.length && !selectedFineIds.length)) {
    throw new ApiError(400, "studentId and amount are required");
  }

  const student = await Student.findOne({ _id: studentId, isDeleted: false });
  if (!student) throw new ApiError(404, "Student not found");

  let resolvedAmount = amount === undefined ? 0 : Number(amount);
  let resolvedDiscount = Number(discount || 0);
  let resolvedFineAmount = Number(fineAmount || 0);
  let resolvedFeeType = feeType || "TUITION";
  let resolvedMonth = month?.trim() || "";
  let resolvedAcademicYear = academicYear?.trim() || "";
  let resolvedRemarks = remarks?.trim() || "";
  let resolvedAssignmentIds = [];
  let resolvedFineIds = [];

  if (selectedAssignmentIds.length) {
    const assignments = await FeeAssignment.find({
      _id: { $in: selectedAssignmentIds },
      studentId,
      isDeleted: false,
    });

    const foundIds = new Set(assignments.map((item) => String(item._id)));
    const missingIds = selectedAssignmentIds.filter((id) => !foundIds.has(String(id)));
    if (missingIds.length) {
      throw new ApiError(400, "One or more selected fees are invalid");
    }

    resolvedAssignmentIds = assignments.map((item) => item._id);
    resolvedAmount = assignments.reduce((sum, item) => sum + Math.max(item.amount - item.paidAmount, 0), 0);
    resolvedDiscount = 0;
    resolvedFineAmount = 0;
    resolvedFeeType = assignments.length === 1 ? assignments[0].feeType : "OTHER";
    resolvedMonth = assignments.length === 1 ? assignments[0].month || "" : "";
    resolvedAcademicYear = assignments.length === 1 ? assignments[0].academicYear || "" : "";
    resolvedRemarks = resolvedRemarks || `Settled ${assignments.length} pending fee${assignments.length > 1 ? "s" : ""}`;
  }

  if (selectedFineIds.length) {
    const fines = await Fine.find({
      _id: { $in: selectedFineIds },
      studentId,
      isDeleted: false,
    }).lean();

    const foundIds = new Set(fines.map((item) => String(item._id)));
    const missingIds = selectedFineIds.filter((id) => !foundIds.has(String(id)));
    if (missingIds.length) {
      throw new ApiError(400, "One or more selected fines are invalid");
    }

    resolvedFineIds = fines.map((item) => item._id);
    const fineTotal = fines.reduce((sum, item) => sum + Math.max(Number(item.amount || 0), 0), 0);
    if (!selectedAssignmentIds.length) {
      resolvedAmount = fineTotal;
      resolvedFineAmount = 0;
      resolvedFeeType = "FINE";
      resolvedRemarks = resolvedRemarks || `Settled ${fines.length} pending fine${fines.length > 1 ? "s" : ""}`;
    } else if (resolvedFeeType === "TUITION") {
      resolvedFineAmount += fineTotal;
      resolvedFeeType = "OTHER";
    } else {
      resolvedFineAmount += fineTotal;
    }
  }

  const netAmount = Math.max(resolvedAmount - resolvedDiscount + resolvedFineAmount, 0);

  const payment = await FeePayment.create({
    studentId,
    receiptNo: genReceipt(),
    feeType: resolvedFeeType,
    amount: resolvedAmount,
    discount: resolvedDiscount,
    fineAmount: resolvedFineAmount,
    netAmount,
    paymentMethod: paymentMethod || "CASH",
    chequeNo: chequeNo?.trim() || "",
    transactionRef: transactionRef?.trim() || "",
    month: resolvedMonth,
    academicYear: resolvedAcademicYear,
    remarks: resolvedRemarks,
    paidAt: paidAt ? new Date(paidAt) : new Date(),
    receivedBy: actorId,
    assignmentIds: resolvedAssignmentIds,
    fineIds: resolvedFineIds,
    createdBy: actorId,
    updatedBy: actorId,
  });

  if (resolvedAssignmentIds.length) {
    await Promise.all(
      resolvedAssignmentIds.map(async (id) => {
        const assignment = await FeeAssignment.findById(id);
        if (assignment && !assignment.isDeleted) {
          assignment.paidAmount = assignment.amount;
          syncAssignmentStatus(assignment);
          assignment.updatedBy = actorId;
          await assignment.save();
        }
      })
    );
  } else if (assignmentId) {
    const assignment = await FeeAssignment.findById(assignmentId);
    if (assignment && !assignment.isDeleted) {
      assignment.paidAmount += netAmount;
      syncAssignmentStatus(assignment);
      assignment.updatedBy = actorId;
      await assignment.save();
    }
  }

  if (resolvedFineIds.length) {
    const fines = await Promise.all(resolvedFineIds.map((id) => Fine.findById(id)));
    await Promise.all(
      fines.map(async (fine) => {
        if (fine && !fine.isDeleted) {
          fine.status = "PAID";
          fine.paidAt = payment.paidAt;
          fine.paymentMethod = payment.paymentMethod;
          fine.updatedBy = actorId;
          await fine.save();
        }
      })
    );
  }

  const slip = await getPaymentSlip(payment._id);
  return { payment, slip };
};

export const getPaymentSlip = async (id) => {
  const payment = await FeePayment.findById(id)
    .populate("studentId", "firstName lastName rollNumber className section admissionNo fatherName guardianPhone")
    .populate("receivedBy", "fullName")
    .lean();

  if (!payment || payment.isDeleted) throw new ApiError(404, "Payment not found");

  return {
    schoolName: "Insaaf Grammer High School",
    receiptNo: payment.receiptNo,
    paidAt: payment.paidAt,
    student: payment.studentId,
    feeType: payment.feeType,
    amount: payment.amount,
    discount: payment.discount,
    fineAmount: payment.fineAmount,
    netAmount: payment.netAmount,
    paymentMethod: payment.paymentMethod,
    chequeNo: payment.chequeNo,
    transactionRef: payment.transactionRef,
    month: payment.month,
    academicYear: payment.academicYear,
    remarks: payment.remarks,
    receivedBy: payment.receivedBy?.fullName || "",
  };
};

export const deletePayment = async (id, actorId) => {
  const item = await FeePayment.findById(id);
  if (!item || item.isDeleted) throw new ApiError(404, "Payment not found");
  item.isDeleted = true;
  item.updatedBy = actorId;
  await item.save();
  return { id };
};

export const getPendingFeesSummary = async (query = {}) => {
  const filter = {
    isDeleted: false,
    status: { $in: ["PENDING", "PARTIAL"] },
  };

  const classStudentIds = await studentIdsForClass(query.className, query.section);
  if (classStudentIds) {
    if (!classStudentIds.length) return [];
    filter.studentId = { $in: classStudentIds };
  }

  const assignments = await FeeAssignment.find(filter)
    .populate("studentId", "firstName lastName className section admissionNo rollNumber")
    .lean();

  const creatorIds = [...new Set(assignments.map((item) => item.createdBy).filter(Boolean))];
  const creators = creatorIds.length
    ? await User.find({ _id: { $in: creatorIds } }).select("fullName").lean()
    : [];
  const creatorNameById = new Map(creators.map((user) => [String(user._id), user.fullName || ""]));

  return assignments.map((a) => ({
    id: a._id,
    studentId: a.studentId?._id,
    teacherName: creatorNameById.get(String(a.createdBy)) || a.createdBy || "",
    studentName: a.studentId ? `${a.studentId.firstName} ${a.studentId.lastName}` : "",
    className: a.studentId?.className || "",
    section: a.studentId?.section || "A",
    admissionNo: a.studentId?.admissionNo || "",
    rollNumber: a.studentId?.rollNumber || "",
    title: a.title,
    feeType: a.feeType,
    pendingAmount: a.amount - a.paidAmount,
    status: a.status,
    dueDate: a.dueDate,
  }));
};
