export const CLASS_OPTIONS = [
  "Play Group",
  "Nursery",
  "Prep",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "Graduation",
];

export const SECTION_OPTIONS = ["A", "B", "C", "D"];

export const BRANCH_OPTIONS = ["Girls", "Boys"];

export const getClassSectionOptions = () =>
  CLASS_OPTIONS.flatMap((className) =>
    SECTION_OPTIONS.map((section) => ({
      className,
      section,
      label: `${className} ${section}`,
      value: `${className}|${section}`,
    }))
  );

export const SUBJECT_OPTIONS = [
  "Mathematics",
  "English",
  "Urdu",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Islamiat",
  "Pakistan Studies",
  "Class Teacher",
];

export const getNextClass = (current) => {
  const idx = CLASS_OPTIONS.findIndex((c) => c.toLowerCase() === current?.trim().toLowerCase());
  return idx >= 0 && CLASS_OPTIONS[idx + 1] ? CLASS_OPTIONS[idx + 1] : null;
};
