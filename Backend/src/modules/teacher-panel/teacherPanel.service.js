import { TeacherClass } from "../../models/TeacherClass.js";
import { TeacherProfile } from "../../models/TeacherProfile.js";
import { Attendance } from "../../models/Attendance.js";
import { AcademicRecord } from "../../models/AcademicRecord.js";
import { TeacherReport } from "../../models/TeacherReport.js";
import { TeacherSyllabus } from "../../models/TeacherSyllabus.js";
import { TeacherDutyAssignment } from "../../models/TeacherDutyAssignment.js";
import { Student } from "../../models/Student.js";
import { TeacherDailyAttendance } from "../../models/TeacherDailyAttendance.js";
import { User } from "../../models/User.js";
import mongoose from "mongoose";
import { ApiError } from "../../utils/apiError.js";
import { logTeacherActivity } from "./activityLogger.js";
import { markTeacherAttendance } from "../teacher-attendance/teacherAttendance.service.js";

const parsePage = (query) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  const search = (query.search || "").trim();
  return { page, limit, search, skip: (page - 1) * limit };
};

const paginate = (items, total, page, limit) => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit) || 1,
});

const ensureTeacherOwnership = (doc, teacherId, label = "Record") => {
  if (!doc || doc.isDeleted) throw new ApiError(404, `${label} not found`);
  if (doc.teacherId.toString() !== teacherId.toString()) {
    throw new ApiError(403, "You can only manage your own records");
  }
};

// --- Classes ---

export const listMyClasses = async (teacherId, query) => {
  const { page, limit, search, skip } = parsePage(query);
  const filter = { teacherId, isDeleted: false };
  if (search) {
    filter.$or = [
      { className: { $regex: search, $options: "i" } },
      { subject: { $regex: search, $options: "i" } },
      { section: { $regex: search, $options: "i" } },
    ];
  }
  const [items, total] = await Promise.all([
    TeacherClass.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    TeacherClass.countDocuments(filter),
  ]);
  return paginate(items, total, page, limit);
};

export const createMyClass = async (teacherId, payload) => {
  const { className, section, subject, roomNo, schedule } = payload;
  if (!className || !subject) throw new ApiError(400, "className and subject are required");

  const item = await TeacherClass.create({
    teacherId,
    className: className.trim(),
    section: (section || "A").trim(),
    subject: subject.trim(),
    roomNo: roomNo?.trim() || "",
    schedule: schedule?.trim() || "",
    createdBy: teacherId.toString(),
  });

  await logTeacherActivity(teacherId, "CREATE", "MY_CLASSES", `Added class ${className} - ${subject}`);
  return item;
};

export const updateMyClass = async (teacherId, id, payload) => {
  const item = await TeacherClass.findById(id);
  ensureTeacherOwnership(item, teacherId, "Class");

  const fields = ["className", "section", "subject", "roomNo", "schedule"];
  fields.forEach((key) => {
    if (payload[key] !== undefined) item[key] = payload[key];
  });
  item.updatedBy = teacherId.toString();
  await item.save();

  await logTeacherActivity(teacherId, "UPDATE", "MY_CLASSES", `Updated class ${item.className}`);
  return item;
};

export const deleteMyClass = async (teacherId, id) => {
  const item = await TeacherClass.findById(id);
  ensureTeacherOwnership(item, teacherId, "Class");
  item.isDeleted = true;
  item.updatedBy = teacherId.toString();
  await item.save();
  await logTeacherActivity(teacherId, "DELETE", "MY_CLASSES", `Removed class ${item.className}`);
  return { id };
};

// --- Students for dropdown ---

export const listStudentsForClass = async (teacherId, className, section) => {
  if (!className) throw new ApiError(400, "className is required");

  const owned = await TeacherClass.findOne({
    teacherId,
    className,
    section: section || "A",
    isDeleted: false,
  }).lean();

  if (!owned) {
    throw new ApiError(403, "You can only access students from your assigned classes");
  }

  const students = await Student.find({
    className,
    section: section || "A",
    isDeleted: false,
    status: "ACTIVE",
  })
    .select("_id admissionNo rollNumber firstName lastName fatherName guardianName className section studentPhotoUrl phoneNumber address gender status dateOfBirth createdAt admissionDate")
    .sort({ firstName: 1 })
    .lean();

  return students;
};

// --- Attendance ---

