import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import {
  createStudent,
  deleteStudent,
  getClassOptions,
  getClassSectionOptions,
  getNextStudentIdentifiers,
  getPromotionClasses,
  getStudentById,
  getStudentAttendanceCalendar,
  getStudentAttendanceTotals,
  getOverallAttendanceList,
  getStudentFeePortfolio,
  getStudentFinanceSummary,
  listStudents,
  promoteClass,
  promoteStudent,
  updateStudent,
} from "./students.service.js";

export const getStudents = asyncHandler(async (req, res) => {
  const data = await listStudents(req.query);
  res.status(200).json({ success: true, data });
});

export const getStudent = asyncHandler(async (req, res) => {
  const data = await getStudentById(req.params.id);
  res.status(200).json({ success: true, data });
});

export const postStudent = asyncHandler(async (req, res) => {
  const data = await createStudent(req.body, req.user._id.toString());
  res.status(201).json({ success: true, data });
});

export const putStudent = asyncHandler(async (req, res) => {
  const data = await updateStudent(req.params.id, req.body, req.user._id.toString());
  res.status(200).json({ success: true, data });
});

export const removeStudent = asyncHandler(async (req, res) => {
  const data = await deleteStudent(req.params.id, req.user._id.toString());
  res.status(200).json({ success: true, data });
});

export const postPromoteStudent = asyncHandler(async (req, res) => {
  const data = await promoteStudent(req.params.id, req.body, req.user._id.toString());
  res.status(200).json({ success: true, data });
});

export const postPromoteClass = asyncHandler(async (req, res) => {
  const data = await promoteClass(req.body, req.user._id.toString());
  res.status(200).json({ success: true, data });
});

export const getStudentClassOptions = asyncHandler(async (_req, res) => {
  const data = await getClassOptions();
  res.status(200).json({ success: true, data });
});

export const getStudentClassSectionOptions = asyncHandler(async (_req, res) => {
  const data = await getClassSectionOptions();
  res.status(200).json({ success: true, data });
});

export const getStudentPromotionClasses = asyncHandler(async (_req, res) => {
  const data = await getPromotionClasses();
  res.status(200).json({ success: true, data });
});

export const getNextStudentRoll = asyncHandler(async (req, res) => {
  const className = (req.query.className || "").trim();
  const section = (req.query.section || "A").trim();
  const data = await getNextStudentIdentifiers(className, section);
  res.status(200).json({ success: true, data });
});

export const getStudentFeePortfolioHandler = asyncHandler(async (req, res) => {
  const data = await getStudentFeePortfolio(req.params.id);
  res.status(200).json({ success: true, data });
});

export const getStudentFinanceSummaryHandler = asyncHandler(async (req, res) => {
  const requestedId = req.params.id;
  const studentId = req.user?.role === "STUDENT" ? req.user._id : requestedId;

  if (req.user?.role === "STUDENT" && requestedId && String(requestedId) !== String(req.user._id)) {
    throw new ApiError(403, "Forbidden: cannot view another student's finance summary");
  }

  const data = await getStudentFinanceSummary(studentId);
  res.status(200).json({ success: true, data });
});

export const uploadStudentPhotoHandler = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Photo file is required" });
  }
  const url = `/uploads/students/${req.file.filename}`;
  res.status(201).json({ success: true, data: { url } });
});

export const getStudentAttendanceTotalsHandler = asyncHandler(async (req, res) => {
  const ids = (req.query.ids || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const data = await getStudentAttendanceTotals(ids);
  res.status(200).json({ success: true, data });
});

export const getOverallAttendanceListHandler = asyncHandler(async (req, res) => {
  const data = await getOverallAttendanceList(req.query);
  res.status(200).json({ success: true, data });
});

export const getStudentAttendanceCalendarHandler = asyncHandler(async (req, res) => {
  const requestedStudentId = req.query.studentId;
  const studentId = req.user?.role === "STUDENT" ? req.user._id : requestedStudentId;

  if (req.user?.role === "STUDENT" && requestedStudentId && String(requestedStudentId) !== String(req.user._id)) {
    throw new ApiError(403, "Forbidden: cannot view another student's attendance");
  }

  const data = await getStudentAttendanceCalendar({
    studentId,
    year: Number(req.query.year),
    month: Number(req.query.month),
    from: req.query.from || undefined,
    to: req.query.to || undefined,
  });
  res.status(200).json({ success: true, data });
});
