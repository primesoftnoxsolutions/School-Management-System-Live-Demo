import StudentRollSlipsPage from "./StudentRollSlipsPage";

const resultCardTypeOptions = [
  { value: "", label: "Select Result Cards Type" },
  { value: "1st Term", label: "1st Term" },
  { value: "2nd Term", label: "2nd Term" },
  { value: "3rd Term", label: "3rd Term" },
  { value: "Final", label: "Final" },
];

export default function StudentResultCardsPage({ dark = false, branchSection = "Boys" }) {
  return (
    <StudentRollSlipsPage
      dark={dark}
      branchSection={branchSection}
      documentType="RESULT_CARD"
      previewVariant="resultCard"
      title="Result Cards"
      subtitle="Released result cards from teacher portal appear here."
      listTitle="Result Cards List"
      slipTypeLabel="Result Cards Type"
      slipTypePlaceholder="Select Result Cards Type"
      slipTypeOptions={resultCardTypeOptions}
      rowTypeLabels={["1st Term", "2nd Term", "3rd Term", "Final"]}
      exportFileName="result_cards.csv"
      emptyMessage="No result cards found."
      filtersPlacement="header"
      classSelectLabel="Class"
      sectionSelectLabel="Section"
      studentSelectLabel="Student Name"
      editModalTitle="Edit Result Card"
    />
  );
}
