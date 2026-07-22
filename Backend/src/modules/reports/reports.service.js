import { FeePayment } from "../../models/FeePayment.js";
import { FeeAssignment } from "../../models/FeeAssignment.js";
import { FeeRefund } from "../../models/FeeRefund.js";
import { Fine } from "../../models/Fine.js";
import { Payroll } from "../../models/Payroll.js";
import { Student } from "../../models/Student.js";
import { User } from "../../models/User.js";
import { Admission } from "../../models/Admission.js";
import { Attendance } from "../../models/Attendance.js";
import { getTeacherAttendanceStats } from "../teacher-attendance/teacherAttendance.service.js";

const dateRange = (from, to) => {
  const range = {};
  if (from) range.$gte = new Date(from);
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return Object.keys(range).length ? range : null;
};

export const getOverviewReport = async () => {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date();
  dayEnd.setHours(23, 59, 59, 999);

  const [
    totalStudents,
    totalTeachers,
    removedStudents,
    removedTeachers,
    feeCollectedAgg,
    pendingAgg,
    finePendingAgg,
    finePaidAgg,
    fineTotalAgg,
    refundProcessedAgg,
    payrollPendingAgg,
    payrollPaidAgg,
    teacherAttendance,
    todayStudentAttendance,
  ] = await Promise.all([
    Student.countDocuments({ isDeleted: false }),
    User.countDocuments({ role: "TEACHER", isDeleted: false, isActive: true }),
    Student.countDocuments({ isDeleted: true }),
    User.countDocuments({ role: "TEACHER", isDeleted: true }),
    FeePayment.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, total: { $sum: "$netAmount" } } },
    ]),
    FeeAssignment.aggregate([
      { $match: { isDeleted: false, status: { $in: ["PENDING", "PARTIAL"] } } },
      { $group: { _id: null, total: { $sum: { $subtract: ["$amount", "$paidAmount"] } } } },
    ]),
    Fine.aggregate([
      { $match: { isDeleted: false, status: "PENDING" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Fine.aggregate([
      { $match: { isDeleted: false, status: "PAID" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Fine.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    FeeRefund.aggregate([
      { $match: { isDeleted: false, status: "PROCESSED" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payroll.aggregate([
      { $match: { isDeleted: false, status: "PENDING" } },
      { $group: { _id: null, total: { $sum: "$netSalary" } } },
    ]),
    Payroll.aggregate([
      { $match: { isDeleted: false, status: "PAID" } },
      { $group: { _id: null, total: { $sum: "$netSalary" } } },
    ]),
    getTeacherAttendanceStats(),
    Attendance.find({
      isDeleted: false,
      date: { $gte: dayStart, $lte: dayEnd },
    }).lean(),
  ]);

  const presentStudents = todayStudentAttendance.filter((row) => row.status === "PRESENT" || row.status === "LATE").length;
  const absentStudents = todayStudentAttendance.filter((row) => row.status === "ABSENT").length;
  const collectedFees = feeCollectedAgg[0]?.total || 0;
  const collectedFine = finePaidAgg[0]?.total || 0;
  const totalRefunds = refundProcessedAgg[0]?.total || 0;
  const netCollection = collectedFees + collectedFine - totalRefunds;

  return {
    totalStudents,
    absentStudents,
    presentStudents,
    feeCollected: collectedFees,
    pendingFees: pendingAgg[0]?.total || 0,
    totalFine: fineTotalAgg[0]?.total || 0,
    finesPending: finePendingAgg[0]?.total || 0,
    finesCollected: collectedFine,
    totalRefunds,
    netCollection,
    removedStudents,
    totalTeachers,
    presentTeachers: teacherAttendance.presentTeachers || 0,
    absentTeachers: teacherAttendance.absentTeachers || 0,
    paidSalaries: payrollPaidAgg[0]?.total || 0,
    pendingSalaries: payrollPendingAgg[0]?.total || 0,
    removedTeachers,
    payrollPending: payrollPendingAgg[0]?.total || 0,
    payrollPaid: payrollPaidAgg[0]?.total || 0,
  };
};

export const getFeeCollectionReport = async (query) => {
  const filter = { isDeleted: false };
  const range = dateRange(query.from, query.to);
  if (range) filter.paidAt = range;
  if (query.feeType) filter.feeType = query.feeType;

  const [payments, summary] = await Promise.all([
    FeePayment.find(filter)
      .sort({ paidAt: -1 })
      .populate("studentId", "firstName lastName className section rollNumber admissionNo")
      .populate("receivedBy", "fullName")
      .lean(),
    FeePayment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$feeType",
          total: { $sum: "$netAmount" },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  return { payments, summary, totalCollected: summary.reduce((s, r) => s + r.total, 0) };
};

export const getPendingFeesReport = async () => {
  const items = await FeeAssignment.find({
    isDeleted: false,
    status: { $in: ["PENDING", "PARTIAL"] },
  })
    .populate("studentId", "firstName lastName className section rollNumber admissionNo")
    .sort({ dueDate: 1 })
    .lean();

  return items.map((a) => ({
    student: a.studentId,
    title: a.title,
    feeType: a.feeType,
    totalAmount: a.amount,
    paidAmount: a.paidAmount,
    pendingAmount: a.amount - a.paidAmount,
    status: a.status,
    dueDate: a.dueDate,
    month: a.month,
  }));
};

export const getRefundReport = async (query) => {
  const filter = { isDeleted: false };
  if (query.status) filter.status = query.status;
  const range = dateRange(query.from, query.to);
  if (range) filter.createdAt = range;

  const items = await FeeRefund.find(filter)
    .sort({ createdAt: -1 })
    .populate("studentId", "firstName lastName className")
    .populate("requestedBy", "fullName")
    .lean();

  const total = items.reduce((s, i) => s + (i.status === "PROCESSED" ? i.amount : 0), 0);
  return { items, total };
};

export const getFineReport = async (query) => {
  const filter = { isDeleted: false };
  if (query.status) filter.status = query.status;
  if (query.fineType) filter.fineType = query.fineType;
  const range = dateRange(query.from, query.to);
  if (range) filter.createdAt = range;

  const items = await Fine.find(filter)
    .sort({ createdAt: -1 })
    .populate("studentId", "firstName lastName className")
    .populate("issuedBy", "fullName")
    .lean();

  const summary = await Fine.aggregate([
    { $match: filter },
    { $group: { _id: "$status", total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);

  return { items, summary };
};

export const getPayrollReport = async (query) => {
  const filter = { isDeleted: false };
  if (query.month) filter.month = query.month;
  if (query.year) filter.year = Number(query.year);
  if (query.status) filter.status = query.status;

  const items = await Payroll.find(filter).sort({ year: -1, month: -1 }).lean();
  const total = items.reduce((sum, item) => sum + item.netSalary, 0);
  return { items, total };
};

export const getStudentReport = async (query = {}) => {
  const filter = { isDeleted: false };
  if (query.className) filter.className = query.className;
  if (query.section) filter.section = query.section;
  if (query.status) filter.status = query.status;
  if (query.gender) {
    const gender = String(query.gender).trim().toUpperCase();
    if (["MALE", "FEMALE", "OTHER"].includes(gender)) filter.gender = gender;
  } else if (query.branch === "Boys" || query.branch === "Girls") {
    filter.gender = query.branch === "Girls" ? "FEMALE" : "MALE";
  }

  const [byClass, byGender, total, items] = await Promise.all([
    Student.aggregate([
      { $match: filter },
      { $group: { _id: "$className", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Student.aggregate([
      { $match: filter },
      { $group: { _id: "$gender", count: { $sum: 1 } } },
    ]),
    Student.countDocuments(filter),
    Student.find(filter)
      .sort({ className: 1, section: 1, rollNumber: 1 })
      .select("firstName lastName fatherName className section rollNumber admissionNo gender status mobile")
      .lean(),
  ]);

  return { total, byClass, byGender, items };
};

export const getAdmissionReport = async (query) => {
  const filter = { isDeleted: false };
  const range = dateRange(query.from, query.to);
  if (range) filter.createdAt = range;
  if (query.status) filter.status = query.status;

  const [total, byStatus, recent] = await Promise.all([
    Admission.countDocuments(filter),
    Admission.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Admission.find(filter)
      .sort({ createdAt: -1 })
      .populate({ path: "studentId", select: "firstName lastName className section admissionNo" })
      .lean(),
  ]);

  return { total, byStatus, recent };
};

export const getAttendanceReport = async (query) => {
  const filter = { isDeleted: false };
  const range = dateRange(query.from, query.to);
  if (range) filter.date = range;
  if (query.className) filter.className = query.className;
  if (query.section) filter.section = query.section;
  if (query.status) filter.status = query.status;

  const [summary, byClass, items] = await Promise.all([
    Attendance.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Attendance.aggregate([
      { $match: filter },
      { $group: { _id: { className: "$className", status: "$status" }, count: { $sum: 1 } } },
    ]),
    Attendance.find(filter)
      .sort({ date: -1 })
      .populate("studentId", "firstName lastName rollNumber admissionNo")
      .lean(),
  ]);

  return { summary, byClass, items };
};
