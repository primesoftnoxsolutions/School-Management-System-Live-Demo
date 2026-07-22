import { Router } from "express";
import { authorize, protect } from "../../middleware/authMiddleware.js";
import {
  getAcademicRecords,
  getAttendance,
  getAttendanceSummary,
  getMyAttendanceSummary,
  getMyAttendanceTodayStatus,
  postMyAttendanceMark,
  getClassDropdown,
  getClassStudents,
  getClasses,
  getSyllabi,
  getSyllabiForPrincipal,
  getTeacherDutyAssignments,
  getTeacherDutyAssignmentsReport,
  getReports,
  postAcademicRecord,
  postAttendance,
  postClass,
  postSyllabus,
  postTeacherDutyAssignments,
  postReport,
  putAcademicRecord,
  putAttendance,
  putClass,
  putReport,
  removeAcademicRecord,
  removeAttendance,
  removeClass,
  removeReport,
} from "./teacherPanel.controller.js";

const router = Router();
const teacherOnly = [protect, authorize("TEACHER")];

router.get("/classes", ...teacherOnly, getClasses);
router.post("/classes", ...teacherOnly, postClass);
router.put("/classes/:id", ...teacherOnly, putClass);
router.delete("/classes/:id", ...teacherOnly, removeClass);
const teacherOrPrincipal = [protect, authorize("TEACHER", "SUPER_ADMIN")];

router.get("/class-options", ...teacherOrPrincipal, getClassDropdown);
router.get("/students", ...teacherOnly, getClassStudents);

router.get("/attendance/summary", ...teacherOnly, getAttendanceSummary);
router.get("/my-attendance/summary", ...teacherOnly, getMyAttendanceSummary);
router.get("/my-attendance/today", ...teacherOnly, getMyAttendanceTodayStatus);
router.post("/my-attendance/mark", ...teacherOnly, postMyAttendanceMark);
router.get("/attendance", ...teacherOnly, getAttendance);
router.post("/attendance", ...teacherOnly, postAttendance);
router.put("/attendance/:id", ...teacherOnly, putAttendance);
router.delete("/attendance/:id", ...teacherOnly, removeAttendance);

router.get("/academic-records", ...teacherOnly, getAcademicRecords);
router.post("/academic-records", ...teacherOnly, postAcademicRecord);
router.put("/academic-records/:id", ...teacherOnly, putAcademicRecord);
router.delete("/academic-records/:id", ...teacherOnly, removeAcademicRecord);

router.get("/syllabi", ...teacherOrPrincipal, getSyllabi);
router.post("/syllabi", ...teacherOrPrincipal, postSyllabus);
router.get("/principal/syllabi", ...teacherOrPrincipal, getSyllabiForPrincipal);
router.get("/duties/report", ...teacherOrPrincipal, getTeacherDutyAssignmentsReport);
router.get("/duties", ...teacherOrPrincipal, getTeacherDutyAssignments);
router.post("/duties", ...teacherOrPrincipal, postTeacherDutyAssignments);

router.get("/reports", ...teacherOnly, getReports);
router.post("/reports", ...teacherOnly, postReport);
router.put("/reports/:id", ...teacherOnly, putReport);
router.delete("/reports/:id", ...teacherOnly, removeReport);

export default router;