export const listAttendance = async (teacherId, query) => {
  const { page, limit, search, skip } = parsePage(query);
  const filter = { teacherId, isDeleted: false };

  if (query.className) filter.className = query.className;
  if (query.section) filter.section = query.section;

  if (query.date) {
    const day = new Date(query.date);
    day.setHours(0, 0, 0, 0);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    filter.date = { $gte: day, $lt: next };
  }

  if (search) {
    filter.$or = [
      { className: { $regex: search, $options: "i" } },
      { remarks: { $regex: search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Attendance.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("studentId", "firstName lastName admissionNo")
      .lean(),
    Attendance.countDocuments(filter),
  ]);

  return paginate(items, total, page, limit);
};

const parseDayBoundary = (value, endOfDay = false) => {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    if (endOfDay) return new Date(year, month, day, 23, 59, 59, 999);
    return new Date(year, month, day, 0, 0, 0, 0);
  }
  const fallback = new Date(raw);
  if (Number.isNaN(fallback.getTime())) return null;
  if (endOfDay) {
    fallback.setHours(23, 59, 59, 999);
  } else {
    fallback.setHours(0, 0, 0, 0);
  }
  return fallback;
};

export const listAttendanceSummary = async (teacherId, query) => {
  const { className, section, fromDate, toDate } = query;
  if (!className || !fromDate || !toDate) {
    throw new ApiError(400, "className, fromDate and toDate are required");
  }

  await listStudentsForClass(teacherId, className, section);

  const from = parseDayBoundary(fromDate, false);
  const to = parseDayBoundary(toDate, true);

  if (!from || !to) throw new ApiError(400, "Invalid fromDate or toDate");
  if (from > to) throw new ApiError(400, "fromDate cannot be after toDate");

  const students = await Student.find({
    className,
    section: section || "A",
    isDeleted: false,
    status: "ACTIVE",
  })
    .select("_id admissionNo rollNumber firstName lastName fatherName guardianName")
    .sort({ rollNumber: 1, admissionNo: 1 })
    .lean();

  // Class-scoped attendance for the assigned class (includes latest marks from this teacher).
  const records = await Attendance.find({
    teacherId,
    className,
    section: section || "A",
    isDeleted: false,
    date: { $gte: from, $lte: to },
  }).lean();

  const countsByStudent = {};
  records.forEach((record) => {
    const sid = record.studentId.toString();
    if (!countsByStudent[sid]) {
      countsByStudent[sid] = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 };
    }
    if (countsByStudent[sid][record.status] !== undefined) {
      countsByStudent[sid][record.status] += 1;
    }
  });

  return students.map((student) => {
    const sid = student._id.toString();
    const counts = countsByStudent[sid] || { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 };
    const studentRecords = records.filter((record) => record.studentId.toString() === sid);
    return {
      studentId: student._id,
      rollNo: student.rollNumber || student.admissionNo || "",
      admissionNo: student.admissionNo || "",
      name: `${student.firstName} ${student.lastName}`.trim(),
      fatherName: student.fatherName || student.guardianName || "",
      className,
      section: section || "A",
      present: counts.PRESENT,
      absent: counts.ABSENT,
      late: counts.LATE,
      leave: counts.LEAVE,
      remarks: studentRecords
        .map((record) => String(record.remarks || "").trim())
        .filter(Boolean)
        .join("; "),
    };
  });
};

export const listMyAttendanceSummary = async (teacherId, query) => {
  const { fromDate, toDate } = query;
  if (!fromDate || !toDate) {
    throw new ApiError(400, "fromDate and toDate are required");
  }

  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);
  const to = new Date(toDate);
  to.setHours(23, 59, 59, 999);

  if (from > to) throw new ApiError(400, "fromDate cannot be after toDate");

  const records = await TeacherDailyAttendance.find({
    teacherId,
    isDeleted: false,
    date: { $gte: from, $lte: to },
  })
    .sort({ date: 1 })
    .lean();

  const totals = records.reduce(
    (acc, record) => {
      if (record.status === "PRESENT") acc.present += 1;
      if (record.status === "ABSENT") acc.absent += 1;
      if (record.status === "LATE") acc.late += 1;
      if (record.status === "LEAVE") acc.leave += 1;
      acc.marked += 1;
      return acc;
    },
    { present: 0, absent: 0, late: 0, leave: 0, marked: 0 }
  );

  return {
    fromDate,
    toDate,
    totals,
    items: records.map((record) => ({
      _id: record._id,
      date: record.date,
      status: record.status,
      source: record.source || "ADMIN",
      remarks: record.remarks || "",
    })),
  };
};

