import { Student } from "../../models/Student.js";
import { Attendance } from "../../models/Attendance.js";
import { FeeAssignment } from "../../models/FeeAssignment.js";
import { FeePayment } from "../../models/FeePayment.js";
import { Fine } from "../../models/Fine.js";
import { FeeRefund } from "../../models/FeeRefund.js";
import { ApiError } from "../../utils/apiError.js";
import mongoose from "mongoose";

const CLASS_ORDER = [
  "Play Group",
  "Nursery",
  "Prep",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "Graduation",
];

const CLASS_DISPLAY_NAME = {
  Prep: "Preparatory",
};

const classSortIndex = (className = "") => {
  const idx = CLASS_ORDER.findIndex((item) => item.toLowerCase() === String(className || "").trim().toLowerCase());
  return idx >= 0 ? idx : CLASS_ORDER.length + 1;
};

const displayClassName = (className = "") => {
  const raw = String(className || "").trim();
  if (!raw) return "—";
  if (CLASS_DISPLAY_NAME[raw]) return CLASS_DISPLAY_NAME[raw];
  const match = CLASS_ORDER.find((item) => item.toLowerCase() === raw.toLowerCase());
  return match || raw;
};

export const getClassCodeForStudentId = (className = "") => {
  const raw = String(className || "").trim();
  if (!raw) return "X";
  const lower = raw.toLowerCase();
  if (lower === "play group" || lower === "play-group" || lower === "pg") return "PG";
  if (lower === "nursery") return "N";
  if (lower === "prep") return "P";
  const gradeMatch = /^grade\s*(\d+)$/i.exec(raw);
  if (gradeMatch) return String(Number(gradeMatch[1]));
  if (/^\d+$/.test(raw)) return String(Number(raw));
  return raw.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "X";
};

