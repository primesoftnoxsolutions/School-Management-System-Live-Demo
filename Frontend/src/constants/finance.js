const FEE_TYPES = [
  { value: "TUITION", label: "Tuition Fee" },
  { value: "TRANSPORT", label: "Transport Fee" },
  { value: "EXAM", label: "Exam Fee" },
  { value: "ADMISSION", label: "Admission Fee" },
  { value: "LAB", label: "Lab Fee" },
  { value: "LIBRARY", label: "Library Fee" },
  { value: "SPORTS", label: "Sports Fee" },
  { value: "ANNUAL", label: "Annual Fee" },
  { value: "OTHER", label: "Other" },
];

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK", label: "Bank Transfer" },
  { value: "ONLINE", label: "Online" },
  { value: "CHEQUE", label: "Cheque" },
];

const FINE_TYPES = [
  { value: "LATE_FEE", label: "Late Fee" },
  { value: "DISCIPLINE", label: "Discipline" },
  { value: "LIBRARY", label: "Library" },
  { value: "UNIFORM", label: "Uniform" },
  { value: "DAMAGE", label: "Damage" },
  { value: "ABSENCE", label: "Absence" },
  { value: "OTHER", label: "Other" },
];

const REFUND_TYPES = [
  { value: "FEES", label: "Tuition / Monthly Fees" },
  { value: "ADMISSION", label: "Admission Fee" },
  { value: "FINE", label: "Fine" },
  { value: "TRANSPORT", label: "Transport Fee" },
  { value: "OTHER", label: "Other" },
];

const REFUND_STATUS = ["PENDING", "APPROVED", "REJECTED", "PROCESSED"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export { FEE_TYPES, PAYMENT_METHODS, FINE_TYPES, REFUND_STATUS, REFUND_TYPES, MONTHS };

export const labelFeeType = (v) => FEE_TYPES.find((f) => f.value === v)?.label || v;
export const labelPayment = (v) => PAYMENT_METHODS.find((p) => p.value === v)?.label || v;