export const getMyAttendanceToday = async (teacherId, dateInput) => {
  const day = dateInput ? new Date(dateInput) : new Date();
  day.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  const record = await TeacherDailyAttendance.findOne({
    teacherId,
    isDeleted: false,
    date: { $gte: day, $lte: dayEnd },
  }).lean();

  return {
    date: day,
    status: record?.status || "UNMARKED",
    source: record?.source || null,
    recordId: record?._id || null,
  };
};

export const markMyDailyAttendance = async (teacherId, payload) => {
  const status = payload?.status;
  const date = payload?.date;
  const data = await markTeacherAttendance(
    { teacherId, status, date, remarks: payload?.remarks || "" },
    teacherId,
    { source: "TEACHER" }
  );
  await logTeacherActivity(teacherId, "CREATE", "MY_ATTENDANCE", `Marked own attendance as ${status}`);
  return data;
};

export const createAttendance = async (teacherId, payload) => {
  const { studentId, className, section, date, status, remarks } = payload;
  if (!studentId || !className || !date) {
    throw new ApiError(400, "studentId, className and date are required");
  }

  await listStudentsForClass(teacherId, className, section);

  const attendanceDate = parseDayBoundary(date, false) || (() => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  try {
    const item = await Attendance.create({
      teacherId,
      studentId,
      className: className.trim(),
      section: (section || "A").trim(),
      date: attendanceDate,
      status: status || "PRESENT",
      remarks: remarks?.trim() || "",
      createdBy: teacherId.toString(),
    });

    await logTeacherActivity(teacherId, "CREATE", "ATTENDANCE", `Marked ${status} for ${className}`);
    return item;
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, "Attendance already marked for this student on this date");
    }
    throw err;
  }
};

export const updateAttendance = async (teacherId, id, payload) => {
  const item = await Attendance.findById(id);
  ensureTeacherOwnership(item, teacherId, "Attendance");

  if (payload.status !== undefined) item.status = payload.status;
  if (payload.remarks !== undefined) item.remarks = payload.remarks;
  if (payload.date !== undefined) {
    item.date =
      parseDayBoundary(payload.date, false) ||
      (() => {
        const d = new Date(payload.date);
        d.setHours(0, 0, 0, 0);
        return d;
      })();
  }
  item.updatedBy = teacherId.toString();
  await item.save();

  await logTeacherActivity(teacherId, "UPDATE", "ATTENDANCE", `Updated attendance record`);
  return item;
};

export const deleteAttendance = async (teacherId, id) => {
  const item = await Attendance.findById(id);
  ensureTeacherOwnership(item, teacherId, "Attendance");
  item.isDeleted = true;
  item.updatedBy = teacherId.toString();
  await item.save();
  await logTeacherActivity(teacherId, "DELETE", "ATTENDANCE", `Deleted attendance record`);
  return { id };
};

// --- Academic Records ---

