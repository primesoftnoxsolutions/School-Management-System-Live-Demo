import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createTeacher,
  getMyTeacherPanel,
  getTeacherActivities,
  getTeacherAssignmentHistory,
  getTeachersByClass,
  listTeachers,
  removeTeacherFromSchool,
  saveMyTeacherSignature,
  updateTeacher,
} from "./teachers.service.js";

const parseBodyArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const parseBodyBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return undefined;
};

const buildTeacherPayload = (req) => {
  const payload = { ...req.body };
  const parsedAssignments = parseBodyArray(req.body.assignments);
  if (parsedAssignments) payload.assignments = parsedAssignments;
  const parsedClassIncharge = parseBodyArray(req.body.classInchargeClasses);
  if (parsedClassIncharge) payload.classInchargeClasses = parsedClassIncharge;
  const allowPasswordReset = parseBodyBoolean(req.body.allowPasswordReset);
  if (allowPasswordReset !== undefined) payload.allowPasswordReset = allowPasswordReset;
  const isActive = parseBodyBoolean(req.body.isActive);
  if (isActive !== undefined) payload.isActive = isActive;

  if (Array.isArray(req.files) && req.files.length) {
    payload.documents = req.files.map((file) => ({
      originalName: file.originalname,
      fileName: file.filename,
      url: `/api/v1/uploads/teachers/documents/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    }));
  } else {
    const parsedDocuments = parseBodyArray(req.body.documents);
    if (parsedDocuments) payload.documents = parsedDocuments;
  }

  return payload;
};

export const createTeacherAccount = asyncHandler(async (req, res) => {
  const teacher = await createTeacher(buildTeacherPayload(req), req.user._id.toString());
  res.status(201).json({ success: true, data: teacher });
});

export const putTeacherAccount = asyncHandler(async (req, res) => {
  const teacher = await updateTeacher(req.params.id, buildTeacherPayload(req), req.user._id.toString());
  res.status(200).json({ success: true, data: teacher });
});

export const getTeachers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
  const search = (req.query.search || "").trim();
  const className = (req.query.className || "").trim();
  const section = (req.query.section || "").trim();
  const branch = (req.query.branch || "").trim();

  const result = await listTeachers({ page, limit, search, className, section, branch });
  res.status(200).json({ success: true, data: result });
});

export const getTeachersForClass = asyncHandler(async (req, res) => {
  const className = (req.query.className || "").trim();
  const section = (req.query.section || "").trim();
  const data = await getTeachersByClass({ className, section });
  res.status(200).json({ success: true, data });
});

export const monitorTeacherActivities = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
  const search = (req.query.search || "").trim();
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;

  const result = await getTeacherActivities({ page, limit, search, from, to });
  res.status(200).json({ success: true, data: result });
});

export const getAssignmentHistory = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);
  const from = (req.query.from || "").trim();
  const to = (req.query.to || "").trim();
  const className = (req.query.className || "").trim();
  const section = (req.query.section || "").trim();

  const result = await getTeacherAssignmentHistory({ from, to, className, section, page, limit });
  res.status(200).json({ success: true, data: result });
});

export const deleteTeacherAccount = asyncHandler(async (req, res) => {
  const data = await removeTeacherFromSchool(req.params.id, req.user._id.toString());
  res.status(200).json({ success: true, data, message: "Teacher removed from school." });
});

export const getTeacherOwnPanel = asyncHandler(async (req, res) => {
  const result = await getMyTeacherPanel(req.user._id);
  res.status(200).json({ success: true, data: result });
});

export const putTeacherOwnSignature = asyncHandler(async (req, res) => {
  const data = await saveMyTeacherSignature(req.user._id, req.body?.signatureDataUrl || "");
  res.status(200).json({ success: true, data });
});
