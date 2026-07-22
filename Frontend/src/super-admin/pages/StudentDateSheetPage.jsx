import StudentRollSlipsPage from "./StudentRollSlipsPage";

const examTypeOptions = [
  { value: "", label: "Select Exam Type" },
  { value: "1st Term", label: "1st Term" },
  { value: "2nd Term", label: "2nd Term" },
  { value: "3rd Term", label: "3rd Term" },
  { value: "Final", label: "Final" },
];

export default function StudentDateSheetPage({ dark = false, branchSection = "Boys" }) {
  return (
    <StudentRollSlipsPage
      dark={dark}
      branchSection={branchSection}
      documentType="DATE_SHEET"
      previewVariant="dateSheet"
      title="Date Sheet"
      subtitle="Released date sheets from teacher portal appear here."
      listTitle="Date Sheet List"
      slipTypeLabel="Exam Type"
      slipTypePlaceholder="Select Exam Type"
      slipTypeOptions={examTypeOptions}
      rowTypeLabels={["1st Term", "2nd Term", "3rd Term", "Final"]}
      exportFileName="date_sheet.csv"
      emptyMessage="No date sheets found."
    />
  );
}
