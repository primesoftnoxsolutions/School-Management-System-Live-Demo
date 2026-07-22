import { LeavingCertificate } from "../../models/LeavingCertificate.js";
import { Student } from "../../models/Student.js";
import { Attendance } from "../../models/Attendance.js";
import { FeeAssignment } from "../../models/FeeAssignment.js";
import { ApiError } from "../../utils/apiError.js";

const genCertificateNo = () => `SLC-${Date.now()}`;

const parsePage = (query) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  return { page, limit, search: (query.search || "").trim(), skip: (page - 1) * limit };
};

export const listLeavingCertificates = async (query) => {
  const { page, limit, search, skip } = parsePage(query);
  const filter = { isDeleted: false };

  if (search) {
    filter.$or = [
      { certificateNo: { $regex: search, $options: "i" } },
      { studentName: { $regex: search, $options: "i" } },
      { fatherName: { $regex: search, $options: "i" } },
      { className: { $regex: search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    LeavingCertificate.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("studentId", "firstName lastName admissionNo rollNumber")
      .lean(),
    LeavingCertificate.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const createLeavingCertificate = async (payload, actorId) => {
  const {
    studentId,
    dateOfLeaving,
    reasonForLeaving,
    conduct,
    remarks,
    dateOfBirth,
    dateOfAdmission,
    certificateType = "LEAVING",
  } = payload;

  if (!studentId || !dateOfLeaving || !reasonForLeaving) {
    throw new ApiError(400, "studentId, dateOfLeaving and reasonForLeaving are required");
  }

  const student = await Student.findOne({ _id: studentId, isDeleted: false });
  if (!student) throw new ApiError(404, "Student not found");

  const [lastAttendance, pendingFees] = await Promise.all([
    Attendance.findOne({ studentId: student._id, isDeleted: false }).sort({ date: -1 }).select("date").lean(),
    FeeAssignment.find({
      studentId: student._id,
      isDeleted: false,
      status: { $in: ["PENDING", "PARTIAL"] },
    })
      .select("amount paidAmount")
      .lean(),
  ]);

  const pendingAmount = pendingFees.reduce(
    (sum, row) => sum + Math.max(Number(row.amount || 0) - Number(row.paidAmount || 0), 0),
    0
  );
  const feesStatus = pendingAmount > 0 ? `Pending dues: Rs. ${pendingAmount.toLocaleString()}` : "No outstanding dues";
  const attendanceRemarks = lastAttendance?.date
    ? `Last attendance recorded on ${new Date(lastAttendance.date).toLocaleDateString("en-GB")}`
    : "Attendance record available in system";
  const academicPerformance =
    student.previousResultGrade || student.previousResultPercentage
      ? `Previous result: ${student.previousResultGrade || "Grade N/A"} ${student.previousResultPercentage ? `(${student.previousResultPercentage}%)` : ""}`.trim()
      : "Academic record maintained by the school";
  const promotionStatus = certificateType === "CHARACTER" ? "N/A" : "Enrollment terminated";

  const certificate = await LeavingCertificate.create({
    certificateNo: genCertificateNo(),
    studentId: student._id,
    studentName: `${student.firstName} ${student.lastName}`.trim(),
    certificateType: certificateType === "CHARACTER" ? "CHARACTER" : "LEAVING",
    fatherName: student.fatherName || student.guardianName || "",
    className: student.className,
    section: student.section || "A",
    rollNumber: student.rollNumber || "",
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : student.dateOfBirth,
    dateOfAdmission: dateOfAdmission ? new Date(dateOfAdmission) : student.admissionDate,
    dateOfLeaving: new Date(dateOfLeaving),
    lastAttendanceDate: lastAttendance?.date || null,
    reasonForLeaving: reasonForLeaving.trim(),
    conduct: conduct?.trim() || "Good",
    academicPerformance,
    attendanceRemarks,
    feesStatus,
    promotionStatus,
    issueDate: new Date(),
    academicStream: student.academicStream || "",
    remarks: remarks?.trim() || "",
    createdBy: actorId,
    updatedBy: actorId,
  });

  student.lastAttendanceDate = lastAttendance?.date || student.lastAttendanceDate || null;
  student.characterCertificate =
    certificate.certificateType === "CHARACTER" ? certificate.certificateNo : student.characterCertificate;
  if (certificate.certificateType === "LEAVING") {
    student.status = "INACTIVE";
    student.enrollmentStatus = "TERMINATED";
    student.portalAccessEnabled = false;
    student.leftSchoolAt = new Date(dateOfLeaving);
    student.leavingReason = reasonForLeaving.trim();
    student.terminationRemarks = remarks?.trim() || `Certificate issued: ${certificate.certificateNo}`;
    student.schoolLeavingCertificate = certificate.certificateNo;
  }
  student.updatedBy = actorId;
  await student.save();

  return certificate;
};

export const getLeavingCertificate = async (id) => {
  const item = await LeavingCertificate.findOne({ _id: id, isDeleted: false })
    .populate("studentId", "firstName lastName admissionNo cnicBForm guardianPhone address")
    .lean();
  if (!item) throw new ApiError(404, "Leaving certificate not found");
  return item;
};
