export const STUDENT_SUBPAGES = [
  { id: "Student Admissions", label: "Admissions" },
  { id: "Student Attendance", label: "Attendance" },
  { id: "Student Time Table", label: "Time Table" },
  { id: "Student Roll Slips", label: "Roll Slips" },
  { id: "Student Date Sheet", label: "Date Sheet" },
  { id: "Student Result Cards", label: "Result Cards" },
];

export const isStudentSubpage = (selected) => STUDENT_SUBPAGES.some((item) => item.id === selected);
