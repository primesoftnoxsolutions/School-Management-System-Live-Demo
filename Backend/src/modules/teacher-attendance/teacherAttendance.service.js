import { User } from "../../models/User.js";
import { TeacherDailyAttendance } from "../../models/TeacherDailyAttendance.js";
import { ApiError } from "../../utils/apiError.js";

const startOfDay = (dateInput) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (dateInput) => {
  const d = startOfDay(dateInput);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getTeacherAttendanceStats = async (dateInput) => {
  const dayStart = startOfDay(dateInput);
  const dayEnd = endOfDay(dateInput);

  const teachers = await User.find({
    role: "TEACHER",
    isDeleted: false,
    isActive: true,
  })
    .select("_id")
    .lean();

  const totalTeachers = teachers.length;
  const teacherIds = teachers.map((t) => t._id);

  const records = await TeacherDailyAttendance.find({
    teacherId: { $in: teacherIds },
    isDeleted: false,
    date: { $gte: dayStart, $lte: dayEnd },
  }).lean();

  const presentTeachers = records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
  const absentTeachers = records.filter((r) => r.status === "ABSENT").length;
  const onLeave = records.filter((r) => r.status === "LEAVE").length;
  const unmarked = totalTeachers - records.length;

  return {
    totalTeachers,
    presentTeachers,
    absentTeachers,
    onLeave,
    unmarked,
    marked: records.length,
  };
};

export const listTeacherAttendance = async (dateInput) => {
  const dayStart = startOfDay(dateInput);
  const dayEnd = endOfDay(dateInput);

  const teachers = await User.find({
    role: "TEACHER",
    isDeleted: false,
    isActive: true,
  })
    .select("_id fullName email")
    .sort({ fullName: 1 })
    .lean();

  const teacherIds = teachers.map((t) => t._id);

  const records = await TeacherDailyAttendance.find({
    teacherId: { $in: teacherIds },
    isDeleted: false,
    date: { $gte: dayStart, $lte: dayEnd },
  }).lean();

  const recordMap = new Map(records.map((r) => [r.teacherId.toString(), r]));

  const items = teachers.map((teacher) => {
    const record = recordMap.get(teacher._id.toString());
    return {
      teacherId: teacher._id,
      fullName: teacher.fullName,
      email: teacher.email,
      status: record?.status || "UNMARKED",
      source: record?.source || null,
      recordId: record?._id || null,
      remarks: record?.remarks || "",
      markedAt: record?.updatedAt || null,
    };
  });

  const stats = await getTeacherAttendanceStats(dateInput);

  return { date: dayStart, items, stats };
};

const toLocalDateKey = (dateInput) => {
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getTeacherAttendanceCalendar = async ({ teacherId, year, month, from, to }) => {
  if (!teacherId) {
    throw new ApiError(400, "teacherId is required");
  }

  const teacher = await User.findOne({
    _id: teacherId,
    role: "TEACHER",
    isDeleted: false,
  })
    .select("_id fullName")
    .lean();

  if (!teacher) {
    throw new ApiError(404, "Teacher not found");
  }

  let rangeStart;
  let rangeEnd;

  if (from && to) {
    rangeStart = startOfDay(from);
    rangeEnd = endOfDay(to);
  } else if (year && month) {
    const monthIndex = month - 1;
    rangeStart = new Date(year, monthIndex, 1);
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd = new Date(year, monthIndex + 1, 0);
    rangeEnd.setHours(23, 59, 59, 999);
  } else {
    throw new ApiError(400, "Provide from/to or year/month");
  }

  const records = await TeacherDailyAttendance.find({
    teacherId,
    isDeleted: false,
    date: { $gte: rangeStart, $lte: rangeEnd },
  })
    .select("date status")
    .lean();

  const days = records.map((record) => ({
    date: toLocalDateKey(record.date),
    status: record.status,
  }));

  return {
    teacherId: teacher._id,
    teacherName: teacher.fullName,
    year: year || null,
    month: month || null,
    from: toLocalDateKey(rangeStart),
    to: toLocalDateKey(rangeEnd),
    days,
  };
};

export const markTeacherAttendance = async (payload, actorId, options = {}) => {
  const { teacherId, status, date, remarks } = payload;
  const source = options.source === "TEACHER" ? "TEACHER" : "ADMIN";

  if (!teacherId || !status) {
    throw new ApiError(400, "teacherId and status are required");
  }

  if (!["PRESENT", "ABSENT", "LATE", "LEAVE"].includes(status)) {
    throw new ApiError(400, "Invalid attendance status");
  }

  const teacher = await User.findOne({
    _id: teacherId,
    role: "TEACHER",
    isDeleted: false,
    isActive: true,
  });

  if (!teacher) {
    throw new ApiError(404, "Teacher not found");
  }

  const day = startOfDay(date);

  const existing = await TeacherDailyAttendance.findOne({
    teacherId,
    date: day,
    isDeleted: false,
  }).lean();

  if (existing) {
    const existingSource = existing.source || "ADMIN";
    if (existingSource === "TEACHER" && source === "ADMIN") {
      throw new ApiError(403, "Attendance already marked by the teacher and cannot be updated by admin");
    }
    if (existingSource === "ADMIN" && source === "TEACHER") {
      throw new ApiError(403, "Attendance already marked by admin and cannot be updated by the teacher");
    }
  }

  const record = await TeacherDailyAttendance.findOneAndUpdate(
    { teacherId, date: day },
    {
      $set: {
        status,
        remarks: remarks?.trim() || "",
        markedBy: actorId,
        source,
        updatedBy: actorId.toString(),
        isDeleted: false,
      },
      $setOnInsert: {
        teacherId,
        date: day,
        createdBy: actorId.toString(),
      },
    },
    { upsert: true, new: true }
  );

  const stats = await getTeacherAttendanceStats(day);

  return { record, stats };
};
