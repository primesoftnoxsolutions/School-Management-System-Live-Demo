import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createTeacherSyllabus,
  createAcademicRecord,
  createAttendance,
  createMyClass,
  createReport,
  deleteAcademicRecord,
  deleteAttendance,
  deleteMyClass,
  deleteReport,
  getClassOptions,
  listAcademicRecords,
  listAttendance,
  listAttendanceSummary,
  listMyAttendanceSummary,
  getMyAttendanceToday,
  markMyDailyAttendance,
  listMyClasses,
  listSyllabiForPrincipal,
  getTeacherDutyReport,
  listTeacherDutyAssignments,
  listTeacherSyllabi,
  listReports,
  listStudentsForClass,
  updateAcademicRecord,
  updateAttendance,
  updateMyClass,
  updateReport,
  saveTeacherDutyAssignments,
} from "./teacherPanel.service.js";

export const getClasses = asyncHandler(async (req, res) => {
  const data = await listMyClasses(req.user._id, req.query);
  res.status(200).json({ success: true, data });
});

export const postClass = asyncHandler(async (req, res) => {
  const data = await createMyClass(req.user._id, req.body);
  res.status(201).json({ success: true, data });
});

export const putClass = asyncHandler(async (req, res) => {
  const data = await updateMyClass(req.user._id, req.params.id, req.body);
  res.status(200).json({ success: true, data });
});

export const removeClass = asyncHandler(async (req, res) => {
  const data = await deleteMyClass(req.user._id, req.params.id);
  res.status(200).json({ success: true, data });
});

export const getClassStudents = asyncHandler(async (req, res) => {
  const data = await listStudentsForClass(req.user._id, req.query.className, req.query.section);
  res.status(200).json({ success: true, data });
});

export const getClassDropdown = asyncHandler(async (req, res) => {
  const data = await getClassOptions(req.user._id, req.user.role, req.query);
  res.status(200).json({ success: true, data });
});

export const getAttendance = asyncHandler(async (req, res) => {
  const data = await listAttendance(req.user._id, req.query);
  res.status(200).json({ success: true, data });
});

export const getAttendanceSummary = asyncHandler(async (req, res) => {
  const data = await listAttendanceSummary(req.user._id, req.query);
  res.status(200).json({ success: true, data });
});

export const getMyAttendanceSummary = asyncHandler(async (req, res) => {
  const data = await listMyAttendanceSummary(req.user._id, req.query);
  res.status(200).json({ success: true, data });
});

export const getMyAttendanceTodayStatus = asyncHandler(async (req, res) => {
  const data = await getMyAttendanceToday(req.user._id, req.query.date);
  res.status(200).json({ success: true, data });
});

export const postMyAttendanceMark = asyncHandler(async (req, res) => {
  const data = await markMyDailyAttendance(req.user._id, req.body);
  res.status(200).json({ success: true, data });
});

export const postAttendance = asyncHandler(async (req, res) => {
  const data = await createAttendance(req.user._id, req.body);
  res.status(201).json({ success: true, data });
});

export const putAttendance = asyncHandler(async (req, res) => {
  const data = await updateAttendance(req.user._id, req.params.id, req.body);
  res.status(200).json({ success: true, data });
});

export const removeAttendance = asyncHandler(async (req, res) => {
  const data = await deleteAttendance(req.user._id, req.params.id);
  res.status(200).json({ success: true, data });
});

export const getAcademicRecords = asyncHandler(async (req, res) => {
  const data = await listAcademicRecords(req.user._id, req.query);
  res.status(200).json({ success: true, data });
});

export const postAcademicRecord = asyncHandler(async (req, res) => {
  const data = await createAcademicRecord(req.user._id, req.body);
  res.status(201).json({ success: true, data });
});

export const putAcademicRecord = asyncHandler(async (req, res) => {
  const data = await updateAcademicRecord(req.user._id, req.params.id, req.body);
  res.status(200).json({ success: true, data });
});

export const removeAcademicRecord = asyncHandler(async (req, res) => {
  const data = await deleteAcademicRecord(req.user._id, req.params.id);
  res.status(200).json({ success: true, data });
});

export const getReports = asyncHandler(async (req, res) => {
  const data = await listReports(req.user._id, req.query);
  res.status(200).json({ success: true, data });
});

export const postReport = asyncHandler(async (req, res) => {
  const data = await createReport(req.user._id, req.body);
  res.status(201).json({ success: true, data });
});

export const putReport = asyncHandler(async (req, res) => {
  const data = await updateReport(req.user._id, req.params.id, req.body);
  res.status(200).json({ success: true, data });
});

export const removeReport = asyncHandler(async (req, res) => {
  const data = await deleteReport(req.user._id, req.params.id);
  res.status(200).json({ success: true, data });
});

export const getSyllabi = asyncHandler(async (req, res) => {
  const data = await listTeacherSyllabi(req.user._id, req.query);
  res.status(200).json({ success: true, data });
});

export const postSyllabus = asyncHandler(async (req, res) => {
  const data = await createTeacherSyllabus(req.user._id, req.body, { role: req.user.role });
  res.status(201).json({ success: true, data });
});

export const getSyllabiForPrincipal = asyncHandler(async (req, res) => {
  const data = await listSyllabiForPrincipal(req.query);
  res.status(200).json({ success: true, data });
});

export const getTeacherDutyAssignments = asyncHandler(async (req, res) => {
  const isTeacher = req.user.role === "TEACHER";
  const queryTeacherId = req.query.teacherId || null;
  const data = await listTeacherDutyAssignments({
    teacherId: isTeacher ? req.user._id : queryTeacherId,
    date: req.query.date,
    filterByTeacher: isTeacher || Boolean(queryTeacherId),
  });
  res.status(200).json({ success: true, data });
});

export const getTeacherDutyAssignmentsReport = asyncHandler(async (req, res) => {
  const isTeacher = req.user.role === "TEACHER";
  const queryTeacherId = req.query.teacherId || null;
  const data = await getTeacherDutyReport({
    month: req.query.month,
    week: req.query.week,
    teacherId: isTeacher ? req.user._id : queryTeacherId,
    filterByTeacher: isTeacher || Boolean(queryTeacherId),
  });
  res.status(200).json({ success: true, data });
});

export const postTeacherDutyAssignments = asyncHandler(async (req, res) => {
  const data = await saveTeacherDutyAssignments(req.body, req.user._id.toString());
  res.status(201).json({ success: true, data });
});
