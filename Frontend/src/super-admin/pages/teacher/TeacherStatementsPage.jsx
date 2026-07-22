import TeacherSubpagePlaceholder from "./TeacherSubpagePlaceholder";

export default function TeacherStatementsPage({ dark = false }) {
  return (
    <TeacherSubpagePlaceholder
      dark={dark}
      title="Statements"
      subtitle="Teaching statements, notes, and summaries."
      points={[
        "Add monthly or weekly statements for performance and updates.",
        "This page can later export printable summaries.",
      ]}
    />
  );
}
