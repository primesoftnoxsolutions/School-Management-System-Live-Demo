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

/** Blank editor defaults: period times only, no demo subjects/teachers. */
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

/** Maps assignment class names (e.g. "Grade 1") to timetable grid columns (e.g. "1st"). */
export const CLASS_NAME_TO_TIMETABLE_COLUMN = {
  "Play Group": "PG",
  "Play-Group": "PG",
  PG: "PG",
  Nursery: "Nursery",
  Prep: "Prep",
  "Grade 1": "1st",
  "1st": "1st",
  "Grade 2": "2nd",
  "2nd": "2nd",
  "Grade 3": "3rd",
  "3rd": "3rd",
  "Grade 4": "4th",
  "4th": "4th",
  "Grade 5": "5th",
  "5th": "5th",
  "Grade 6": "6th",
  "6th": "6th",
  "Grade 7": "7th",
  "7th": "7th",
  "Grade 8": "8th",
  "8th": "8th",
  "Grade 9": "9th",
  "9th": "9th",
  "Grade 10": "10th",
  "10th": "10th",
};

export function toTimeTableClassColumn(className) {
  const raw = String(className || "").trim();
  if (!raw) return "";
  if (CLASS_NAME_TO_TIMETABLE_COLUMN[raw]) return CLASS_NAME_TO_TIMETABLE_COLUMN[raw];

  const lower = raw.toLowerCase();
  const entry = Object.entries(CLASS_NAME_TO_TIMETABLE_COLUMN).find(([key]) => key.toLowerCase() === lower);
  if (entry) return entry[1];

  const gradeMatch = /^grade\s*(\d+)$/i.exec(raw);
  if (gradeMatch) {
    const n = Number(gradeMatch[1]);
    if (n >= 1 && n <= 10) {
      if (n === 1) return "1st";
      if (n === 2) return "2nd";
      if (n === 3) return "3rd";
      return `${n}th`;
    }
  }

  const classMatch = /^(?:class|cls)\s*(\d+)$/i.exec(raw);
  if (classMatch) {
    const n = Number(classMatch[1]);
    if (n >= 1 && n <= 10) {
      if (n === 1) return "1st";
      if (n === 2) return "2nd";
      if (n === 3) return "3rd";
      return `${n}th`;
    }
  }

  const ordinalMatch = /^(\d+)(st|nd|rd|th)$/i.exec(raw);
  if (ordinalMatch) {
    const n = Number(ordinalMatch[1]);
    if (n >= 1 && n <= 10) {
      if (n === 1) return "1st";
      if (n === 2) return "2nd";
      if (n === 3) return "3rd";
      return `${n}th`;
    }
  }

  return TIME_TABLE_CLASS_COLUMNS.includes(raw) ? raw : "";
}

function normalizeLookupKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function namesMatch(a, b) {
  const left = normalizeLookupKey(a);
  const right = normalizeLookupKey(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

/** Pulls subject text from a timetable cell (plain subject or "Name (Subject)"). */
export function extractSubjectFromCell(cellValue) {
  const raw = String(cellValue || "").trim();
  if (!raw) return "";
  const paren = /\(([^)]+)\)\s*$/.exec(raw);
  if (paren?.[1]) return paren[1].trim();
  return raw;
}

function subjectMatchesCell(assignedSubject, cellValue) {
  const subject = normalizeLookupKey(assignedSubject);
  const cell = normalizeLookupKey(cellValue);
  if (!subject || !cell) return false;
  if (subject === "class teacher") return false;

  const extracted = normalizeLookupKey(extractSubjectFromCell(cellValue));
  return cell === subject || extracted === subject || cell.includes(subject) || extracted.includes(subject);
}

/**
 * Resolve period time slots for a teacher class assignment from the campus timetable.
 * Lecture 1 holds the incharge teacher's first assigned subject for that class.
 */
export function findTimetableSlotsForAssignment({
  timeTable,
  className,
  subject,
  teacherName = "",
} = {}) {
  if (!timeTable || !Array.isArray(timeTable.periods)) return [];

  const column = toTimeTableClassColumn(className);
  if (!column) return [];

  const assignedSubject = String(subject || "").trim();
  const isClassTeacherRole = normalizeLookupKey(assignedSubject) === "class teacher";
  const classTeacherName = String(timeTable.classTeachers?.[column] || "").trim();
  const teacherIsClassTeacher = teacherName ? namesMatch(teacherName, classTeacherName) : false;

  const slots = [];

  timeTable.periods.forEach((period) => {
    const periodNumber = Number(period.number) || 0;
    const cellValue = String(period?.assignments?.[column] ?? period?.assignments?.get?.(column) ?? "").trim();
    const start = String(period?.start || "").trim();
    const end = String(period?.end || "").trim();
    if (!start || !end) return;

    let matched = false;
    let matchedSubject = assignedSubject || extractSubjectFromCell(cellValue) || "Subject";

    if (isClassTeacherRole) {
      matched = teacherIsClassTeacher && periodNumber === 1 && Boolean(cellValue);
      if (matched) matchedSubject = extractSubjectFromCell(cellValue) || cellValue || "Class Teacher";
    } else if (assignedSubject) {
      if (!subjectMatchesCell(assignedSubject, cellValue)) return;

      const extracted = extractSubjectFromCell(cellValue);
      const cellTeacher = String(cellValue)
        .replace(/\s*\([^)]*\)\s*$/, "")
        .trim();
      const hasExplicitTeacher =
        Boolean(cellTeacher) && cellTeacher.toLowerCase() !== String(extracted || "").toLowerCase();

      // Lecture 1 is the incharge's first subject — match when incharge teaches this subject.
      if (periodNumber === 1) {
        if (teacherName && classTeacherName && !namesMatch(teacherName, classTeacherName)) return;
        matched = true;
      } else {
        if (teacherName && hasExplicitTeacher && !namesMatch(teacherName, cellTeacher)) return;
        matched = true;
      }
      matchedSubject = assignedSubject;
    }

    if (!matched) return;

    slots.push({
      number: periodNumber,
      start,
      end,
      subject: matchedSubject,
      label: `${matchedSubject}: ${start} - ${end}`,
    });
  });

  return slots.sort((a, b) => a.number - b.number);
}

/** Normalize API timetable for lookups without injecting demo subjects. */
export function normalizeTimeTableForLookup(data) {
  // Only use times after an admin explicitly saves the Time Table page.
  if (!data || data.isSaved !== true || isTimeTableEmpty(data)) return null;

  const classTeachersSource = data.classTeachers || {};
  const classTeachers =
    classTeachersSource instanceof Map
      ? Object.fromEntries(classTeachersSource.entries())
      : { ...classTeachersSource };

  const periods = Array.isArray(data.periods) ? data.periods : [];

  return {
    branch: data.branch === "Girls" ? "Girls" : "Boys",
    breakTime: {
      label: data.breakTime?.label || DEFAULT_BREAK.label,
      start: data.breakTime?.start || DEFAULT_BREAK.start,
      end: data.breakTime?.end || DEFAULT_BREAK.end,
      afterPeriod: Number(data.breakTime?.afterPeriod || DEFAULT_BREAK.afterPeriod),
    },
    classTeachers: Object.fromEntries(
      TIME_TABLE_CLASS_COLUMNS.map((col) => [col, String(classTeachers[col] || "")])
    ),
    periods: periods.map((period, index) => {
      const source = period.assignments || {};
      const assignments =
        source instanceof Map ? Object.fromEntries(source.entries()) : { ...source };
      return {
        number: Number(period.number || index + 1),
        start: String(period.start || "").trim(),
        end: String(period.end || "").trim(),
        assignments: Object.fromEntries(
          TIME_TABLE_CLASS_COLUMNS.map((col) => [col, String(assignments[col] || "")])
        ),
      };
    }),
  };
}
