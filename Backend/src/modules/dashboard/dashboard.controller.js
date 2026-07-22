import { asyncHandler } from "../../utils/asyncHandler.js";
import { User } from "../../models/User.js";
import { Student } from "../../models/Student.js";
import { Admission } from "../../models/Admission.js";
import { Attendance } from "../../models/Attendance.js";
import { getPendingFeesSummary } from "../fees/fees.service.js";
import { getOverviewReport } from "../reports/reports.service.js";
import { getTeacherAttendanceStats } from "../teacher-attendance/teacherAttendance.service.js";

export const superAdminDashboard = asyncHandler(async (req, res) => {
  const branch = req.query.branch === "Girls" ? "Girls" : req.query.branch === "Boys" ? "Boys" : "";
  const studentGender = branch === "Girls" ? "FEMALE" : branch === "Boys" ? "MALE" : "";
  const studentFilter = { isDeleted: false };
  if (studentGender) studentFilter.gender = studentGender;

  const [totalStudents, totalTeachers, totalStaff, monthlyAdmissionsAgg, overview, pendingFeeAlerts] =
    await Promise.all([
      Student.countDocuments(studentFilter),
      User.countDocuments({ role: "TEACHER", isDeleted: false, isActive: true }),
      User.countDocuments({ role: { $in: ["TEACHER", "ACCOUNTANT"] }, isDeleted: false, isActive: true }),
      Admission.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
      getOverviewReport(),
      getPendingFeesSummary(),
    ]);

  const [recentAdmissions, classNames, teacherAttendance, todayStudentAttendance] = await Promise.all([
    Student.find(studentFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .select("firstName lastName className section admissionDate gender")
      .lean(),
    Student.distinct("className", studentFilter),
    getTeacherAttendanceStats(),
    (() => {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date();
      dayEnd.setHours(23, 59, 59, 999);
      return Attendance.find({
        isDeleted: false,
        date: { $gte: dayStart, $lte: dayEnd },
      }).lean();
    })(),
  ]);

  let branchStudentIds = null;
  if (studentGender) {
    branchStudentIds = new Set(
      (await Student.find(studentFilter).select("_id").lean()).map((row) => String(row._id))
    );
  }

  const scopedAttendance = branchStudentIds
    ? todayStudentAttendance.filter((row) => branchStudentIds.has(String(row.studentId)))
    : todayStudentAttendance;

  const presentStudents = scopedAttendance.filter(
    (row) => row.status === "PRESENT" || row.status === "LATE"
  ).length;
  const absentStudents = scopedAttendance.filter((row) => row.status === "ABSENT").length;
  const attendancePercentage = totalStudents ? Math.round((presentStudents / totalStudents) * 100) : 0;

  res.status(200).json({
    success: true,
    data: {
      cards: {
        totalStudents,
        totalTeachers,
        totalClasses: classNames.filter(Boolean).length,
        totalStaff,
        feeCollected: overview.feeCollected,
        pendingFees: overview.pendingFees,
        totalFine: overview.totalFine,
        collectedFine: overview.finesCollected,
        pendingFine: overview.finesPending,
        totalRefunds: overview.totalRefunds,
        netCollection: overview.netCollection,
        attendancePercentage,
        presentTeachers: teacherAttendance.presentTeachers,
        absentTeachers: teacherAttendance.absentTeachers,
        presentStudents,
        absentStudents,
        totalOnLeave: teacherAttendance.onLeave,
      },
      pendingFeeCount: pendingFeeAlerts.length,
      feeStatus: {
        collected: overview.feeCollected,
        pending: overview.pendingFees,
        refunds: overview.totalRefunds,
        netCollection: overview.netCollection,
        overdue: pendingFeeAlerts.filter((p) => p.dueDate && new Date(p.dueDate) < new Date()).length,
      },
      recentAdmissions: recentAdmissions.map((item) => ({
        id: item._id,
        name: `${item.firstName} ${item.lastName}`,
        className: item.section ? `${item.className} - ${item.section}` : item.className,
        date: item.admissionDate,
      })),
      charts: {
        monthlyAdmissions: monthlyAdmissionsAgg.map((row) => ({
          label: row._id,
          value: row.count,
        })),
        attendanceTrend: [],
      },
      branch: branch || null,
    },
  });
});

export const teacherDashboard = asyncHandler(async (req, res) => {
  const totalStudents = await Student.countDocuments({ isDeleted: false });
  res.status(200).json({
    success: true,
    data: {
      teacherId: req.user._id,
      cards: {
        assignedClasses: 0,
        todaysAttendance: 0,
        totalStudents,
        pendingTasks: 0,
      },
    },
  });
});

export const getPendingFees = asyncHandler(async (_req, res) => {
  const data = await getPendingFeesSummary();
  res.status(200).json({ success: true, data });
});
