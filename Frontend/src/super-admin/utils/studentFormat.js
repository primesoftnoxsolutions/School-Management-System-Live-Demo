function getStudentCreatedValue(student) {
  return student?.createdAt || student?.admissionDate || "";
}

export function getStudentCreatedDateKey(student) {
  const value = getStudentCreatedValue(student);
  if (!value) return "";

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatStudentCreatedDate(student) {
  const key = getStudentCreatedDateKey(student);
  if (!key) return "";

  const parsed = new Date(`${key}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function matchesStudentCreatedDateRange(student, from, to) {
  const key = getStudentCreatedDateKey(student);
  if (!key) return false;
  return key >= from && key <= to;
}

export function matchesStudentClassSection(student, className, section) {
  if (className && student.className !== className) return false;
  if (section && (student.section || "A") !== section) return false;
  return true;
}
