import { User } from "../../models/User.js";
import { TeacherActivity } from "../../models/TeacherActivity.js";
import { TeacherClass } from "../../models/TeacherClass.js";
import { TeacherProfile } from "../../models/TeacherProfile.js";
import { TeacherDutyAssignment } from "../../models/TeacherDutyAssignment.js";
import { ApiError } from "../../utils/apiError.js";
import { registerUser } from "../auth/auth.service.js";

const parseJoiningDate = (value) => {
  if (!value && value !== 0) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === "number" && Number.isFinite(value) && value > 20000 && value < 100000) {
    const utc = Math.round((value - 25569) * 86400 * 1000);
    const date = new Date(utc);
    if (!Number.isNaN(date.getTime())) {
      return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    }
  }

  const text = String(value || "").trim();
  if (!text) return null;

  const isoMatch = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(text);
  if (isoMatch) {
    const date = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const dmyMatch = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(text);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);
    const date = new Date(year, month - 1, day);
    if (
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseJsonArray = (value, fallback = []) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const normalizeTeacherDocuments = (documents = []) =>
  (Array.isArray(documents) ? documents : []).map((document) => ({
    originalName: document.originalName || "",
    fileName: document.fileName || "",
    url: document.url || "",
    mimeType: document.mimeType || "",
    size: Number(document.size || 0),
    uploadedAt: document.uploadedAt ? new Date(document.uploadedAt) : new Date(),
  }));

const normalizeAssignments = (payload) => {
  if (Array.isArray(payload.assignments) && payload.assignments.length) {
    return payload.assignments
      .map((row) => ({
        className: row.className?.trim(),
        branch: row.branch === "Boys" ? "Boys" : "Girls",
        section: (row.section || "").trim(),
        subject: (row.subject || "").trim(),
      }))
      .filter((row) => row.className && row.section && row.subject);
  }

  if (payload.className) {
    const section = (payload.section || "").trim();
    const subject = (payload.subject || "").trim();
    if (!section) return [];
    return [
      {
        className: payload.className.trim(),
        section,
        subject: subject || "Class Teacher",
      },
    ];
  }

  return [];
};

const saveTeacherAssignments = async (teacherId, assignments, actorId, createdAt = null) => {
  await TeacherClass.updateMany({ teacherId, isDeleted: false }, { $set: { isDeleted: true, updatedBy: actorId } });

  const parsedCreatedAt = createdAt ? new Date(createdAt) : null;
  const hasCreatedAt = parsedCreatedAt && !Number.isNaN(parsedCreatedAt.getTime());

  for (const row of assignments) {
    const created = await TeacherClass.create({
      teacherId,
      className: row.className,
      branch: row.branch || "Girls",
      section: row.section,
      subject: row.subject,
      createdBy: actorId,
      updatedBy: actorId,
    });

    if (hasCreatedAt) {
      await TeacherClass.collection.updateOne(
        { _id: created._id },
        { $set: { createdAt: parsedCreatedAt, updatedAt: parsedCreatedAt } }
      );
    }
  }
};

const saveTeacherProfile = async (teacherId, payload, actorId, fallbackJoiningDate = null) => {
  // Only set fields that are explicitly provided so partial updates
  // (e.g. phone/salary/address from profile popup) do not wipe CNIC, designation, etc.
  const profileData = { updatedBy: actorId };

  if (payload.cnic != null) profileData.cnic = String(payload.cnic || "").trim();
  if (payload.address != null) profileData.address = String(payload.address || "").trim();
  if (payload.phoneNumber != null) profileData.phoneNumber = String(payload.phoneNumber || "").trim();
  if (payload.branch != null) profileData.branch = String(payload.branch || "").trim();
  if (payload.designation != null) profileData.designation = String(payload.designation || "").trim();
  if (payload.qualification != null) profileData.qualification = String(payload.qualification || "").trim();
  if (payload.expertise != null) profileData.expertise = String(payload.expertise || "").trim();
  if (payload.salary != null) {
    profileData.salary =
      payload.salary === "" ? null : Number(String(payload.salary).replace(/[^\d.]/g, ""));
  }
  if (payload.classInchargeClasses != null) {
    profileData.classInchargeClasses = Array.isArray(payload.classInchargeClasses)
      ? payload.classInchargeClasses.map((item) => String(item || "").trim()).filter(Boolean)
      : parseJsonArray(payload.classInchargeClasses, []);
  }
  if (payload.joiningDate != null) {
    profileData.joiningDate = parseJoiningDate(payload.joiningDate) || null;
  } else if (fallbackJoiningDate != null) {
    const parsedFallback = parseJoiningDate(fallbackJoiningDate);
    if (parsedFallback) profileData.joiningDate = parsedFallback;
  }
  if (payload.allowPasswordReset != null) {
    profileData.allowPasswordReset = payload.allowPasswordReset !== false;
  }

  if (payload.documents != null) {
    profileData.documents = normalizeTeacherDocuments(parseJsonArray(payload.documents, []));
  }

  if (payload.password) {
    profileData.loginPassword = payload.password;
  }

  await TeacherProfile.findOneAndUpdate(
    { teacherId, isDeleted: false },
    { $set: profileData, $setOnInsert: { teacherId, createdBy: actorId } },
    { upsert: true, new: true }
  );
};

const getTeacherProfilesMap = async (teacherIds, { includeDeleted = false } = {}) => {
  if (!teacherIds.length) return new Map();
  const filter = { teacherId: { $in: teacherIds } };
  if (!includeDeleted) filter.isDeleted = false;
  const profiles = await TeacherProfile.find(filter).select("+loginPassword").lean();
  const map = new Map();
  profiles.forEach((profile) => map.set(profile.teacherId.toString(), profile));
  return map;
};

export const createTeacher = async (payload, actorId) => {
  const { fullName, email, password } = payload;
  if (!fullName || !email || !password) {
    throw new ApiError(400, "fullName, email, password are required");
  }

  const assignments = normalizeAssignments(payload);
  const normalizedEmail = email.toLowerCase().trim();
  const createdAt = parseJoiningDate(payload.createdAt);
  const joiningDate = parseJoiningDate(payload.joiningDate) || createdAt || new Date();
  const importMode = Boolean(payload.importMode);

  if (importMode) {
    // Import uniqueness is by email only — shared phone/CNIC across teachers is allowed.
    const existingByEmail = await User.findOne({
      email: normalizedEmail,
      role: "TEACHER",
      isDeleted: false,
    })
      .select("_id fullName email")
      .lean();
    if (existingByEmail) {
      const existingName = String(existingByEmail.fullName || fullName).trim() || normalizedEmail;
      throw new ApiError(
        409,
        `${existingName} already exists with same email, so this teacher was not added.`
      );
    }
  } else {
    const existingByEmail = await User.findOne({
      email: normalizedEmail,
      role: "TEACHER",
      isDeleted: false,
    })
      .select("_id")
      .lean();
    if (existingByEmail) {
      throw new ApiError(409, "Email is already in use");
    }
  }

  const teacher = await registerUser({
    fullName,
    email: normalizedEmail,
    password,
    role: "TEACHER",
    actorId,
    isActive: typeof payload.isActive === "boolean" ? payload.isActive : true,
    createdAt,
  });

  if (assignments.length) {
    await saveTeacherAssignments(teacher.id, assignments, actorId, createdAt || joiningDate);
    await TeacherActivity.create({
      teacherId: teacher.id,
      action: importMode ? "CREATE" : "ASSIGN",
      module: "TEACHERS",
      details: importMode
        ? `Imported teacher with assignments: ${assignments.map((a) => `${a.branch} ${a.className} ${a.section} (${a.subject})`).join(", ")}`
        : `Assigned to ${assignments.map((a) => `${a.branch} ${a.className} ${a.section} (${a.subject})`).join(", ")}`,
      status: "SUCCESS",
      performedAt: new Date(),
      createdBy: actorId,
      updatedBy: actorId,
    });
  } else {
    await TeacherActivity.create({
      teacherId: teacher.id,
      action: "CREATE",
      module: "TEACHERS",
      details: importMode ? "Imported teacher without class assignment" : "Teacher created without class assignment",
      status: "SUCCESS",
      performedAt: new Date(),
      createdBy: actorId,
      updatedBy: actorId,
    });
  }

  // Ensure joiningDate from import/file is persisted even when other profile fields are sparse
  await saveTeacherProfile(teacher.id, { ...payload, joiningDate }, actorId, joiningDate);

  return {
    ...teacher,
    assignedClasses: assignments,
    profile: {
      cnic: (payload.cnic || "").trim(),
      address: (payload.address || "").trim(),
      phoneNumber: (payload.phoneNumber || "").trim(),
      branch: (payload.branch || "").trim(),
      designation: (payload.designation || "").trim(),
      qualification: (payload.qualification || "").trim(),
      expertise: (payload.expertise || "").trim(),
      salary: payload.salary === "" || payload.salary == null ? null : Number(String(payload.salary).replace(/[^\d.]/g, "")),
      classInchargeClasses: Array.isArray(payload.classInchargeClasses)
        ? payload.classInchargeClasses.map((item) => String(item || "").trim()).filter(Boolean)
        : parseJsonArray(payload.classInchargeClasses, []),
      joiningDate,
      allowPasswordReset: payload.allowPasswordReset !== false,
      documents: normalizeTeacherDocuments(parseJsonArray(payload.documents, [])),
    },
  };
};

export const updateTeacher = async (id, payload, actorId) => {
  const teacher = await User.findOne({ _id: id, role: "TEACHER", isDeleted: false });
  if (!teacher) throw new ApiError(404, "Teacher not found");

  if (payload.fullName) teacher.fullName = payload.fullName.trim();
  if (payload.email) teacher.email = payload.email.toLowerCase().trim();
  if (payload.password) teacher.password = payload.password;
  if (typeof payload.isActive === "boolean") teacher.isActive = payload.isActive;
  teacher.updatedBy = actorId;
  await teacher.save();

  if (
    payload.password ||
    payload.cnic != null ||
    payload.address != null ||
    payload.phoneNumber != null ||
    payload.branch != null ||
    payload.designation != null ||
    payload.qualification != null ||
    payload.expertise != null ||
    payload.salary != null ||
    payload.classInchargeClasses != null ||
    payload.joiningDate != null ||
    payload.allowPasswordReset != null ||
    payload.documents != null
  ) {
    const existingProfile = await TeacherProfile.findOne({ teacherId: teacher._id, isDeleted: false })
      .select("joiningDate documents")
      .lean();

    // New uploaded files should append to existing documents instead of replacing them.
    if (payload.documents != null && Array.isArray(payload.documents) && payload.documents.length) {
      const existingDocuments = Array.isArray(existingProfile?.documents) ? existingProfile.documents : [];
      payload.documents = [...existingDocuments, ...payload.documents];
    }

    await saveTeacherProfile(teacher._id, payload, actorId, existingProfile?.joiningDate || null);
  }

  if (Array.isArray(payload.assignments)) {
    const assignments = normalizeAssignments(payload);
    await saveTeacherAssignments(teacher._id, assignments, actorId);
    await TeacherActivity.create({
      teacherId: teacher._id,
      action: "UPDATE",
      module: "TEACHERS",
      details: assignments.length
        ? `Updated assignments: ${assignments.map((a) => `${a.branch} ${a.className} ${a.section} (${a.subject})`).join(", ")}`
        : "Removed all class assignments (NO ASSIGN)",
      status: "SUCCESS",
      performedAt: new Date(),
      createdBy: actorId,
      updatedBy: actorId,
    });
  }

  const assignedClasses = await TeacherClass.find({ teacherId: teacher._id, isDeleted: false })
    .select("className branch section subject")
    .lean();
  const profile = await TeacherProfile.findOne({ teacherId: teacher._id, isDeleted: false }).lean();

  return {
    id: teacher._id,
    fullName: teacher.fullName,
    email: teacher.email,
    isActive: teacher.isActive,
    assignedClasses,
    profile,
  };
};

export const getTeachersByClass = async ({ className, section }) => {
  if (!className) throw new ApiError(400, "className is required");

  const filter = { className: className.trim(), isDeleted: false };
  if (section) filter.section = section.trim();

  const rows = await TeacherClass.find(filter)
    .populate({ path: "teacherId", match: { isDeleted: false }, select: "fullName email isActive" })
    .sort({ createdAt: -1 })
    .lean();

  return rows
    .filter((row) => row.teacherId)
    .map((row) => ({
      teacherId: row.teacherId._id,
      fullName: row.teacherId.fullName,
      email: row.teacherId.email,
      isActive: row.teacherId.isActive,
      className: row.className,
      section: row.section,
      subject: row.subject,
    }));
};
export const listTeachers = async ({ page, limit, search, className, section, branch }) => {
  const skip = (page - 1) * limit;
  const filter = { role: "TEACHER", isDeleted: false };

  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  let teacherIdsFilter = null;
  if (className) {
    const classFilter = { className, isDeleted: false };
    if (section) classFilter.section = section;
    const classRows = await TeacherClass.find(classFilter).select("teacherId").lean();
    teacherIdsFilter = classRows.map((row) => row.teacherId);
    if (!teacherIdsFilter.length) {
      return { items: [], total: 0, page, limit, totalPages: 1 };
    }
    filter._id = { $in: teacherIdsFilter };
  }

  if (branch === "Boys" || branch === "Girls") {
    const [classRows, profiles] = await Promise.all([
      TeacherClass.find({ branch, isDeleted: false }).select("teacherId").lean(),
      TeacherProfile.find({ branch, isDeleted: false }).select("teacherId").lean(),
    ]);
    const branchTeacherIds = [
      ...new Set(
        [...classRows, ...profiles]
          .map((row) => String(row.teacherId))
          .filter(Boolean)
      ),
    ];

    if (!branchTeacherIds.length) {
      return { items: [], total: 0, page, limit, totalPages: 1 };
    }

    if (filter._id?.$in) {
      const allowed = new Set(branchTeacherIds);
      filter._id = { $in: filter._id.$in.filter((id) => allowed.has(String(id))) };
      if (!filter._id.$in.length) {
        return { items: [], total: 0, page, limit, totalPages: 1 };
      }
    } else {
      filter._id = { $in: branchTeacherIds };
    }
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select("_id fullName email isActive createdAt")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  const teacherIds = items.map((item) => item._id);
  const [assignedClasses, profileMap] = await Promise.all([
    TeacherClass.find({
      teacherId: { $in: teacherIds },
      isDeleted: false,
    })
      .select("teacherId className branch section subject")
      .lean(),
    getTeacherProfilesMap(teacherIds),
  ]);

  const classMap = new Map();
  assignedClasses.forEach((row) => {
    const key = row.teacherId.toString();
    if (!classMap.has(key)) classMap.set(key, []);
    classMap.get(key).push(row);
  });

  const enriched = items.map((teacher) => ({
    ...teacher,
    assignedClasses: classMap.get(teacher._id.toString()) || [],
    profile: profileMap.get(teacher._id.toString()) || null,
  }));

  return { items: enriched, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
};

export const getTeacherActivities = async ({ page, limit, search, from, to }) => {
  const skip = (page - 1) * limit;
  const teacherFilter = { role: "TEACHER", isDeleted: false };

  if (search) {
    teacherFilter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const teachers = await User.find(teacherFilter).select("_id").lean();
  const teacherIds = teachers.map((item) => item._id);

  const activityFilter = { isDeleted: false, teacherId: { $in: teacherIds } };

  if (from || to) {
    activityFilter.performedAt = {};
    if (from) activityFilter.performedAt.$gte = from;
    if (to) activityFilter.performedAt.$lte = to;
  }

  const [activities, total] = await Promise.all([
    TeacherActivity.find(activityFilter)
      .sort({ performedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("teacherId", "fullName email")
      .lean(),
    TeacherActivity.countDocuments(activityFilter),
  ]);

  return {
    activities,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getMyTeacherPanel = async (teacherId) => {
  const teacher = await User.findById(teacherId).select("_id fullName email role isActive").lean();
  if (!teacher || teacher.role !== "TEACHER") {
    throw new ApiError(403, "Teacher panel access denied");
  }

  const [activities, totalActivities, assignedClasses, todayActivities, dutyAssignment, profile, classBranch] = await Promise.all([
    TeacherActivity.find({ teacherId, isDeleted: false })
      .sort({ performedAt: -1 })
      .limit(20)
      .lean(),
    TeacherActivity.countDocuments({ teacherId, isDeleted: false }),
    TeacherClass.countDocuments({ teacherId, isDeleted: false }),
    (() => {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      return TeacherActivity.countDocuments({
        teacherId,
        isDeleted: false,
        performedAt: { $gte: startOfToday },
      });
    })(),
    TeacherDutyAssignment.findOne({
      weekCommencing: (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const day = today.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        today.setDate(today.getDate() + diff);
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const date = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${date}`;
      })(),
      isDeleted: false,
    })
      .populate("rows.teacherId", "fullName email")
      .lean(),
    TeacherProfile.findOne({ teacherId, isDeleted: false }).select("signatureDataUrl branch").lean(),
    TeacherClass.findOne({ teacherId, isDeleted: false }).select("branch").sort({ updatedAt: -1 }).lean(),
  ]);

  let filteredDuty = dutyAssignment || null;
  if (filteredDuty?.rows?.length) {
    const tid = teacherId.toString();
    const teacherName = String(teacher.fullName || "").trim().toLowerCase();
    filteredDuty = {
      ...filteredDuty,
      rows: filteredDuty.rows.filter((row) => {
        const id = row.teacherId?._id || row.teacherId;
        if (id && id.toString() === tid) return true;
        const rowName = String(row.teacherName || row.teacherId?.fullName || "")
          .trim()
          .toLowerCase();
        return Boolean(teacherName && rowName && (rowName === teacherName || rowName.includes(teacherName) || teacherName.includes(rowName)));
      }),
    };
  }

  const branch =
    profile?.branch === "Boys" || profile?.branch === "Girls"
      ? profile.branch
      : classBranch?.branch === "Boys" || classBranch?.branch === "Girls"
        ? classBranch.branch
        : "Boys";

  return {
    teacher,
    branch,
    signatureDataUrl: profile?.signatureDataUrl || "",
    summary: {
      assignedClasses,
      todaysActivities: todayActivities,
      totalActivities,
      status: teacher.isActive ? "Active" : "Inactive",
    },
    recentActivities: activities,
    dutyAssignment: filteredDuty,
  };
};

export const saveMyTeacherSignature = async (teacherId, signatureDataUrl = "") => {
  const teacher = await User.findById(teacherId).select("_id role").lean();
  if (!teacher || teacher.role !== "TEACHER") {
    throw new ApiError(403, "Teacher panel access denied");
  }

  const value = String(signatureDataUrl || "").trim();
  if (value && !value.startsWith("data:image/")) {
    throw new ApiError(400, "Invalid signature image");
  }

  const profile = await TeacherProfile.findOneAndUpdate(
    { teacherId, isDeleted: false },
    {
      $set: {
        signatureDataUrl: value,
        updatedBy: teacherId.toString(),
      },
      $setOnInsert: {
        teacherId,
        createdBy: teacherId.toString(),
      },
    },
    { upsert: true, new: true }
  ).lean();

  return { signatureDataUrl: profile?.signatureDataUrl || "" };
};

export const removeTeacherFromSchool = async (id, actorId) => {
  const teacher = await User.findOne({ _id: id, role: "TEACHER", isDeleted: false });
  if (!teacher) throw new ApiError(404, "Teacher not found");

  teacher.isDeleted = true;
  teacher.isActive = false;
  teacher.updatedBy = actorId;
  await teacher.save();

  await TeacherClass.updateMany(
    { teacherId: teacher._id, isDeleted: false },
    { $set: { isDeleted: true, updatedBy: actorId } }
  );

  await TeacherProfile.updateMany(
    { teacherId: teacher._id, isDeleted: false },
    { $set: { isDeleted: true, updatedBy: actorId } }
  );

  await TeacherActivity.create({
    teacherId: teacher._id,
    action: "DELETE",
    module: "TEACHERS",
    details: `Removed from school: ${teacher.fullName}`,
    status: "SUCCESS",
    performedAt: new Date(),
    createdBy: actorId,
    updatedBy: actorId,
  });

  return { id: teacher._id, fullName: teacher.fullName };
};

const parseHistoryDate = (value, endOfDay = false) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(
    year,
    month,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

export const getTeacherAssignmentHistory = async ({ from, to, className, section, page, limit }) => {
  const fromDate = parseHistoryDate(from, false);
  const toDate = parseHistoryDate(to, true);

  if (!fromDate || !toDate) {
    throw new ApiError(400, "Valid from and to dates are required");
  }
  if (fromDate > toDate) {
    throw new ApiError(400, "From date cannot be after To date");
  }

  const normalizedClass = (className || "").trim();
  const normalizedSection = (section || "").trim();
  const hasClassFilter = Boolean(normalizedClass && normalizedClass !== "ALL_CLASSES");
  const hasSectionFilter = Boolean(normalizedSection && normalizedSection !== "ALL_SECTIONS");
  const hasAssignmentFilter = hasClassFilter || hasSectionFilter;

  const skip = (page - 1) * limit;
  const filter = {
    createdAt: { $gte: fromDate, $lte: toDate },
  };

  if (hasClassFilter) {
    filter.className = normalizedClass;
  }
  if (hasSectionFilter) {
    filter.section = normalizedSection;
  }

  const [rows, total] = await Promise.all([
    TeacherClass.find(filter)
      .populate({ path: "teacherId", select: "fullName email isActive isDeleted createdAt" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TeacherClass.countDocuments(filter),
  ]);

  const teacherIds = rows
    .filter((row) => row.teacherId)
    .map((row) => row.teacherId._id);

  // When class/section is selected, only assignment-matched teachers belong in the result.
  // Including every teacher created in the date range was wiping Assign Classes/Section to "Not set".
  const createdTeachers = hasAssignmentFilter
    ? []
    : await User.find({
        role: "TEACHER",
        createdAt: { $gte: fromDate, $lte: toDate },
      })
        .select("_id fullName email isActive isDeleted createdAt")
        .lean();

  // Always include removed teachers so Status "Removed" stays populated outside the date window
  const removedTeachers = await User.find({
    role: "TEACHER",
    isDeleted: true,
  })
    .select("_id fullName email isActive isDeleted createdAt")
    .lean();

  const createdTeacherIds = createdTeachers.map((teacher) => teacher._id);
  const removedTeacherIds = removedTeachers.map((teacher) => teacher._id);
  const allTeacherIds = [
    ...new Set([...teacherIds, ...createdTeacherIds, ...removedTeacherIds].map((id) => id.toString())),
  ];
  const profileMap = await getTeacherProfilesMap(allTeacherIds, { includeDeleted: true });

  // Pull assignment history for removed teachers even if outside the selected date range
  const removedAssignmentFilter = { teacherId: { $in: removedTeacherIds } };
  if (hasClassFilter) removedAssignmentFilter.className = normalizedClass;
  if (hasSectionFilter) removedAssignmentFilter.section = normalizedSection;

  const removedAssignmentRows = removedTeacherIds.length
    ? await TeacherClass.find(removedAssignmentFilter)
        .populate({ path: "teacherId", select: "fullName email isActive isDeleted createdAt" })
        .sort({ createdAt: -1 })
        .lean()
    : [];

  const assignmentMap = new Map();
  [...rows, ...removedAssignmentRows].forEach((row) => {
    if (!row.teacherId) return;
    const key = row.teacherId._id.toString();
    if (!assignmentMap.has(key)) assignmentMap.set(key, []);
    assignmentMap.get(key).push(row);
  });

  const matchesAssignmentFilters = (row) => {
    if (hasClassFilter && row.className !== normalizedClass) return false;
    if (hasSectionFilter && (row.section || "A") !== normalizedSection) return false;
    return true;
  };

  const matchedCreatedTeachers = [...createdTeachers, ...removedTeachers].filter((teacher, index, list) => {
    // de-dupe by id
    if (list.findIndex((item) => item._id.toString() === teacher._id.toString()) !== index) return false;
    const teacherAssignments = (assignmentMap.get(teacher._id.toString()) || []).filter(matchesAssignmentFilters);
    if (teacher.isDeleted) {
      // With class/section filters, only keep removed teachers who still have matching assignments
      return hasAssignmentFilter ? teacherAssignments.length > 0 : true;
    }
    if (teacherAssignments.length) return true;
    // Unassigned teachers only belong in the unfiltered (All Classes / All Sections) view
    return !hasAssignmentFilter;
  });

  const seenAssignmentIds = new Set();
  const teacherRows = [...rows, ...removedAssignmentRows]
    .filter((row) => row.teacherId)
    .filter((row) => matchesAssignmentFilters(row))
    .filter((row) => {
      const id = row._id.toString();
      if (seenAssignmentIds.has(id)) return false;
      seenAssignmentIds.add(id);
      return true;
    })
    .map((row) => ({
      id: row._id.toString(),
      teacherId: row.teacherId._id.toString(),
      teacherName: row.teacherId.fullName,
      email: row.teacherId.email,
      className: row.className,
      section: row.section || "A",
      subject: row.subject,
      assignedAt: row.createdAt,
      teacherCreatedAt: row.teacherId.createdAt,
      assignmentStatus: row.isDeleted || row.teacherId.isDeleted ? "Removed" : "Active",
      teacherStatus: row.teacherId.isDeleted ? "Removed" : row.teacherId.isActive ? "Active" : "Inactive",
      isActive: !row.teacherId.isDeleted && Boolean(row.teacherId.isActive),
      profile: profileMap.get(row.teacherId._id.toString()) || null,
    }));

  const importedTeacherRows = matchedCreatedTeachers
    .filter((teacher) => !assignmentMap.has(teacher._id.toString()))
    .map((teacher) => {
      const profile = profileMap.get(teacher._id.toString()) || null;
      return {
        id: `teacher:${teacher._id.toString()}`,
        teacherId: teacher._id.toString(),
        teacherName: teacher.fullName,
        email: teacher.email,
        className: "",
        section: "",
        subject: "",
        assignedAt: teacher.createdAt,
        teacherCreatedAt: teacher.createdAt,
        assignmentStatus: teacher.isDeleted ? "Removed" : "Imported",
        teacherStatus: teacher.isDeleted ? "Removed" : teacher.isActive ? "Active" : "Inactive",
        isActive: !teacher.isDeleted && Boolean(teacher.isActive),
        profile,
      };
    });

  const items = [...teacherRows, ...importedTeacherRows].sort((a, b) => new Date(b.assignedAt || b.teacherCreatedAt || 0) - new Date(a.assignedAt || a.teacherCreatedAt || 0));

  return {
    items,
    total: items.length,
    page,
    limit,
    totalPages: 1,
  };
};