/** Student ID format: BC-1A-0001 (class code + section + sequence). */
export const generateAdmissionNo = async (className, section = "A") => {
  const classCode = getClassCodeForStudentId(className);
  const sectionCode = String(section || "A").trim().charAt(0).toUpperCase() || "A";
  const prefix = `BC-${classCode}${sectionCode}-`;

  const rows = await Student.find({
    admissionNo: { $regex: `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\d+$`, $options: "i" },
    isDeleted: false,
  })
    .select("admissionNo")
    .lean();

  let maxSeq = 0;
  rows.forEach((row) => {
    const match = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\d+)$`, "i").exec(
      String(row.admissionNo || "")
    );
    if (!match) return;
    const value = Number(match[1]);
    if (!Number.isNaN(value)) maxSeq = Math.max(maxSeq, value);
  });

  return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
};

const generateStudentLoginId = (data) => {
  const fullName = `${String(data.firstName || "")}${String(data.lastName || "")}`
    .replace(/[^a-z]/gi, "")
    .toLowerCase();
  if (!fullName) {
    const admission = String(data.admissionNo || "")
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase();
    return admission ? `${admission}@school.local` : `student${Date.now()}@school.local`;
  }
  return `${fullName}@gmail.com`;
};

const generateStudentLoginPassword = (data) => {
  const lettersPool = `${String(data.firstName || "")}${String(data.lastName || "")}`
    .replace(/[^a-z]/gi, "")
    .toUpperCase() || "STUDENT";
  const dob = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
  const dobDigits = dob && !Number.isNaN(dob.getTime())
    ? `${dob.getFullYear()}${String(dob.getMonth() + 1).padStart(2, "0")}${String(dob.getDate()).padStart(2, "0")}`
    : "";
  const digitsPool =
    `${String(data.admissionNo || "")}${String(data.rollNumber || "")}${String(data.cnicBForm || "")}${dobDigits}`
      .replace(/\D/g, "") || `${Date.now()}`;
  const byPool = "BY";
  const glPool = "GL";

  let hash = 0;
  const seed = `${lettersPool}|${digitsPool}|${String(data.admissionNo || "")}|BY|GL`;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 33 + seed.charCodeAt(i)) >>> 0;
  }

  const pick = (pool, offset = 0) => pool[(hash + offset) % pool.length];
  const passwordParts = [
    pick(lettersPool, 0),
    pick(lettersPool, 3),
    pick(digitsPool, 1),
    pick(digitsPool, 5),
    pick(lettersPool, 7),
    pick(lettersPool, 11),
    pick(digitsPool, 13),
    pick(digitsPool, 17),
    pick(byPool, hash % byPool.length),
    pick(glPool, (hash + 1) % glPool.length),
  ];

  return passwordParts.join("").slice(0, 10);
};

export const getNextRollNumber = async (className, section = "A") => {
  if (!className) throw new ApiError(400, "className is required");

  const normalizedSection = section || "A";
  const [count, rows] = await Promise.all([
    Student.countDocuments({
      className,
      section: normalizedSection,
      isDeleted: false,
    }),
    Student.find({
      className,
      section: normalizedSection,
      isDeleted: false,
    })
      .select("rollNumber")
      .lean(),
  ]);

  const numbers = rows
    .map((row) => parseInt(String(row.rollNumber || "").replace(/\D/g, ""), 10))
    .filter((value) => !Number.isNaN(value));

  const nextFromMax = numbers.length ? Math.max(...numbers) + 1 : 1;
  const next = Math.max(count + 1, nextFromMax);
  return String(next);
};

export const getNextStudentIdentifiers = async (className, section = "A") => {
  if (!className) throw new ApiError(400, "className is required");
  const normalizedSection = section || "A";
  const [rollNumber, admissionNo] = await Promise.all([
    getNextRollNumber(className, normalizedSection),
    generateAdmissionNo(className, normalizedSection),
  ]);
  return { rollNumber, admissionNo, studentId: admissionNo };
};

export const getNextClass = (current) => {
  if (!current) return null;
  const normalized = current.trim();
  const idx = CLASS_ORDER.findIndex((c) => c.toLowerCase() === normalized.toLowerCase());
  if (idx >= 0) return CLASS_ORDER[idx + 1] || null;

  const match = normalized.match(/grade\s*(\d+)/i);
  if (match) {
    const n = parseInt(match[1], 10);
    if (n < 10) return `Grade ${n + 1}`;
    return null;
  }
  return null;
};

const parsePage = (query) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  const search = (query.search || "").trim();
  const className = (query.className || "").trim();
  const section = (query.section || "").trim();
  const status = (query.status || "").trim();
  return { page, limit, search, className, section, status, skip: (page - 1) * limit };
};

const buildSearchFilter = (search) => {
  if (!search) return null;
  return {
    $or: [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { fatherName: { $regex: search, $options: "i" } },
      { rollNumber: { $regex: search, $options: "i" } },
      { admissionNo: { $regex: search, $options: "i" } },
      { guardianPhone: { $regex: search, $options: "i" } },
      { cnicBForm: { $regex: search, $options: "i" } },
      { address: { $regex: search, $options: "i" } },
    ],
  };
};

const normalizePreviousResults = (payload) => {
  if (Array.isArray(payload.previousResults) && payload.previousResults.length) {
    return payload.previousResults
      .map((row) => ({
        previousClass: (row.previousClass || "").trim(),
        resultGrade: (row.resultGrade || row.previousResultGrade || "").trim(),
        percentage: (row.percentage || row.previousResultPercentage || "").trim(),
        documentUrl: row.documentUrl || "",
      }))
      .filter((row) => row.previousClass || row.resultGrade || row.percentage || row.documentUrl);
  }

  const legacy = {
    previousClass: (payload.previousClass || "").trim(),
    resultGrade: (payload.previousResultGrade || "").trim(),
    percentage: (payload.previousResultPercentage || "").trim(),
    documentUrl: "",
  };

  return legacy.previousClass || legacy.resultGrade || legacy.percentage ? [legacy] : [];
};

const monthLabel = (date) => date.toLocaleString("en-US", { month: "long", year: "numeric" });

const createFeeRecordsForStudent = async (student, payload, actorId) => {
  const admissionFee = Number(payload.admissionFee || 0);
  const annualFee = Number(payload.annualFee || 0);
  const monthlyFee = Number(payload.monthlyFee || 0);
  const installmentCount = Math.max(0, Number(payload.installmentCount || 0));
  const useInstallments = Boolean(payload.useInstallments) && installmentCount > 0 && monthlyFee > 0;

  if (admissionFee > 0) {
    await FeeAssignment.create({
      studentId: student._id,
      feeType: "ADMISSION",
      title: "Admission Fee",
      amount: admissionFee,
      academicYear: new Date().getFullYear().toString(),
      createdBy: actorId,
      updatedBy: actorId,
    });
  }

  if (useInstallments) {
    const start = new Date();
    for (let i = 0; i < installmentCount; i += 1) {
      const due = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const label = monthLabel(due);
      await FeeAssignment.create({
        studentId: student._id,
        feeType: "TUITION",
        title: `Installment ${i + 1} of ${installmentCount} - ${label}`,
        amount: monthlyFee,
        month: label,
        academicYear: due.getFullYear().toString(),
        dueDate: new Date(due.getFullYear(), due.getMonth(), 10),
        createdBy: actorId,
        updatedBy: actorId,
      });
    }
  } else if (annualFee > 0) {
    await FeeAssignment.create({
      studentId: student._id,
      feeType: "ANNUAL",
      title: "Annual Fee",
      amount: annualFee,
      academicYear: new Date().getFullYear().toString(),
      createdBy: actorId,
      updatedBy: actorId,
    });
  }
};

const needsGeneratedStudentId = (admissionNo = "") => {
  const value = String(admissionNo || "").trim();
  if (!value) return true;
  return /^REG-/i.test(value) || /^ADM-/i.test(value);
};

const normalizePayload = (payload) => {
  const fatherName = (payload.fatherName || payload.guardianName || "").trim();
  const previousResults = normalizePreviousResults(payload);
  const firstPrevious = previousResults[0] || {};
  const guardianPhone = String(payload.callNumber || payload.guardianPhone || "").trim();
  const alternativePhone = String(payload.whatsappNumber || payload.alternativePhone || "").trim();

  return {
    firstName: payload.firstName?.trim(),
    lastName: payload.lastName?.trim() || "-",
    rollNumber: payload.rollNumber?.trim() || "",
    fatherName,
    cnicBForm: payload.cnicBForm?.trim() || "",
    guardianName: fatherName || payload.guardianName?.trim(),
    guardianPhone,
    gender: payload.gender,
    dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : new Date("2010-01-01"),
    className: payload.className?.trim(),
    section: (payload.section || "A").trim(),
    address: payload.address?.trim() || "",
    admissionNo: String(payload.admissionNo || payload.studentId || "").trim(),
    loginId: payload.loginId?.trim() || "",
    admissionDate: payload.admissionDate ? new Date(payload.admissionDate) : new Date(),
    studentPhotoUrl: payload.studentPhotoUrl || null,
    phoneNumber: payload.phoneNumber?.trim() || "",
    maritalStatus: payload.maritalStatus || "SINGLE",
    fatherCnic: payload.fatherCnic?.trim() || "",
    fatherOccupation: payload.fatherOccupation?.trim() || "",
    alternativePhone,
    previousClass: firstPrevious.previousClass || payload.previousClass?.trim() || "",
    previousResultGrade: firstPrevious.resultGrade || payload.previousResultGrade?.trim() || "",
    previousResultPercentage: firstPrevious.percentage || payload.previousResultPercentage?.trim() || "",
    previousResults,
    subjects: Array.isArray(payload.subjects)
      ? payload.subjects.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
    schoolLeavingCertificate: payload.schoolLeavingCertificate || "",
    characterCertificate: payload.characterCertificate || "",
    status: payload.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    admissionFee: Math.max(0, Number(payload.admissionFee || 0)),
    annualFee: Math.max(0, Number(payload.annualFee || 0)),
    monthlyFee: Math.max(0, Number(payload.monthlyFee || 0)),
    installmentCount: Math.max(0, Number(payload.installmentCount || 0)),
    useInstallments: Boolean(payload.useInstallments),
    loginPassword: payload.loginPassword?.trim() || "",
  };
};

const validateStudentPayload = (data, isUpdate = false) => {
  const required = isUpdate
    ? []
    : ["firstName", "lastName", "fatherName", "guardianPhone", "gender", "className"];

  const missing = required.filter((field) => !data[field]);
  if (missing.length) {
    throw new ApiError(400, `Missing required fields: ${missing.join(", ")}`);
  }
};

const ensureUniqueRoll = async (className, section, rollNumber, excludeId = null) => {
  if (!rollNumber) return;

  const filter = {
    className,
    section: section || "A",
    rollNumber,
    isDeleted: false,
  };

  if (excludeId) filter._id = { $ne: excludeId };

  const exists = await Student.findOne(filter).lean();
  if (exists) {
    throw new ApiError(409, "Roll number already exists in this class and section");
  }
};

export const listStudents = async (query) => {
  const { page, limit, search, className, section, status, skip } = parsePage(query);
  const filter = { isDeleted: false };

  if (className) filter.className = className;
  if (section) filter.section = section;
  if (status) filter.status = status;
  if (query.gender) {
    const gender = String(query.gender).trim().toUpperCase();
    if (["MALE", "FEMALE", "OTHER"].includes(gender)) filter.gender = gender;
  } else if (query.branch === "Boys" || query.branch === "Girls") {
    filter.gender = query.branch === "Girls" ? "FEMALE" : "MALE";
  }

  const searchFilter = buildSearchFilter(search);
  if (searchFilter) Object.assign(filter, searchFilter);

  const [items, total] = await Promise.all([
    Student.find(filter)
      .select("-loginPassword")
      .sort({ className: 1, rollNumber: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Student.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getStudentById = async (id) => {
  const student = await Student.findOne({ _id: id, isDeleted: false }).lean();
  if (!student) throw new ApiError(404, "Student not found");
  return student;
};

export const createStudent = async (payload, actorId) => {
  const data = normalizePayload(payload);
  validateStudentPayload(data);

  if (needsGeneratedStudentId(data.admissionNo)) {
    data.admissionNo = await generateAdmissionNo(data.className, data.section);
  }

  if (data.rollNumber) {
    await ensureUniqueRoll(data.className, data.section, data.rollNumber);
  } else {
    data.rollNumber = await getNextRollNumber(data.className, data.section);
  }

  const { useInstallments, ...studentData } = data;
  const loginId = studentData.loginId || generateStudentLoginId(studentData);
  const loginPassword = studentData.loginPassword || generateStudentLoginPassword(studentData);

  const student = await Student.create({
    ...studentData,
    loginId,
    loginPassword,
    createdBy: actorId,
    updatedBy: actorId,
  });

  await createFeeRecordsForStudent(
    student,
    {
      admissionFee: studentData.admissionFee,
      annualFee: studentData.annualFee,
      monthlyFee: studentData.monthlyFee,
      installmentCount: studentData.installmentCount,
      useInstallments,
    },
    actorId
  );

  return student;
};

export const updateStudent = async (id, payload, actorId) => {
  const student = await Student.findById(id);
  if (!student || student.isDeleted) {
    throw new ApiError(404, "Student not found");
  }

  const fields = [
    "firstName",
    "lastName",
    "rollNumber",
    "fatherName",
    "cnicBForm",
    "guardianName",
    "guardianPhone",
    "gender",
    "className",
    "section",
    "address",
    "admissionNo",
    "status",
    "studentPhotoUrl",
    "phoneNumber",
    "maritalStatus",
    "fatherCnic",
    "fatherOccupation",
    "alternativePhone",
    "previousClass",
    "previousResultGrade",
    "previousResultPercentage",
    "previousResults",
    "subjects",
    "schoolLeavingCertificate",
    "characterCertificate",
  ];

  fields.forEach((key) => {
    if (payload[key] !== undefined) {
      student[key] = typeof payload[key] === "string" ? payload[key].trim() : payload[key];
    }
  });

  if (payload.fatherName !== undefined) {
    student.fatherName = payload.fatherName.trim();
    student.guardianName = student.fatherName;
  }

  if (payload.dateOfBirth !== undefined) {
    student.dateOfBirth = new Date(payload.dateOfBirth);
  }

  if (payload.admissionDate !== undefined) {
    student.admissionDate = new Date(payload.admissionDate);
  }

  if (
    payload.firstName !== undefined ||
    payload.lastName !== undefined ||
    payload.fatherName !== undefined ||
    payload.guardianName !== undefined ||
    payload.admissionNo !== undefined ||
    payload.rollNumber !== undefined
  ) {
    student.loginId = generateStudentLoginId(student);
  }

  if (student.rollNumber) {
    await ensureUniqueRoll(student.className, student.section, student.rollNumber, student._id);
  }

  student.updatedBy = actorId;
  await student.save();

  return student;
};

export const deleteStudent = async (id, actorId) => {
  const student = await Student.findById(id);
  if (!student || student.isDeleted) {
    throw new ApiError(404, "Student not found");
  }

  student.isDeleted = true;
  student.updatedBy = actorId;
  await student.save();

  return { id };
};

export const promoteStudent = async (id, payload, actorId) => {
  const student = await Student.findById(id);
  if (!student || student.isDeleted) {
    throw new ApiError(404, "Student not found");
  }

  const previousClass = student.className;
  const nextClass = payload.className?.trim() || getNextClass(student.className);
  if (!nextClass) {
    throw new ApiError(400, "Student is already in the highest class or class cannot be promoted automatically");
  }

  student.className = nextClass;
  if (payload.section !== undefined) student.section = payload.section.trim() || student.section;
  student.updatedBy = actorId;
  await student.save();

  return { student, promotedFrom: previousClass, promotedTo: nextClass };
};

export const promoteClass = async (payload, actorId) => {
  const { fromClass, toClass, section } = payload;
  if (!fromClass) throw new ApiError(400, "fromClass is required");

  const targetClass = toClass?.trim() || getNextClass(fromClass);
  if (!targetClass) {
    throw new ApiError(400, "Cannot determine next class for promotion");
  }

  const filter = { className: fromClass, isDeleted: false, status: "ACTIVE" };
  if (section) filter.section = section;

  const result = await Student.updateMany(filter, {
    $set: { className: targetClass, updatedBy: actorId },
  });

  return { promoted: result.modifiedCount, fromClass, toClass: targetClass };
};

export const getClassOptions = async () => {
  const classes = await Student.distinct("className", { isDeleted: false });
  return classes.filter(Boolean).sort();
};

export const getClassSectionOptions = async () => {
  const rows = await Student.aggregate([
    { $match: { isDeleted: false, className: { $nin: [null, ""] } } },
    {
      $group: {
        _id: { className: "$className", section: { $ifNull: ["$section", "A"] } },
      },
    },
    { $sort: { "_id.className": 1, "_id.section": 1 } },
  ]);

  return rows.map((row) => {
    const className = row._id.className;
    const section = row._id.section || "A";
    return {
      className,
      section,
      label: `${className} ${section}`,
      value: `${className}|${section}`,
    };
  });
};

export const getPromotionClasses = async () => CLASS_ORDER;

export const getStudentFeePortfolio = async (id) => {
  const student = await Student.findOne({ _id: id, isDeleted: false }).lean();
  if (!student) throw new ApiError(404, "Student not found");

  const assignments = await FeeAssignment.find({ studentId: id, isDeleted: false })
    .sort({ dueDate: 1, createdAt: 1 })
    .lean();

  const payments = await FeePayment.find({ studentId: id, isDeleted: false })
    .sort({ paidAt: -1 })
    .lean();

  const feeRecords = assignments.map((a) => ({
    id: a._id,
    title: a.title,
    feeType: a.feeType,
    month: a.month,
    amount: a.amount,
    paidAmount: a.paidAmount,
    pendingAmount: Math.max(a.amount - a.paidAmount, 0),
    status: a.status,
    dueDate: a.dueDate,
  }));

  const totalPending = feeRecords.reduce((sum, row) => sum + row.pendingAmount, 0);
  const totalPaid = payments.reduce((sum, row) => sum + (row.netAmount || 0), 0);

  return {
    student: {
      _id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      admissionNo: student.admissionNo,
      className: student.className,
      section: student.section,
      monthlyFee: student.monthlyFee || 0,
      admissionFee: student.admissionFee || 0,
      admissionFeePaid: student.admissionFeePaid || false,
      academicStream: student.academicStream || "",
      streamDetail: student.streamDetail || "",
    },
    summary: {
      monthlyFee: student.monthlyFee || 0,
      admissionFee: student.admissionFee || 0,
      admissionFeePaid: student.admissionFeePaid || false,
      totalPending,
      totalPaid,
    },
    feeRecords,
    recentPayments: payments.slice(0, 10).map((p) => ({
      receiptNo: p.receiptNo,
      feeType: p.feeType,
      netAmount: p.netAmount,
      paidAt: p.paidAt,
      month: p.month,
    })),
  };
};

export const getStudentFinanceSummary = async (id) => {
  const student = await Student.findOne({ _id: id, isDeleted: false })
    .select("_id firstName lastName className section admissionNo")
    .lean();
  if (!student) throw new ApiError(404, "Student not found");

  const [assignments, payments, fines, refunds] = await Promise.all([
    FeeAssignment.find({ studentId: id, isDeleted: false }).sort({ dueDate: 1, createdAt: 1 }).lean(),
    FeePayment.find({ studentId: id, isDeleted: false }).sort({ paidAt: -1, createdAt: -1 }).lean(),
    Fine.find({ studentId: id, isDeleted: false }).sort({ createdAt: -1 }).lean(),
    FeeRefund.find({ studentId: id, isDeleted: false }).sort({ createdAt: -1 }).lean(),
  ]);

  const fees = assignments.map((row) => ({
    id: row._id,
    type: row.feeType,
    title: row.title,
    amount: Number(row.amount || 0),
    paidAmount: Number(row.paidAmount || 0),
    pendingAmount: Math.max(Number(row.amount || 0) - Number(row.paidAmount || 0), 0),
    status: row.status,
    dueDate: row.dueDate,
    month: row.month || "",
  }));

  const finesData = fines.map((row) => ({
    id: row._id,
    title: row.reason || row.fineType,
    fineType: row.fineType,
    amount: Number(row.amount || 0),
    status: row.status,
    date: row.createdAt,
    dueDate: row.dueDate,
    paidAt: row.paidAt,
  }));

  const refundsData = refunds.map((row) => ({
    id: row._id,
    refundNo: row.refundNo,
    title: row.reason || "Refund",
    amount: Number(row.amount || 0),
    status: row.status,
    refundType: row.refundType,
    date: row.createdAt,
    processedAt: row.processedAt,
  }));

  const feeTotal = fees.reduce((sum, row) => sum + row.amount, 0);
  const feePending = fees.reduce((sum, row) => sum + row.pendingAmount, 0);
  const feeCollected = fees.reduce((sum, row) => sum + row.paidAmount, 0);

  const fineTotal = finesData.reduce((sum, row) => sum + row.amount, 0);
  const fineCollected = finesData
    .filter((row) => row.status === "PAID")
    .reduce((sum, row) => sum + row.amount, 0);
  const finePending = finesData
    .filter((row) => row.status === "PENDING")
    .reduce((sum, row) => sum + row.amount, 0);

  const processedRefunds = refundsData
    .filter((row) => row.status === "PROCESSED")
    .reduce((sum, row) => sum + row.amount, 0);

  return {
    student,
    summary: {
      totalFees: feeTotal,
      collectedFees: feeCollected,
      pendingFees: feePending,
      totalFine: fineTotal,
      collectedFine: fineCollected,
      pendingFine: finePending,
      totalRefunds: processedRefunds,
      netCollection: feeCollected + fineCollected - processedRefunds,
    },
    fees,
    fines: finesData,
    refunds: refundsData,
    clearedFees: payments.map((row) => ({
      id: row._id,
      receiptNo: row.receiptNo,
      feeType: row.feeType,
      amount: Number(row.amount || 0),
      netAmount: Number(row.netAmount || 0),
      paidAt: row.paidAt,
      remarks: row.remarks || "",
    })),
  };
};

export const getStudentAttendanceTotals = async (studentIds = []) => {
  const ids = [...new Set((studentIds || []).filter(Boolean))];
  if (!ids.length) return {};

  const objectIds = ids
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (!objectIds.length) return {};

  const rows = await Attendance.aggregate([
    {
      $match: {
        isDeleted: false,
        studentId: { $in: objectIds },
      },
    },
    { $sort: { updatedAt: -1, createdAt: -1 } },
    {
      $group: {
        _id: {
          studentId: "$studentId",
          dateKey: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" },
          },
        },
        status: { $first: "$status" },
      },
    },
    {
      $group: {
        _id: { studentId: "$_id.studentId", status: "$status" },
        count: { $sum: 1 },
      },
    },
  ]);

  const totals = Object.fromEntries(ids.map((id) => [id, { present: 0, absent: 0, onLeave: 0 }]));

  rows.forEach((row) => {
    const id = row._id.studentId.toString();
    if (!totals[id]) totals[id] = { present: 0, absent: 0, onLeave: 0 };

    const count = row.count;
    if (row._id.status === "PRESENT" || row._id.status === "LATE") {
      totals[id].present += count;
    } else if (row._id.status === "ABSENT") {
      totals[id].absent += count;
    } else if (row._id.status === "LEAVE") {
      totals[id].onLeave += count;
    }
  });

  return totals;
};

const toLocalDateKey = (dateInput) => {
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getStudentAttendanceCalendar = async ({ studentId, year, month, from, to }) => {
  if (!studentId) throw new ApiError(400, "studentId is required");

  const student = await Student.findOne({ _id: studentId, isDeleted: false })
    .select("_id firstName lastName className section")
    .lean();

  if (!student) throw new ApiError(404, "Student not found");

  let rangeStart;
  let rangeEnd;
  let resolvedYear = Number(year) || null;
  let resolvedMonth = Number(month) || null;

  if (from && to) {
    rangeStart = new Date(`${from}T00:00:00`);
    rangeEnd = new Date(`${to}T23:59:59.999`);
    if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
      throw new ApiError(400, "Invalid from/to date range");
    }
    if (!resolvedYear) resolvedYear = rangeStart.getFullYear();
    if (!resolvedMonth) resolvedMonth = rangeStart.getMonth() + 1;
  } else {
    if (!year || !month) throw new ApiError(400, "year and month are required");
    const monthIndex = Number(month) - 1;
    rangeStart = new Date(Number(year), monthIndex, 1);
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd = new Date(Number(year), monthIndex + 1, 0);
    rangeEnd.setHours(23, 59, 59, 999);
  }

  const records = await Attendance.find({
    studentId,
    isDeleted: false,
    date: { $gte: rangeStart, $lte: rangeEnd },
  })
    .select("date status updatedAt createdAt")
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();

  const daysByDate = new Map();
  records.forEach((record) => {
    const key = toLocalDateKey(record.date);
    if (!key || daysByDate.has(key)) return;
    daysByDate.set(key, {
      date: key,
      status: record.status,
    });
  });

  const days = Array.from(daysByDate.values());
  const counts = days.reduce(
    (acc, day) => {
      if (day.status === "PRESENT") acc.present += 1;
      else if (day.status === "ABSENT") acc.absent += 1;
      else if (day.status === "LATE") acc.late += 1;
      else if (day.status === "LEAVE") acc.leave += 1;
      return acc;
    },
    { present: 0, absent: 0, late: 0, leave: 0 }
  );
  const marked = counts.present + counts.absent + counts.late + counts.leave;
  const attendancePercent = marked > 0 ? Math.round(((counts.present + counts.late) / marked) * 100) : 0;

  return {
    studentId: student._id,
    studentName: `${student.firstName || ""} ${student.lastName || ""}`.trim(),
    className: student.className,
    section: student.section || "A",
    year: resolvedYear,
    month: resolvedMonth,
    from: toLocalDateKey(rangeStart),
    to: toLocalDateKey(rangeEnd),
    days,
    counts,
    attendancePercent,
  };
};

export const getOverallAttendanceList = async (query = {}) => {
  const from = String(query.from || "").trim();
  const to = String(query.to || "").trim();
  if (!from || !to) throw new ApiError(400, "from and to dates are required");

  const rangeStart = new Date(`${from}T00:00:00`);
  const rangeEnd = new Date(`${to}T23:59:59.999`);
  if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
    throw new ApiError(400, "Invalid from/to date range");
  }
  if (rangeStart > rangeEnd) throw new ApiError(400, "from date cannot be after to date");

  const studentFilter = { isDeleted: false, status: "ACTIVE" };
  const className = String(query.className || "").trim();
  const section = String(query.section || "").trim();
  if (className) studentFilter.className = className;
  if (section) studentFilter.section = section;

  if (query.gender) {
    const gender = String(query.gender).trim().toUpperCase();
    if (["MALE", "FEMALE", "OTHER"].includes(gender)) studentFilter.gender = gender;
  } else if (query.branch === "Boys" || query.branch === "Girls") {
    studentFilter.gender = query.branch === "Girls" ? "FEMALE" : "MALE";
  }

  const students = await Student.find(studentFilter).select("_id className section gender").lean();

  const groups = new Map();
  const ensureGroup = (cls, sec) => {
    const key = `${cls}||${sec}`;
    if (!groups.has(key)) {
      groups.set(key, {
        className: cls,
        classLabel: displayClassName(cls),
        section: sec,
        enrolment: 0,
        studentIds: [],
        present: 0,
        absent: 0,
        onLeave: 0,
      });
    }
    return groups.get(key);
  };

  students.forEach((student) => {
    const cls = String(student.className || "").trim() || "—";
    const sec = String(student.section || "A").trim() || "A";
    const group = ensureGroup(cls, sec);
    group.enrolment += 1;
    group.studentIds.push(String(student._id));
  });

  const objectIds = students
    .map((student) => student._id)
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const latestByStudent = new Map();
  if (objectIds.length) {
    const attendanceRows = await Attendance.aggregate([
      {
        $match: {
          isDeleted: false,
          studentId: { $in: objectIds },
          date: { $gte: rangeStart, $lte: rangeEnd },
        },
      },
      { $sort: { date: -1, updatedAt: -1, createdAt: -1 } },
      {
        $group: {
          _id: "$studentId",
          status: { $first: "$status" },
          className: { $first: "$className" },
          section: { $first: "$section" },
        },
      },
    ]);

    attendanceRows.forEach((row) => {
      latestByStudent.set(String(row._id), row.status);
    });
  }

  groups.forEach((group) => {
    group.studentIds.forEach((studentId) => {
      const status = latestByStudent.get(studentId);
      if (status === "ABSENT") group.absent += 1;
      else if (status === "LEAVE") group.onLeave += 1;
      else group.present += 1; // PRESENT, LATE, or unmarked
    });
    delete group.studentIds;
  });

  const rows = [...groups.values()].sort((a, b) => {
    const classDiff = classSortIndex(a.className) - classSortIndex(b.className);
    if (classDiff !== 0) return classDiff;
    return String(a.section).localeCompare(String(b.section));
  });

  const totals = rows.reduce(
    (acc, row) => {
      acc.enrolment += row.enrolment;
      acc.absent += row.absent;
      acc.onLeave += row.onLeave;
      acc.present += row.present;
      return acc;
    },
    { enrolment: 0, absent: 0, onLeave: 0, present: 0 }
  );

  const marked = totals.present + totals.absent + totals.onLeave;
  const percentage = marked > 0 ? Math.round((totals.present / marked) * 100) : 0;

  const branch =
    query.branch === "Girls" || query.branch === "Boys"
      ? query.branch
      : studentFilter.gender === "FEMALE"
        ? "Girls"
        : "Boys";

  return {
    schoolName: "Insaf Grammer School",
    branch,
    from,
    to,
    rows,
    totals,
    percentage,
  };
};
