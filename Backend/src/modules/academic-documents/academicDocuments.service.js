import mongoose from "mongoose";
import { AcademicDocument } from "../../models/AcademicDocument.js";
import { Student } from "../../models/Student.js";
import { ApiError } from "../../utils/apiError.js";

const DOCUMENT_TYPES = ["ROLL_SLIP", "DATE_SHEET", "RESULT_CARD"];

const isDocumentVisible = (doc) => {
  if (!doc?.isReleased || doc.isDeleted) return false;
  if (!doc.releaseAt) return true;
  return new Date(doc.releaseAt).getTime() <= Date.now();
};

const normalizeSection = (section = "A") => String(section || "A").trim() || "A";

const buildBatchKey = (documentType, className, section, term, teacherId) =>
  `${documentType}:${className}:${normalizeSection(section)}:${term || "default"}:${teacherId}`;

const mapStudentGenderFilter = (branch) => {
  if (branch === "Girls") return "FEMALE";
  if (branch === "Boys") return "MALE";
  return "";
};

export const releaseRollSlips = async (teacherId, body) => {
  const className = String(body.className || "").trim();
  const section = normalizeSection(body.section);
  const term = String(body.term || body.slipType || "Examination").trim();
  const rows = Array.isArray(body.rows) ? body.rows : [];
  const releaseAt = body.releaseAt ? new Date(body.releaseAt) : null;
  const studentIds = [...new Set((body.studentIds || []).map((id) => String(id)).filter(Boolean))];

  if (!className) throw new ApiError(400, "className is required");
  if (!studentIds.length) throw new ApiError(400, "studentIds are required");

  const students = await Student.find({
    _id: { $in: studentIds },
    className,
    section,
    isDeleted: false,
  })
    .select("_id")
    .lean();

  if (!students.length) throw new ApiError(404, "No matching students found for this class");

  const batchKey = buildBatchKey("ROLL_SLIP", className, section, term, teacherId);
  const releasedAt = new Date();
  const payload = { rows, term, slipType: term };

  const docs = await Promise.all(
    students.map((student) =>
      AcademicDocument.findOneAndUpdate(
        {
          documentType: "ROLL_SLIP",
          studentId: student._id,
          className,
          section,
          term,
          isDeleted: false,
        },
        {
          teacherId,
          studentId: student._id,
          className,
          section,
          term,
          batchKey,
          releaseAt,
          releasedAt,
          isReleased: true,
          payload,
          updatedBy: teacherId,
          $setOnInsert: { createdBy: teacherId },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );

  return { count: docs.length, batchKey, items: docs };
};

export const releaseDateSheet = async (teacherId, body) => {
  const className = String(body.className || "").trim();
  const section = normalizeSection(body.section);
  const term = String(body.term || body.examTerm || "1st Term").trim();
  const rows = Array.isArray(body.rows) ? body.rows : [];
  const releaseAt = body.releaseAt ? new Date(body.releaseAt) : null;
  const studentIds = [...new Set((body.studentIds || []).map((id) => String(id)).filter(Boolean))];

  if (!className) throw new ApiError(400, "className is required");
  if (!rows.length) throw new ApiError(400, "rows are required");

  let targetStudentIds = studentIds;
  if (!targetStudentIds.length) {
    const students = await Student.find({ className, section, isDeleted: false }).select("_id").lean();
    targetStudentIds = students.map((row) => String(row._id));
  }
  if (!targetStudentIds.length) throw new ApiError(404, "No students found for this class");

  const batchKey = buildBatchKey("DATE_SHEET", className, section, term, teacherId);
  const releasedAt = new Date();
  const payload = {
    rows,
    term,
    examTerm: term,
    examStartDate: body.examStartDate || "",
    paperTime: body.paperTime || "",
    reportingTime: body.reportingTime || "",
  };

  const docs = await Promise.all(
    targetStudentIds.map((studentId) =>
      AcademicDocument.findOneAndUpdate(
        {
          documentType: "DATE_SHEET",
          studentId,
          className,
          section,
          term,
          isDeleted: false,
        },
        {
          teacherId,
          studentId,
          className,
          section,
          term,
          batchKey,
          releaseAt,
          releasedAt,
          isReleased: true,
          payload,
          updatedBy: teacherId,
          $setOnInsert: { createdBy: teacherId },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );

  return { count: docs.length, batchKey, items: docs };
};

export const releaseResultCard = async (teacherId, body) => {
  const className = String(body.className || "").trim();
  const section = normalizeSection(body.section);
  const term = String(body.term || "1st Term").trim();
  const studentId = String(body.studentId || "").trim();
  const marks = body.marks && typeof body.marks === "object" ? body.marks : {};
  const releaseAt = body.releaseAt ? new Date(body.releaseAt) : null;

  if (!studentId) throw new ApiError(400, "studentId is required");
  if (!className) throw new ApiError(400, "className is required");

  const student = await Student.findOne({ _id: studentId, isDeleted: false }).select("_id className section").lean();
  if (!student) throw new ApiError(404, "Student not found");

  const batchKey = buildBatchKey("RESULT_CARD", className, section, term, teacherId);
  const releasedAt = new Date();
  const payload = { marks, term };

  const doc = await AcademicDocument.findOneAndUpdate(
    {
      documentType: "RESULT_CARD",
      studentId,
      className,
      section,
      term,
      isDeleted: false,
    },
    {
      teacherId,
      studentId,
      className,
      section,
      term,
      batchKey,
      releaseAt,
      releasedAt,
      isReleased: true,
      payload,
      updatedBy: teacherId,
      $setOnInsert: { createdBy: teacherId },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return doc;
};

export const releaseResultCardsBatch = async (teacherId, body) => {
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) throw new ApiError(400, "items are required");

  const results = [];
  for (const item of items) {
    const doc = await releaseResultCard(teacherId, {
      ...item,
      className: item.className || body.className,
      section: item.section || body.section,
      term: item.term || body.term,
      releaseAt: item.releaseAt || body.releaseAt,
    });
    results.push(doc);
  }
  return { count: results.length, items: results };
};

export const listReleasedDocuments = async (query = {}, { role, userId } = {}) => {
  const documentType = String(query.documentType || "").trim().toUpperCase();
  if (!DOCUMENT_TYPES.includes(documentType)) {
    throw new ApiError(400, "Valid documentType is required");
  }

  const filter = {
    documentType,
    isDeleted: false,
    isReleased: true,
  };

  if (role === "STUDENT") {
    filter.studentId = userId;
  } else {
    if (query.className) filter.className = String(query.className).trim();
    if (query.section) filter.section = normalizeSection(query.section);
    if (query.term) filter.term = String(query.term).trim();
    if (query.studentId) filter.studentId = query.studentId;
  }

  const branchGender = mapStudentGenderFilter(query.branch);
  const docs = await AcademicDocument.find(filter)
    .sort({ releasedAt: -1, updatedAt: -1 })
    .populate("studentId", "firstName lastName fatherName guardianName admissionNo rollNumber gender className section studentPhotoUrl status")
    .lean();

  const visible = docs.filter(isDocumentVisible);
  if (!branchGender) {
    return visible.map(formatReleasedRow);
  }

  return visible
    .filter((doc) => doc.studentId && doc.studentId.gender === branchGender && doc.studentId.status !== "INACTIVE")
    .map(formatReleasedRow);
};

export const getReleasedDocumentForStudent = async ({ documentType, studentId, term = "" }) => {
  const filter = {
    documentType,
    studentId,
    isDeleted: false,
    isReleased: true,
  };
  if (term) filter.term = term;

  const docs = await AcademicDocument.find(filter).sort({ releasedAt: -1 }).lean();
  const doc = docs.find(isDocumentVisible);
  return doc || null;
};

export const getClassReleasedResultCardsForStudent = async (studentId) => {
  const student = await Student.findOne({ _id: studentId, isDeleted: false })
    .select("_id className section firstName lastName")
    .lean();
  if (!student) throw new ApiError(404, "Student not found");

  const docs = await AcademicDocument.find({
    documentType: "RESULT_CARD",
    className: student.className,
    section: normalizeSection(student.section),
    isDeleted: false,
    isReleased: true,
  })
    .sort({ releasedAt: -1, updatedAt: -1 })
    .populate("studentId", "firstName lastName fatherName guardianName admissionNo rollNumber gender className section studentPhotoUrl status")
    .lean();

  const visible = docs.filter(isDocumentVisible).map(formatReleasedRow);

  // Keep latest released card per student for the shared term of the newest release.
  const latestTerm = visible[0]?.term || "";
  const byStudent = new Map();
  visible
    .filter((row) => !latestTerm || row.term === latestTerm)
    .forEach((row) => {
      const sid = String(row.student?._id || "");
      if (!sid || byStudent.has(sid)) return;
      byStudent.set(sid, row);
    });

  return {
    className: student.className,
    section: normalizeSection(student.section),
    term: latestTerm,
    items: Array.from(byStudent.values()),
  };
};

export const updateReleasedDocument = async (id, payload, actorId) => {
  const doc = await AcademicDocument.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new ApiError(404, "Document not found");

  if (payload.term !== undefined) doc.term = String(payload.term || "").trim();
  if (payload.payload !== undefined) doc.payload = payload.payload;
  doc.updatedBy = actorId;
  await doc.save();
  return doc;
};

const formatReleasedRow = (doc) => {
  const student = doc.studentId && typeof doc.studentId === "object" ? doc.studentId : null;
  return {
    _id: doc._id,
    documentType: doc.documentType,
    term: doc.term,
    releaseAt: doc.releaseAt,
    releasedAt: doc.releasedAt,
    payload: doc.payload || {},
    batchKey: doc.batchKey,
    student: student
      ? {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          fatherName: student.fatherName,
          guardianName: student.guardianName,
          admissionNo: student.admissionNo,
          rollNumber: student.rollNumber,
          gender: student.gender,
          className: student.className,
          section: student.section,
          studentPhotoUrl: student.studentPhotoUrl,
        }
      : null,
  };
};

export const listTeacherDocuments = async (teacherId, query = {}) => {
  const filter = { teacherId, isDeleted: false };
  if (query.documentType) filter.documentType = String(query.documentType).trim().toUpperCase();
  if (query.className) filter.className = String(query.className).trim();
  if (query.section) filter.section = normalizeSection(query.section);

  return AcademicDocument.find(filter)
    .sort({ updatedAt: -1 })
    .populate("studentId", "firstName lastName rollNumber admissionNo")
    .lean();
};
