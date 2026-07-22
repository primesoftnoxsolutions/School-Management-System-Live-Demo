import { CampusTimeTable } from "../../models/CampusTimeTable.js";
import { ApiError } from "../../utils/apiError.js";

const CLASS_COLUMNS = [
  "PG",
  "Nursery",
  "Prep",
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
];

const DEFAULT_BREAK = {
  label: "BREAK TIME",
  start: "11:45",
  end: "12:15",
  afterPeriod: 5,
};

const DEFAULT_PERIODS = [
  { number: 1, start: "08:00", end: "08:45" },
  { number: 2, start: "08:45", end: "09:30" },
  { number: 3, start: "09:30", end: "10:15" },
  { number: 4, start: "10:15", end: "11:00" },
  { number: 5, start: "11:00", end: "11:45" },
  { number: 6, start: "12:15", end: "01:00" },
  { number: 7, start: "01:00", end: "01:45" },
  { number: 8, start: "01:45", end: "02:30" },
  { number: 9, start: "02:30", end: "03:15" },
  { number: 10, start: "03:15", end: "04:00" },
];

const emptyAssignments = () => Object.fromEntries(CLASS_COLUMNS.map((col) => [col, ""]));

const normalizeBranch = (branch) => (branch === "Girls" ? "Girls" : "Boys");

/** Empty structure with default period times only — no demo subjects/teachers. */
const buildEmptyDefault = (branch) => {
  const normalizedBranch = normalizeBranch(branch);
  return {
    branch: normalizedBranch,
    breakTime: { ...DEFAULT_BREAK },
    classTeachers: emptyAssignments(),
    periods: DEFAULT_PERIODS.map((period) => ({
      ...period,
      assignments: emptyAssignments(),
    })),
  };
};

const serializeAssignments = (assignments = {}) => {
  const normalized = emptyAssignments();
  CLASS_COLUMNS.forEach((col) => {
    normalized[col] = String(assignments[col] || assignments.get?.(col) || "");
  });
  return normalized;
};

/** Serialize header teachers without injecting demo names into blank cells. */
const serializeClassTeachers = (classTeachers = {}) => {
  const normalized = emptyAssignments();
  CLASS_COLUMNS.forEach((col) => {
    normalized[col] = String(classTeachers[col] || classTeachers.get?.(col) || "");
  });
  return normalized;
};

const isTimeTableEmpty = (doc) => {
  if (!doc) return true;
  const teachers = doc.classTeachers || {};
  const hasHeaderTeachers = CLASS_COLUMNS.some((col) => String(teachers[col] || teachers.get?.(col) || "").trim());
  if (hasHeaderTeachers) return false;

  const periods = doc.periods || [];
  return !periods.some((period) =>
    CLASS_COLUMNS.some((col) => String(period.assignments?.[col] || period.assignments?.get?.(col) || "").trim())
  );
};

const serializeDoc = (doc, branch) => {
  const normalizedBranch = normalizeBranch(branch);
  const empty = buildEmptyDefault(normalizedBranch);
  if (!doc || isTimeTableEmpty(doc)) return empty;

  const sourcePeriods = Array.isArray(doc.periods) && doc.periods.length ? doc.periods : empty.periods;

  return {
    branch: normalizeBranch(doc.branch),
    breakTime: {
      label: doc.breakTime?.label || DEFAULT_BREAK.label,
      start: doc.breakTime?.start || DEFAULT_BREAK.start,
      end: doc.breakTime?.end || DEFAULT_BREAK.end,
      afterPeriod: Number(doc.breakTime?.afterPeriod || DEFAULT_BREAK.afterPeriod),
    },
    classTeachers: serializeClassTeachers(doc.classTeachers),
    periods: empty.periods.map((template, index) => {
      const period = sourcePeriods[index] || template;
      return {
        number: Number(period.number || template.number),
        start: period.start || template.start,
        end: period.end || template.end,
        assignments: serializeAssignments(period.assignments),
      };
    }),
  };
};

export const getCampusTimeTable = async (branch) => {
  const normalizedBranch = normalizeBranch(branch);
  const doc = await CampusTimeTable.findOne({ branch: normalizedBranch, isDeleted: false }).lean();
  const data = serializeDoc(doc, normalizedBranch);
  // isSaved: true only when a real timetable document with content exists in DB.
  return {
    ...data,
    isSaved: Boolean(doc) && !isTimeTableEmpty(doc),
  };
};

export const saveCampusTimeTable = async (payload, actorId) => {
  const branch = normalizeBranch(payload.branch);
  if (!payload.periods?.length) {
    throw new ApiError(400, "At least one period is required");
  }

  const periods = payload.periods.map((period, index) => ({
    number: Number(period.number || index + 1),
    start: String(period.start || "").trim(),
    end: String(period.end || "").trim(),
    assignments: serializeAssignments(period.assignments),
  }));

  const breakTime = {
    label: String(payload.breakTime?.label || DEFAULT_BREAK.label).trim(),
    start: String(payload.breakTime?.start || DEFAULT_BREAK.start).trim(),
    end: String(payload.breakTime?.end || DEFAULT_BREAK.end).trim(),
    afterPeriod: Number(payload.breakTime?.afterPeriod || DEFAULT_BREAK.afterPeriod),
  };

  const classTeachers = serializeClassTeachers(payload.classTeachers);

  const doc = await CampusTimeTable.findOneAndUpdate(
    { branch, isDeleted: false },
    {
      $set: {
        branch,
        breakTime,
        classTeachers,
        periods,
        updatedBy: actorId,
      },
      $setOnInsert: { createdBy: actorId },
    },
    { upsert: true, new: true, lean: true }
  );

  return {
    ...serializeDoc(doc, branch),
    isSaved: Boolean(doc) && !isTimeTableEmpty(doc),
  };
};