export const listAcademicRecords = async (teacherId, query) => {
  const { page, limit, search, skip } = parsePage(query);
  const filter = { teacherId, isDeleted: false };
  if (query.className) filter.className = query.className;
  if (query.section) filter.section = query.section || "A";
  if (query.examType) filter.examType = query.examType;
  if (query.subject) filter.subject = query.subject;
  if (search) {
    filter.$or = [
      { subject: { $regex: search, $options: "i" } },
      { examType: { $regex: search, $options: "i" } },
      { className: { $regex: search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    AcademicRecord.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("studentId", "firstName lastName admissionNo rollNumber")
      .lean(),
    AcademicRecord.countDocuments(filter),
  ]);

  return paginate(items, total, page, limit);
};

export const createAcademicRecord = async (teacherId, payload) => {
  const { studentId, className, section, subject, examType, marks, maxMarks, grade, remarks } = payload;
  if (!studentId || !className || !subject || !examType || marks === undefined || !maxMarks) {
    throw new ApiError(400, "studentId, className, subject, examType, marks and maxMarks are required");
  }

  await listStudentsForClass(teacherId, className, section);

  const item = await AcademicRecord.create({
    teacherId,
    studentId,
    className: className.trim(),
    section: (section || "A").trim(),
    subject: subject.trim(),
    examType: examType.trim(),
    marks: Number(marks),
    maxMarks: Number(maxMarks),
    grade: grade?.trim() || "",
    remarks: remarks?.trim() || "",
    createdBy: teacherId.toString(),
  });

  await logTeacherActivity(teacherId, "CREATE", "ACADEMIC_RECORDS", `Added ${examType} record for ${subject}`);
  return item;
};

export const updateAcademicRecord = async (teacherId, id, payload) => {
  const item = await AcademicRecord.findById(id);
  ensureTeacherOwnership(item, teacherId, "Academic record");

  const fields = ["subject", "examType", "marks", "maxMarks", "grade", "remarks", "className", "section"];
  fields.forEach((key) => {
    if (payload[key] !== undefined) item[key] = payload[key];
  });
  item.updatedBy = teacherId.toString();
  await item.save();

  await logTeacherActivity(teacherId, "UPDATE", "ACADEMIC_RECORDS", `Updated academic record`);
  return item;
};

export const deleteAcademicRecord = async (teacherId, id) => {
  const item = await AcademicRecord.findById(id);
  ensureTeacherOwnership(item, teacherId, "Academic record");
  item.isDeleted = true;
  item.updatedBy = teacherId.toString();
  await item.save();
  await logTeacherActivity(teacherId, "DELETE", "ACADEMIC_RECORDS", `Deleted academic record`);
  return { id };
};

// --- Reports ---

export const listReports = async (teacherId, query) => {
  const { page, limit, search, skip } = parsePage(query);
  const filter = { teacherId, isDeleted: false };
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { summary: { $regex: search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    TeacherReport.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    TeacherReport.countDocuments(filter),
  ]);

  return paginate(items, total, page, limit);
};

export const createReport = async (teacherId, payload) => {
  const { title, reportType, summary, periodFrom, periodTo } = payload;
  if (!title || !summary) throw new ApiError(400, "title and summary are required");

  const item = await TeacherReport.create({
    teacherId,
    title: title.trim(),
    reportType: reportType || "GENERAL",
    summary: summary.trim(),
    periodFrom: periodFrom ? new Date(periodFrom) : null,
    periodTo: periodTo ? new Date(periodTo) : null,
    createdBy: teacherId.toString(),
  });

  await logTeacherActivity(teacherId, "CREATE", "REPORTS", `Created report: ${title}`);
  return item;
};

export const updateReport = async (teacherId, id, payload) => {
  const item = await TeacherReport.findById(id);
  ensureTeacherOwnership(item, teacherId, "Report");

  const fields = ["title", "reportType", "summary", "periodFrom", "periodTo"];
  fields.forEach((key) => {
    if (payload[key] !== undefined) {
      item[key] = ["periodFrom", "periodTo"].includes(key) && payload[key]
        ? new Date(payload[key])
        : payload[key];
    }
  });
  item.updatedBy = teacherId.toString();
  await item.save();

  await logTeacherActivity(teacherId, "UPDATE", "REPORTS", `Updated report: ${item.title}`);
  return item;
};

export const deleteReport = async (teacherId, id) => {
  const item = await TeacherReport.findById(id);
  ensureTeacherOwnership(item, teacherId, "Report");
  item.isDeleted = true;
  item.updatedBy = teacherId.toString();
  await item.save();
  await logTeacherActivity(teacherId, "DELETE", "REPORTS", `Deleted report: ${item.title}`);
  return { id };
};

export const getClassOptions = async (teacherId, role = "TEACHER", query = {}) => {
  const filter = role === "SUPER_ADMIN" ? { isDeleted: false } : { teacherId, isDeleted: false };
  if (query.branch === "Boys" || query.branch === "Girls") filter.branch = query.branch;
  return TeacherClass.find(filter)
    .select("_id className section subject teacherId branch")
    .sort({ className: 1 })
    .lean();
};

const normalizeSyllabusBranch = (value) => (value === "Boys" || value === "Girls" ? value : "");

const resolveSyllabusBranch = async ({ teacherId, className, section, payloadBranch }) => {
  const explicit = normalizeSyllabusBranch(payloadBranch);
  if (explicit) return explicit;

  const classRow = await TeacherClass.findOne({
    teacherId,
    className,
    section: section || "A",
    isDeleted: false,
  })
    .select("branch")
    .lean();
  if (normalizeSyllabusBranch(classRow?.branch)) return classRow.branch;

  const anyClass = await TeacherClass.findOne({ teacherId, isDeleted: false }).select("branch").lean();
  if (normalizeSyllabusBranch(anyClass?.branch)) return anyClass.branch;

  const profile = await TeacherProfile.findOne({ teacherId, isDeleted: false }).select("branch").lean();
  if (normalizeSyllabusBranch(profile?.branch)) return profile.branch;

  return "Boys";
};

const teacherIdsForBranch = async (branch) => {
  if (branch !== "Boys" && branch !== "Girls") return null;
  const [classRows, profileRows] = await Promise.all([
    TeacherClass.find({ branch, isDeleted: false }).select("teacherId").lean(),
    TeacherProfile.find({ branch, isDeleted: false }).select("teacherId").lean(),
  ]);
  return [
    ...new Set(
      [...classRows, ...profileRows]
        .map((row) => String(row.teacherId || ""))
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
    ),
  ].map((id) => new mongoose.Types.ObjectId(id));
};

export const listTeacherSyllabi = async (teacherId, query = {}) => {
  const filter = { isDeleted: false };
  const className = query.className ? String(query.className).trim() : "";
  const section = query.section !== undefined && query.section !== "" ? String(query.section).trim() || "A" : "";

  if (className) filter.className = className;
  if (section) filter.section = section;
  if (query.mode) filter.mode = query.mode;
  const year = Number(query.year);
  if (query.year !== undefined && query.year !== "" && Number.isFinite(year) && year > 0) {
    filter.year = year;
  }
  if (query.mode !== "ANNUALLY" && query.month !== undefined && query.month !== "") {
    filter.month = Number(query.month);
  }

  // Teachers see syllabi for their assigned classes (including Super Admin edits),
  // not only records where teacherId === self.
  if (className) {
    const assigned = await TeacherClass.findOne({
      teacherId,
      className,
      ...(section ? { section } : {}),
      isDeleted: false,
    })
      .select("_id")
      .lean();
    const assignedLoose =
      assigned ||
      (await TeacherClass.findOne({ teacherId, className, isDeleted: false }).select("_id").lean());

    if (!assignedLoose) {
      filter.teacherId = teacherId;
    }
    // else: class-scoped — no teacherId filter so SA + teacher stay in sync
  } else {
    filter.teacherId = teacherId;
  }

  return TeacherSyllabus.find(filter).sort({ updatedAt: -1, year: -1, month: -1, createdAt: -1 }).lean();
};

export const createTeacherSyllabus = async (actorId, payload, options = {}) => {
  const { className, section, mode, month, year, bookTitle, monthTitle, rows, notes } = payload;
  if (!className || year === undefined || year === null) {
    throw new ApiError(400, "className and year are required");
  }

  const role = options.role || "TEACHER";
  // Teachers can only save for themselves; SUPER_ADMIN may target teacherId from body.
  const teacherId =
    role === "SUPER_ADMIN" && payload.teacherId ? payload.teacherId : actorId;

  if (role === "SUPER_ADMIN" && !payload.teacherId) {
    throw new ApiError(400, "teacherId is required when saving syllabus as SUPER_ADMIN");
  }

  const resolvedMode = mode || "MONTHLY";
  const resolvedSection = (section || "A").trim();
  const resolvedMonth = resolvedMode === "ANNUALLY" ? null : Number(month);
  const resolvedYear = Number(year);
  const resolvedClassName = className.trim();

  if (resolvedMode === "MONTHLY" && (month === undefined || month === null || Number.isNaN(resolvedMonth))) {
    throw new ApiError(400, "month is required for MONTHLY syllabus");
  }

  const rowItems = Array.isArray(rows)
    ? rows
        .filter((row) => row && String(row.subject || "").trim())
        .map((row) => ({
          subject: String(row.subject || "").trim(),
          syllabus: String(row.syllabus || "").trim(),
          covered: String(row.covered || "").trim(),
        }))
    : [];

  const baseQuery = {
    className: resolvedClassName,
    section: resolvedSection,
    mode: resolvedMode,
    month: resolvedMonth,
    year: resolvedYear,
    isDeleted: false,
  };

  // Prefer the targeted teacher's record; for teachers, also adopt an existing class record
  // created by Super Admin so both portals edit the same document.
  let existing = await TeacherSyllabus.findOne({ ...baseQuery, teacherId });
  if (!existing && role !== "SUPER_ADMIN") {
    existing = await TeacherSyllabus.findOne(baseQuery);
  }

  const item = existing || new TeacherSyllabus({ teacherId });
  // Always keep ownership on the acting teacher (or SA-selected teacher).
  // Prevents "Super Admin" showing when a teacher updates an older SA-created record.
  item.teacherId = teacherId;
  item.className = resolvedClassName;
  item.section = resolvedSection;
  item.branch = await resolveSyllabusBranch({
    teacherId: item.teacherId,
    className: resolvedClassName,
    section: resolvedSection,
    payloadBranch: payload.branch,
  });
  item.mode = resolvedMode;
  item.month = resolvedMonth;
  item.year = resolvedYear;
  item.bookTitle = String(bookTitle || "BOOKS NAME").trim() || "BOOKS NAME";
  item.monthTitle = String(monthTitle || "").trim();
  item.rows = rowItems;
  item.notes = String(notes || "").trim();
  item.updatedBy = actorId.toString();
  if (!existing) item.createdBy = actorId.toString();
  await item.save();

  await logTeacherActivity(
    item.teacherId,
    existing ? "UPDATE" : "CREATE",
    "SYLLABUS",
    `${existing ? "Updated" : "Created"} syllabus for ${item.className}`
  );

  const saved = item.toObject();
  return {
    ...saved,
    updatedAt: saved.updatedAt || item.updatedAt,
  };
};

export const listSyllabiForPrincipal = async (query = {}) => {
  const filter = { isDeleted: false };

  if (query.branch === "Boys" || query.branch === "Girls") {
    const ids = await teacherIdsForBranch(query.branch);
    // Match by saved syllabus branch and/or teachers belonging to that branch.
    filter.$or = [{ branch: query.branch }];
    if (ids?.length) {
      filter.$or.push({ teacherId: { $in: ids } });
    }
  }

  if (query.className) filter.className = String(query.className).trim();
  if (query.section) filter.section = String(query.section).trim() || "A";
  if (query.teacherId && mongoose.Types.ObjectId.isValid(String(query.teacherId))) {
    filter.teacherId = new mongoose.Types.ObjectId(String(query.teacherId));
  }
  if (query.mode) filter.mode = query.mode;
  const year = Number(query.year);
  if (query.year !== undefined && query.year !== "" && Number.isFinite(year) && year > 0) {
    filter.year = year;
  }
  if (query.mode !== "ANNUALLY" && query.month !== undefined && query.month !== "") {
    filter.month = Number(query.month);
  }

  const rows = await TeacherSyllabus.find(filter)
    .sort({ updatedAt: -1, year: -1, month: -1, createdAt: -1 })
    .populate("teacherId", "fullName name email role")
    .lean();

  // If a syllabus is still linked to SUPER_ADMIN, show the class-assigned teacher instead.
  const resolved = await Promise.all(
    rows.map(async (doc) => {
      const linked = doc.teacherId && typeof doc.teacherId === "object" ? doc.teacherId : null;
      const linkedName = String(linked?.fullName || linked?.name || "").trim();
      const isAdminLinked =
        linked?.role === "SUPER_ADMIN" || /^super\s*admin$/i.test(linkedName);

      if (!isAdminLinked) return doc;

      const assignment = await TeacherClass.findOne({
        className: doc.className,
        section: doc.section || "A",
        ...(doc.branch === "Boys" || doc.branch === "Girls" ? { branch: doc.branch } : {}),
        isDeleted: false,
      })
        .populate("teacherId", "fullName name email role")
        .lean();

      const assignedTeacher =
        assignment?.teacherId && typeof assignment.teacherId === "object" ? assignment.teacherId : null;
      if (assignedTeacher && assignedTeacher.role !== "SUPER_ADMIN") {
        return { ...doc, teacherId: assignedTeacher };
      }
      return doc;
    })
  );

  return resolved;
};

const startOfWeekMonday = (dateValue) => {
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
};

const toWeekKey = (dateValue) => {
  const date = startOfWeekMonday(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const dutyDefs = [
  { key: "assembly", label: "Assembly Duty" },
  { key: "neatness", label: "Neatness Check" },
  { key: "uniform", label: "Uniform Check" },
  { key: "attendance", label: "Student Attendance" },
  { key: "corridor", label: "Corridor Monitoring" },
  { key: "discipline", label: "Discipline Monitoring" },
  { key: "classroom", label: "Classroom Supervision" },
  { key: "library", label: "Library Duty" },
  { key: "canteen", label: "Canteen Duty" },
  { key: "gate", label: "Gate Duty" },
  { key: "other", label: "Other Duties" },
];

const mapDutyRows = (rows = []) =>
  (rows || []).map((row) => ({
    ...row,
    teacherName: row.teacherId?.fullName || row.teacherName || "",
  }));

const filterRowsForTeacher = (rows = [], teacherId, teacherName = "") => {
  if (!teacherId && !teacherName) return rows;
  const tid = teacherId?.toString?.() || String(teacherId || "");
  const name = String(teacherName || "").trim().toLowerCase();
  return rows.filter((row) => {
    const id = row.teacherId?._id || row.teacherId;
    if (tid && id && id.toString() === tid) return true;
    if (!name) return false;
    const rowName = String(row.teacherName || row.teacherId?.fullName || "")
      .trim()
      .toLowerCase();
    if (!rowName) return false;
    return rowName === name || rowName.includes(name) || name.includes(rowName);
  });
};

/** Monday week-commencing for the Nth week of a calendar month (week 1 = days 1–7). */
export const weekCommencingForMonthWeek = (monthValue, weekNumber = 1) => {
  const match = String(monthValue || "").match(/^(\d{4})-(\d{2})$/);
  if (!match) return toWeekKey(new Date());
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const week = Math.min(5, Math.max(1, Number(weekNumber) || 1));
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const dayOfMonth = Math.min((week - 1) * 7 + 1, lastDay);
  return toWeekKey(new Date(year, monthIndex, dayOfMonth));
};

export const listTeacherDutyAssignments = async ({ teacherId, date, filterByTeacher = false }) => {
  const weekCommencing = toWeekKey(date || new Date());
  const record = await TeacherDutyAssignment.findOne({
    weekCommencing,
    isDeleted: false,
  })
    .populate("rows.teacherId", "fullName email")
    .lean();

  if (!record) {
    return { weekCommencing, rows: [], notes: "", signatureTeacherName: "", signatureDate: "", dutyDefs };
  }

  let rows = mapDutyRows(record.rows);
  if (filterByTeacher && teacherId) {
    const teacher = await User.findById(teacherId).select("fullName").lean();
    rows = filterRowsForTeacher(rows, teacherId, teacher?.fullName || "");
  }

  return { ...record, rows, dutyDefs };
};

export const getTeacherDutyReport = async ({ month, week, teacherId, filterByTeacher = false }) => {
  const weekCommencing = weekCommencingForMonthWeek(month, week);
  return listTeacherDutyAssignments({ teacherId, date: weekCommencing, filterByTeacher });
};

export const saveTeacherDutyAssignments = async (payload, actorId) => {
  const weekCommencing = toWeekKey(payload.weekCommencing || new Date());

  const rows = [];
  for (const row of Array.isArray(payload.rows) ? payload.rows : []) {
    let teacherId = row.teacherId ? row.teacherId : null;
    let teacherName = String(row.teacherName || "").trim();

    if (!teacherId && teacherName) {
      const nameRegex = new RegExp(`^${teacherName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
      const matched = await User.findOne({
        role: "TEACHER",
        isDeleted: false,
        fullName: nameRegex,
      })
        .select("_id fullName")
        .lean();
      if (matched) {
        teacherId = matched._id;
        teacherName = matched.fullName || teacherName;
      }
    } else if (teacherId && !teacherName) {
      const matched = await User.findById(teacherId).select("fullName").lean();
      if (matched?.fullName) teacherName = matched.fullName;
    }

    rows.push({
      day: String(row.day || "").trim(),
      teacherId,
      teacherName,
      duties: dutyDefs.map((def) => ({
        key: def.key,
        label: def.label,
        assigned: Boolean(row.duties?.find((item) => item.key === def.key)?.assigned),
      })),
    });
  }

  const record = await TeacherDutyAssignment.findOneAndUpdate(
    { weekCommencing, isDeleted: false },
    {
      $set: {
        weekCommencing,
        rows,
        notes: String(payload.notes || "").trim(),
        signatureTeacherName: String(payload.signatureTeacherName || "").trim(),
        signatureDate: String(payload.signatureDate || "").trim(),
        updatedBy: actorId,
      },
      $setOnInsert: {
        createdBy: actorId,
      },
    },
    { upsert: true, new: true }
  )
    .populate("rows.teacherId", "fullName email")
    .lean();

  return { ...record, rows: mapDutyRows(record?.rows), dutyDefs };
};
