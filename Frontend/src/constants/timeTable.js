export const TIME_TABLE_CLASS_COLUMNS = [
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

export const DEFAULT_BREAK = {
  label: "BREAK TIME",
  start: "11:45",
  end: "12:15",
  afterPeriod: 5,
};

export const DEFAULT_PERIODS = [
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

export function createEmptyAssignments() {
  return Object.fromEntries(TIME_TABLE_CLASS_COLUMNS.map((col) => [col, ""]));
}

export function createBlankPeriodAssignments() {
  return DEFAULT_PERIODS.map((period) => ({
    ...period,
    assignments: createEmptyAssignments(),
  }));
}

export function buildDefaultTimeTableState(branch = "Boys") {
  const normalizedBranch = branch === "Girls" ? "Girls" : "Boys";
  return {
    branch: normalizedBranch,
    breakTime: { ...DEFAULT_BREAK },
    classTeachers: createEmptyAssignments(),
    periods: createBlankPeriodAssignments(),
    isSaved: false,
  };
}

export function normalizeClassTeachers(source = {}) {
  const normalized = createEmptyAssignments();
  TIME_TABLE_CLASS_COLUMNS.forEach((col) => {
    normalized[col] = String(source[col] || "");
  });
  return normalized;
}

export function isTimeTableEmpty(data) {
  if (!data) return true;
  const teachers = data.classTeachers || {};
  const hasHeaderTeachers = TIME_TABLE_CLASS_COLUMNS.some((col) => String(teachers[col] || "").trim());
  if (hasHeaderTeachers) return false;

  const periods = data.periods || [];
  return !periods.some((period) =>
    TIME_TABLE_CLASS_COLUMNS.some((col) => String(period.assignments?.[col] || "").trim())
  );
}

export function normalizeTimeTablePayload(data, branch = "Boys") {
  const normalizedBranch = branch === "Girls" ? "Girls" : "Boys";
  const fallback = buildDefaultTimeTableState(normalizedBranch);

  if (!data || data.isSaved !== true || isTimeTableEmpty(data)) {
    return { ...fallback, isSaved: false };
  }

  const periods = Array.isArray(data.periods) ? data.periods : fallback.periods;
  return {
    branch: data.branch === "Girls" ? "Girls" : "Boys",
    breakTime: {
      label: data.breakTime?.label || DEFAULT_BREAK.label,
      start: data.breakTime?.start || DEFAULT_BREAK.start,
      end: data.breakTime?.end || DEFAULT_BREAK.end,
      afterPeriod: Number(data.breakTime?.afterPeriod || DEFAULT_BREAK.afterPeriod),
    },
    classTeachers: normalizeClassTeachers(data.classTeachers),
    periods: fallback.periods.map((template, index) => {
      const period = periods[index] || template;
      const assignments = createEmptyAssignments();
      const source = period.assignments || {};
      TIME_TABLE_CLASS_COLUMNS.forEach((col) => {
        assignments[col] = String(source[col] || "");
      });
      return {
        number: Number(period.number || template.number || index + 1),
        start: period.start || template.start,
        end: period.end || template.end,
        assignments,
      };
    }),
    isSaved: true,
  };
}
