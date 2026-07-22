import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../services/api/client";
import { CLASS_OPTIONS, SECTION_OPTIONS, SUBJECT_OPTIONS } from "../../constants/classes";
import { resolveStudentPhotoUrl } from "../../utils/mediaUrl";
import ModernDatePicker from "../ui/ModernDatePicker";
import ScrollableSelect from "../ui/ScrollableSelect";
import SubjectManager from "../teachers/SubjectManager";

const STEPS = [
  { id: 1, title: "Personal Info" },
  { id: 2, title: "Guardians Details" },
  { id: 3, title: "Students Previous Data" },
  { id: 4, title: "Class, Section, Subjects" },
  { id: 5, title: "Fee Details" },
];

const INSTALLMENT_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const value = String(index + 1);
  return { value, label: `${index + 1} month${index + 1 > 1 ? "s" : ""}` };
});

function calcMonthlyFromAnnual(annualFee, installmentCount) {
  const annual = Number(annualFee || 0);
  const count = Math.max(1, Number(installmentCount || 1));
  if (!annual || !count) return 0;
  return Math.round((annual / count) * 100) / 100;
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `Rs. ${amount.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

const RESULT_GRADE_TO_PERCENTAGE = {
  "A+": "95",
  A: "85",
  "B+": "75",
  B: "65",
  C: "55",
  D: "45",
  Pass: "50",
  Fail: "0",
  "N/A": "",
};

function gradeFromPercentage(percentage) {
  const numeric = Number(percentage);
  if (!Number.isFinite(numeric)) return "";
  if (numeric >= 90) return "A+";
  if (numeric >= 80) return "A";
  if (numeric >= 70) return "B+";
  if (numeric >= 60) return "B";
  if (numeric >= 50) return "C";
  if (numeric >= 40) return "D";
  return "Fail";
}

function resolvePreviousRowPercentage(row) {
  return row.percentage || RESULT_GRADE_TO_PERCENTAGE[row.resultGrade] || "";
}

function resolvePreviousRowResultGrade(row) {
  return row.resultGrade || gradeFromPercentage(resolvePreviousRowPercentage(row)) || "";
}

let previousRowCounter = 0;

function createPreviousRow() {
  previousRowCounter += 1;
  return {
    id: `prev-${previousRowCounter}`,
    previousClass: "",
    resultGrade: "",
    percentage: "",
    documentUrl: "",
  };
}

export function createRegistrationNumber() {
  return "";
}

/** Admission history number preview (final value comes from API). */
export function createAdmissionNumber() {
  const year = new Date().getFullYear();
  return `ADM-${year}-000001`;
}

export const initialCreateStudentForm = {
  studentPhotoUrl: "",
  registrationNo: "",
  fullName: "",
  cnicBForm: "",
  address: "",
  phoneNumber: "",
  gender: "MALE",
  dateOfBirth: "",
  fatherName: "",
  fatherCnic: "",
  guardianPhone: "",
  alternativePhone: "",
  fatherOccupation: "",
  previousResults: [createPreviousRow()],
  schoolLeavingCertificate: "",
  characterCertificate: "",
  className: "",
  section: "A",
  rollNumber: "",
  subjects: [],
  subjectPool: [...SUBJECT_OPTIONS],
  admissionFee: "",
  annualFee: "",
  useInstallments: false,
  installmentCount: "1",
};

function Field({ label, required, children, dark = false }) {
  return (
    <div>
      <label className={`mb-1.5 block text-sm font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-700"}`}>
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      {children}
    </div>
  );
}

function digitsOnly(value = "") {
  return String(value || "").replace(/\D/g, "");
}

function formatCnicInput(value = "") {
  const digits = digitsOnly(value).slice(0, 13);
  const part1 = digits.slice(0, 5);
  const part2 = digits.slice(5, 12);
  const part3 = digits.slice(12, 13);
  if (digits.length <= 5) return part1;
  if (digits.length <= 12) return `${part1}-${part2}`;
  return `${part1}-${part2}-${part3}`;
}

function formatPhoneInput(value = "") {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

function inputClass(dark = false, extra = "", hasError = false) {
  const errorBorder = hasError
    ? dark
      ? "border-rose-500 ring-2 ring-rose-500/30 focus:border-rose-500 focus:ring-rose-500/30"
      : "border-rose-500 ring-2 ring-rose-200 focus:border-rose-500 focus:ring-rose-200"
    : "";
  const base = dark
    ? `w-full rounded-xl border bg-[#1a1b26] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-[#9e9e9e] ${
        hasError ? errorBorder : "border-white/[0.06] focus:border-[#7c4dff]/40 focus:ring-2 focus:ring-[#7c4dff]/15"
      } ${extra}`
    : `w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition ${
        hasError ? errorBorder : "border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      } ${extra}`;
  return base;
}

export function buildStudentPayload(form) {
  const nameParts = form.fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || firstName;
  const previousResults = (form.previousResults || []).map((row) => ({
    previousClass: row.previousClass || "",
    resultGrade: resolvePreviousRowResultGrade(row),
    percentage: resolvePreviousRowPercentage(row),
    documentUrl: row.documentUrl || "",
  }));
  const firstPrevious = previousResults[0] || {};

  const payload = {
    firstName,
    lastName,
    admissionNo: form.registrationNo,
    rollNumber: form.rollNumber,
    fatherName: form.fatherName,
    cnicBForm: form.cnicBForm,
    guardianName: form.fatherName,
    guardianPhone: form.guardianPhone,
    gender: form.gender,
    className: form.className,
    section: form.section,
    address: form.address,
    phoneNumber: form.phoneNumber,
    fatherCnic: form.fatherCnic,
    alternativePhone: form.alternativePhone,
    fatherOccupation: form.fatherOccupation,
    previousClass: firstPrevious.previousClass || "",
    previousResultGrade: firstPrevious.resultGrade || "",
    previousResultPercentage: firstPrevious.percentage || "",
    previousResults,
    subjects: form.subjects || [],
    schoolLeavingCertificate: form.schoolLeavingCertificate,
    characterCertificate: form.characterCertificate,
    status: "ACTIVE",
  };

  if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
  if (form.studentPhotoUrl) payload.studentPhotoUrl = form.studentPhotoUrl;

  const admissionFee = Number(form.admissionFee || 0);
  const annualFee = Number(form.annualFee || 0);
  const installmentCount = form.useInstallments ? Math.max(1, Number(form.installmentCount || 1)) : 0;
  const monthlyFee = form.useInstallments ? calcMonthlyFromAnnual(annualFee, installmentCount) : 0;

  payload.admissionFee = admissionFee;
  payload.annualFee = annualFee;
  payload.monthlyFee = monthlyFee;
  payload.installmentCount = installmentCount;
  payload.useInstallments = Boolean(form.useInstallments);

  return payload;
}

export function mapStudentToAssignmentForm(student) {
  const subjects = Array.isArray(student?.subjects) ? student.subjects : [];
  const firstName = student?.firstName || "";
  const lastName = student?.lastName || "";

  return {
    ...initialCreateStudentForm,
    registrationNo: student?.admissionNo || "",
    fullName: `${firstName} ${lastName}`.trim(),
    className: student?.className || "",
    section: student?.section || "A",
    rollNumber: student?.rollNumber || "",
    subjects,
    subjectPool: [...new Set([...SUBJECT_OPTIONS, ...subjects])],
    fatherName: student?.fatherName || student?.guardianName || "",
    guardianPhone: student?.guardianPhone || "",
    gender: student?.gender || "MALE",
    address: student?.address || "",
  };
}

export function buildAssignmentUpdatePayload(form) {
  return {
    className: form.className,
    section: form.section || "A",
    subjects: form.subjects || [],
    rollNumber: form.rollNumber || "",
  };
}

function StudentAvatarPreview({ form, dark = false }) {
  const initials = (form.fullName || "?")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (form.studentPhotoUrl) {
    const photoSrc = resolveStudentPhotoUrl(form.studentPhotoUrl);
    return (
      <img
        src={photoSrc || form.studentPhotoUrl}
        alt={initials}
        className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-white"
      />
    );
  }

  return (
    <div
      className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-xl font-bold ring-2 ring-white ${
        dark ? "bg-[#7c4dff]/20 text-[#7c4dff]" : "bg-indigo-100 text-indigo-700"
      }`}
    >
      {initials}
    </div>
  );
}

function readFileAsDataUrl(file, onDone, onError) {
  if (file.size > 2 * 1024 * 1024) {
    onError("File must be under 2MB");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onDone(reader.result);
  reader.readAsDataURL(file);
}

function IconPlus() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconMinus() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  );
}

export default function CreateStudentWizard({
  form,
  setForm,
  onSubmit,
  saving,
  onCancel,
  onTitleChange,
  submitError = "",
  onDismissError,
  dark = false,
  mode = "create",
  /** "studentId" = Student Management BC-…; "admissionNo" = Admissions ADM-… history number */
  identifierMode = "studentId",
}) {
  const assignmentEditMode = mode === "assignment-edit";
  const isAdmissionIdentifier = identifierMode === "admissionNo";
  const [step, setStep] = useState(assignmentEditMode ? 4 : 1);
  const [stepDirection, setStepDirection] = useState("forward");
  const [stepError, setStepError] = useState("");
  const [loadingRoll, setLoadingRoll] = useState(false);
  const initialAssignmentRef = useRef({
    className: form.className,
    section: form.section || "A",
    rollNumber: form.rollNumber,
  });
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    onTitleChange?.(form.fullName?.trim() || "");
  }, [form.fullName, onTitleChange]);

  useEffect(() => {
    setStepError("");
  }, [step]);

  const classOptions = useMemo(
    () => CLASS_OPTIONS.map((item) => ({ value: item, label: item })),
    []
  );
  const sectionOptions = useMemo(
    () => SECTION_OPTIONS.map((item) => ({ value: item, label: `Section ${item}` })),
    []
  );
  const previousClassOptions = useMemo(
    () => [{ value: "", label: "Select previous class" }, ...CLASS_OPTIONS.map((item) => ({ value: item, label: item }))],
    []
  );
  const percentageOptions = useMemo(
    () =>
      Array.from({ length: 101 }, (_, percentage) => {
        const value = String(percentage);
        return {
          value,
          label: `${percentage}% - Result Grade ${gradeFromPercentage(value)}`,
        };
      }),
    []
  );
  const installmentOptions = useMemo(
    () => [{ value: "", label: "Select installments" }, ...INSTALLMENT_OPTIONS],
    []
  );

  const calculatedMonthlyFee = useMemo(
    () => (form.useInstallments ? calcMonthlyFromAnnual(form.annualFee, form.installmentCount) : 0),
    [form.useInstallments, form.annualFee, form.installmentCount]
  );

  const update = (patch) => {
    onDismissError?.();
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const updatePreviousRow = (rowId, patch) => {
    update({
      previousResults: (form.previousResults || []).map((row) =>
        row.id === rowId ? { ...row, ...patch } : row
      ),
    });
  };

  const addPreviousRow = () => {
    update({
      previousResults: [...(form.previousResults || []), createPreviousRow()],
    });
  };

  const removePreviousRow = (rowId) => {
    const rows = form.previousResults || [];
    if (rows.length <= 1) return;
    update({ previousResults: rows.filter((row) => row.id !== rowId) });
  };

  useEffect(() => {
    if (step !== 4 || !form.className) return;

    const classSectionChanged =
      form.className !== initialAssignmentRef.current.className ||
      (form.section || "A") !== (initialAssignmentRef.current.section || "A");

    if (assignmentEditMode && !classSectionChanged) {
      return;
    }

    let cancelled = false;
    setLoadingRoll(true);
    api
      .get("/students/next-roll", { params: { className: form.className, section: form.section || "A" } })
      .then(({ data }) => {
        if (cancelled) return;
        const patch = { rollNumber: data.data?.rollNumber || "" };
        // Only Student Management syncs Student ID (BC-…) from class/section.
        if (!isAdmissionIdentifier) {
          patch.registrationNo = data.data?.admissionNo || data.data?.studentId || "";
        }
        update(patch);
      })
      .catch(() => {
        if (!cancelled) {
          update(isAdmissionIdentifier ? { rollNumber: "" } : { rollNumber: "", registrationNo: "" });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRoll(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, form.className, form.section, assignmentEditMode, isAdmissionIdentifier]);

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!form.fullName.trim()) return "Full Name is required.";
      if (!form.cnicBForm.trim()) return "CNIC / B-Form is required.";
      if (digitsOnly(form.cnicBForm).length !== 13) return "Enter a valid 13-digit CNIC / B-Form.";
      if (!form.phoneNumber.trim()) return "Phone Number is required.";
      if (digitsOnly(form.phoneNumber).length !== 11) return "Enter a valid 11-digit phone number.";
      if (!form.address.trim()) return "Address is required.";
      if (!form.gender) return "Gender is required.";
      if (!form.dateOfBirth) return "Date of Birth is required.";
      return "";
    }
    if (currentStep === 2) {
      if (!form.fatherName.trim()) return "Father Name is required.";
      if (!form.fatherCnic.trim()) return "Father CNIC is required.";
      if (digitsOnly(form.fatherCnic).length !== 13) return "Enter a valid 13-digit Father CNIC.";
      if (!form.guardianPhone.trim()) return "Call Number is required.";
      if (digitsOnly(form.guardianPhone).length !== 11) return "Enter a valid 11-digit Call Number.";
      if (form.alternativePhone.trim() && digitsOnly(form.alternativePhone).length !== 11) {
        return "Enter a valid 11-digit WhatsApp Number, or leave it blank.";
      }
      if (!form.fatherOccupation.trim()) return "Father Occupation is required.";
      return "";
    }
    if (currentStep === 3) {
      const rows = form.previousResults || [];
      if (!rows.length) return "Please add at least one previous class result.";
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        const percentage = resolvePreviousRowPercentage(row);
        if (!row.previousClass) {
          return `Previous Class is required for entry ${i + 1}.`;
        }
        if (!percentage && percentage !== "0") {
          return `Percentage is required for entry ${i + 1}.`;
        }
      }
      return "";
    }
    if (currentStep === 4) {
      if (!form.className) return "Please select a class.";
      if (!form.section) return "Please select a section.";
      if (!(form.subjects || []).length) return "Please select at least one subject.";
      return "";
    }
    if (currentStep === 5) {
      if (form.admissionFee === "" || form.admissionFee === null || form.admissionFee === undefined) {
        return "Admission fee is required.";
      }
      if (Number(form.admissionFee) < 0) return "Admission fee cannot be negative.";
      if (form.annualFee === "" || form.annualFee === null || form.annualFee === undefined) {
        return "Annual fee is required.";
      }
      if (Number(form.annualFee) < 0) return "Annual fee cannot be negative.";
      if (form.useInstallments) {
        if (Number(form.annualFee) <= 0) return "Annual fee must be greater than zero for installments.";
        if (!form.installmentCount) return "Please select the number of months.";
      }
      return "";
    }
    return "";
  };

  const goNext = () => {
    const message = validateStep(step);
    if (message) {
      setStepError(message);
      return;
    }
    setStepError("");
    onDismissError?.();
    setStepDirection("forward");
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const goBack = () => {
    setStepError("");
    onDismissError?.();
    setStepDirection("back");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const message = validateStep(5);
    if (message) {
      setStepError(message);
      setStep(5);
      return;
    }
    setStepError("");
    onSubmit(form);
  };

  const submitLabel = assignmentEditMode
    ? saving
      ? "Updating..."
      : "Update Student"
    : saving
      ? "Saving..."
      : "Add Student";

  const onPhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setStepError("Profile picture must be under 2MB");
      return;
    }
    setStepError("");
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const { data } = await api.post("/students/upload-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      update({ studentPhotoUrl: data.data?.url || "" });
    } catch (err) {
      setStepError(err.response?.data?.message || "Failed to upload profile photo");
    }
  };

  const onCertificateChange = (field, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    readFileAsDataUrl(
      file,
      (value) => update({ [field]: value }),
      (message) => setStepError(message)
    );
  };

  const onPreviousDocumentChange = (rowId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    readFileAsDataUrl(
      file,
      (value) => updatePreviousRow(rowId, { documentUrl: value }),
      (message) => setStepError(message)
    );
  };

  const stepPanelClass = stepDirection === "back" ? "wizard-step-enter-back" : "wizard-step-enter";
  const cardClass = dark
    ? "rounded-2xl border border-white/[0.06] bg-[#1a1b26]/60 p-4"
    : "rounded-2xl border border-slate-200 bg-slate-50/70 p-4";
  const innerCardClass = dark
    ? "rounded-2xl border border-white/[0.06] bg-[#161722] p-4"
    : "rounded-2xl border border-slate-200 bg-white p-4";
  const assignCardClass = dark
    ? "rounded-2xl border border-[#7c4dff]/20 bg-[#7c4dff]/10 p-4"
    : "rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4";
  const displayError = stepError || ((step === 4 || step === 5 || assignmentEditMode) ? submitError : "");
  const visibleSteps = assignmentEditMode ? STEPS.filter((item) => item.id === 4) : STEPS;

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden">
      {step !== 5 ? (
        <div className="flex shrink-0 items-center gap-2">
          {visibleSteps.map((item, index) => {
            const active = step === item.id;
            const done = step > item.id;
            return (
              <div key={item.id} className="flex flex-1 items-center gap-2">
                <div
                  className={`wizard-step-indicator flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    active ? "wizard-step-indicator-active" : ""
                  } ${
                    active || done
                      ? dark
                        ? "bg-[#7c4dff] text-white"
                        : "bg-indigo-600 text-white"
                      : dark
                        ? "bg-[#1a1b26] text-[#9e9e9e]"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {item.id}
                </div>
                <div className="min-w-0">
                  <p className={`truncate text-xs font-semibold ${active ? (dark ? "text-[#7c4dff]" : "text-indigo-700") : dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                    Step {item.id}
                  </p>
                  <p className={`truncate text-sm font-medium ${active ? (dark ? "text-white" : "text-slate-900") : dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                    {item.title}
                  </p>
                </div>
                {index < visibleSteps.length - 1 ? (
                  <div className={`mx-1 hidden h-px flex-1 sm:block ${dark ? "bg-white/[0.06]" : "bg-slate-200"}`} />
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {displayError ? (
        <div
          className={`shrink-0 rounded-xl border px-4 py-3 text-sm ${
            dark ? "border-[#e91e63]/30 bg-[#e91e63]/10 text-[#e91e63]" : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
          role="alert"
        >
          {displayError}
        </div>
      ) : null}

      <div key={`student-step-${step}`} className={`min-h-0 flex-1 overflow-hidden ${stepPanelClass}`}>
        {step === 1 ? (
          <div className="scrollbar-app h-full space-y-4 overflow-y-auto pr-1">
            <h4 className={`text-base font-semibold ${dark ? "text-white" : "text-slate-900"}`}>Personal Info</h4>
            <div className={`flex items-center gap-4 border-b pb-4 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
              <StudentAvatarPreview form={form} dark={dark} />
              <div>
                <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Profile picture</p>
                <label className={`mt-1 inline-block cursor-pointer text-xs font-medium hover:underline ${dark ? "text-[#7c4dff]" : "text-indigo-600"}`}>
                  Upload photo
                  <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={isAdmissionIdentifier ? "Admission Number" : "Student ID"} dark={dark}>
                <input
                  className={inputClass(dark, dark ? "text-[#9e9e9e]" : "bg-slate-50 text-slate-500")}
                  value={form.registrationNo}
                  readOnly
                  placeholder={
                    isAdmissionIdentifier ? "Auto-generated admission number" : "Auto after class & section"
                  }
                />
              </Field>
              <Field label="Full Name" required dark={dark}>
                <input
                  className={inputClass(dark)}
                  value={form.fullName}
                  onChange={(e) => update({ fullName: e.target.value })}
                  placeholder="Enter full name"
                />
              </Field>
              <Field label="CNIC / B-Form" required dark={dark}>
                <input
                  className={inputClass(dark)}
                  value={form.cnicBForm}
                  onChange={(e) => update({ cnicBForm: formatCnicInput(e.target.value) })}
                  placeholder="XXXXX-XXXXXXX-X"
                  inputMode="numeric"
                  autoComplete="off"
                />
              </Field>
              <Field label="Phone Number" required dark={dark}>
                <input
                  className={inputClass(dark)}
                  value={form.phoneNumber}
                  onChange={(e) => update({ phoneNumber: formatPhoneInput(e.target.value) })}
                  placeholder="03XX-XXXXXXX"
                  inputMode="numeric"
                  autoComplete="tel"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Address" required dark={dark}>
                  <input
                    className={inputClass(dark)}
                    value={form.address}
                    onChange={(e) => update({ address: e.target.value })}
                    placeholder="Residential address"
                  />
                </Field>
              </div>
              <Field label="Gender" required dark={dark}>
                <select className={inputClass(dark)} value={form.gender} onChange={(e) => update({ gender: e.target.value })}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </Field>
              <Field label="Date of Birth" required dark={dark}>
                <ModernDatePicker
                  value={form.dateOfBirth}
                  max={today}
                  dark={dark}
                  flow="day-month-year"
                  onChange={(value) => update({ dateOfBirth: value })}
                />
              </Field>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="scrollbar-app h-full space-y-4 overflow-y-auto pr-1">
            <h4 className={`text-base font-semibold ${dark ? "text-white" : "text-slate-900"}`}>Guardians Details</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Father Name" required dark={dark}>
                <input
                  className={inputClass(dark)}
                  value={form.fatherName}
                  onChange={(e) => update({ fatherName: e.target.value })}
                  placeholder="Enter father name"
                />
              </Field>
              <Field label="CNIC" required dark={dark}>
                <input
                  className={inputClass(dark)}
                  value={form.fatherCnic}
                  onChange={(e) => update({ fatherCnic: formatCnicInput(e.target.value) })}
                  placeholder="XXXXX-XXXXXXX-X"
                  inputMode="numeric"
                  autoComplete="off"
                />
              </Field>
              <Field label="Call Number" required dark={dark}>
                <input
                  className={inputClass(dark)}
                  value={form.guardianPhone}
                  onChange={(e) => update({ guardianPhone: formatPhoneInput(e.target.value) })}
                  placeholder="03XX-XXXXXXX"
                  inputMode="numeric"
                  autoComplete="tel"
                />
              </Field>
              <Field label="WhatsApp Number" dark={dark}>
                <input
                  className={inputClass(dark)}
                  value={form.alternativePhone}
                  onChange={(e) => update({ alternativePhone: formatPhoneInput(e.target.value) })}
                  placeholder="Optional — 03XX-XXXXXXX"
                  inputMode="numeric"
                  autoComplete="tel"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Father Occupation" required dark={dark}>
                  <input
                    className={inputClass(dark)}
                    value={form.fatherOccupation}
                    onChange={(e) => update({ fatherOccupation: e.target.value })}
                    placeholder="e.g. Business, Teacher, Government Job"
                  />
                </Field>
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
            <h4 className={`shrink-0 text-base font-semibold ${dark ? "text-white" : "text-slate-900"}`}>Students Previous Data</h4>

            <div className={`${cardClass} flex min-h-0 flex-1 flex-col overflow-hidden`}>
              <p className={`mb-3 shrink-0 text-sm font-semibold ${dark ? "text-white" : "text-slate-800"}`}>
                Past class results & documents
              </p>

              <div className="scrollbar-app min-h-0 max-h-[min(320px,calc(90vh-22rem))] flex-1 space-y-4 overflow-y-auto pr-1">
                {(form.previousResults || []).map((row) => (
                  <div
                    key={row.id}
                    className={`space-y-3 rounded-xl border p-4 ${
                      dark ? "border-white/[0.06] bg-[#161722]/80" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-800"}`}>
                        {row.previousClass ? `Result from ${row.previousClass}` : "Previous class result"}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => removePreviousRow(row.id)}
                          disabled={(form.previousResults || []).length <= 1}
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                            dark
                              ? "border-[#e91e63]/30 bg-[#e91e63]/10 text-[#e91e63] hover:bg-[#e91e63]/15"
                              : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                          }`}
                          aria-label="Remove row"
                        >
                          <IconMinus />
                        </button>
                        <button
                          type="button"
                          onClick={addPreviousRow}
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold ${
                            dark
                              ? "border-[#7c4dff]/30 bg-[#7c4dff]/10 text-[#7c4dff] hover:bg-[#7c4dff]/15"
                              : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          }`}
                          aria-label="Add row"
                        >
                          <IconPlus />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <ScrollableSelect
                        label="Previous Class"
                        placeholder="Select previous class"
                        value={row.previousClass}
                        options={previousClassOptions}
                        onChange={(value) => updatePreviousRow(row.id, { previousClass: value, documentUrl: value ? row.documentUrl : "" })}
                        required
                        openUpward
                        portal
                        menuMaxHeight={320}
                        dark={dark}
                      />
                      <ScrollableSelect
                        label="Percentage"
                        placeholder="Select percentage"
                        value={resolvePreviousRowPercentage(row)}
                        options={percentageOptions}
                        onChange={(value) =>
                          updatePreviousRow(row.id, {
                            percentage: value,
                            resultGrade: gradeFromPercentage(value),
                          })
                        }
                        required
                        openUpward
                        portal
                        menuMaxHeight={320}
                        dark={dark}
                      />
                    </div>

                    {row.previousClass ? (
                      <div className={innerCardClass}>
                        <p className={`mb-2 text-sm font-semibold ${dark ? "text-white" : "text-slate-800"}`}>
                          Document for {row.previousClass}
                        </p>
                        <label className={`inline-flex cursor-pointer items-center gap-2 text-xs font-medium hover:underline ${dark ? "text-[#7c4dff]" : "text-indigo-600"}`}>
                          Upload document
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => onPreviousDocumentChange(row.id, e)}
                          />
                        </label>
                        {row.documentUrl ? (
                          <p className={`mt-2 text-xs ${dark ? "text-[#4caf50]" : "text-emerald-600"}`}>Document attached</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2">
              <div className={innerCardClass}>
                <p className={`mb-2 text-sm font-semibold ${dark ? "text-white" : "text-slate-800"}`}>School Leaving Certificate</p>
                <label className={`inline-flex cursor-pointer items-center gap-2 text-xs font-medium hover:underline ${dark ? "text-[#7c4dff]" : "text-indigo-600"}`}>
                  Upload document
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => onCertificateChange("schoolLeavingCertificate", e)}
                  />
                </label>
                {form.schoolLeavingCertificate ? (
                  <p className={`mt-2 text-xs ${dark ? "text-[#4caf50]" : "text-emerald-600"}`}>Certificate attached</p>
                ) : null}
              </div>
              <div className={innerCardClass}>
                <p className={`mb-2 text-sm font-semibold ${dark ? "text-white" : "text-slate-800"}`}>Character Certificate</p>
                <label className={`inline-flex cursor-pointer items-center gap-2 text-xs font-medium hover:underline ${dark ? "text-[#7c4dff]" : "text-indigo-600"}`}>
                  Upload document
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => onCertificateChange("characterCertificate", e)}
                  />
                </label>
                {form.characterCertificate ? (
                  <p className={`mt-2 text-xs ${dark ? "text-[#4caf50]" : "text-emerald-600"}`}>Certificate attached</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="scrollbar-app h-full space-y-4 overflow-y-auto pr-1">
            <h4 className={`text-base font-semibold ${dark ? "text-white" : "text-slate-900"}`}>Class, Section, Subjects</h4>
            <div className={assignCardClass}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <ScrollableSelect
                  label="Class"
                  placeholder="Select class"
                  value={form.className}
                  options={classOptions}
                  onChange={(value) => update({ className: value })}
                  required
                  openUpward
                  portal
                  menuMaxHeight={320}
                  dark={dark}
                />
                <ScrollableSelect
                  label="Section"
                  placeholder="Select section"
                  value={form.section}
                  options={sectionOptions}
                  onChange={(value) => update({ section: value })}
                  required
                  openUpward
                  portal
                  menuMaxHeight={320}
                  dark={dark}
                />
                <Field label="Roll No#" dark={dark}>
                  <input
                    className={inputClass(dark, dark ? "text-[#9e9e9e]" : "bg-slate-50 text-slate-600")}
                    value={loadingRoll ? "Generating..." : form.rollNumber}
                    readOnly
                  />
                </Field>
              </div>
              <div className="mt-4">
                <SubjectManager
                  label="Subjects"
                  placeholder="Select subjects"
                  subjects={form.subjectPool || [...SUBJECT_OPTIONS]}
                  selected={form.subjects || []}
                  onSubjectsChange={(subjects) => update({ subjectPool: subjects })}
                  onSelectedChange={(subjects) => update({ subjects })}
                  menuMaxHeight={320}
                  dark={dark}
                />
              </div>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="scrollbar-app h-full space-y-4 overflow-y-auto pr-1">
            <div className="space-y-1">
              <h4 className={`text-base font-semibold ${dark ? "text-white" : "text-slate-900"}`}>Step 5 Fee Management</h4>
              <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Fee Details</p>
            </div>
            <div className={assignCardClass}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Admission Fee (Rs.)" required dark={dark}>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className={inputClass(dark)}
                    value={form.admissionFee}
                    onChange={(e) => update({ admissionFee: e.target.value })}
                    placeholder="Enter admission fee"
                  />
                </Field>
                <Field label="Annual Fee (Rs.)" required dark={dark}>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className={inputClass(dark)}
                    value={form.annualFee}
                    onChange={(e) => update({ annualFee: e.target.value })}
                    placeholder="Enter annual fee"
                  />
                </Field>
              </div>

              <label
                className={`mt-4 flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${
                  dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(form.useInstallments)}
                  onChange={(e) =>
                    update({
                      useInstallments: e.target.checked,
                      installmentCount: e.target.checked ? form.installmentCount || "1" : form.installmentCount,
                    })
                  }
                  className={`h-4 w-4 rounded ${dark ? "border-white/20 bg-[#1a1b26] text-[#7c4dff]" : "border-slate-300 text-indigo-600"}`}
                />
                <span className={`text-sm font-medium ${dark ? "text-white" : "text-slate-800"}`}>
                  Pay annual fee in installments
                </span>
              </label>

              {form.useInstallments ? (
                <div className={`mt-4 space-y-4 rounded-xl border p-4 ${dark ? "border-white/[0.06] bg-[#161722]/80" : "border-indigo-100 bg-white"}`}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ScrollableSelect
                      label="Number of Months"
                      placeholder="Select months"
                      value={form.installmentCount}
                      options={installmentOptions}
                      onChange={(value) => update({ installmentCount: value })}
                      required
                      openUpward
                      portal
                      menuMaxHeight={280}
                      dark={dark}
                    />
                    <Field label="Monthly Fee (calculated)" dark={dark}>
                      <input
                        className={inputClass(dark, dark ? "text-[#4caf50]" : "bg-slate-50 font-semibold text-emerald-700")}
                        value={formatCurrency(calculatedMonthlyFee)}
                        readOnly
                      />
                    </Field>
                  </div>
                  <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                    {Number(form.annualFee || 0) > 0 && form.installmentCount ? (
                      <>
                        Annual fee of {formatCurrency(form.annualFee)} divided into {form.installmentCount} month
                        {Number(form.installmentCount) > 1 ? "s" : ""} = {formatCurrency(calculatedMonthlyFee)} per month.
                      </>
                    ) : (
                      "Enter annual fee and select months to calculate monthly fee."
                    )}
                  </p>
                </div>
              ) : (
                <p className={`mt-3 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                  Without installments, the full annual fee will be recorded as a single annual payment.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div
        className={`flex shrink-0 flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between ${
          dark ? "border-white/[0.06]" : "border-slate-100"
        }`}
      >
        <button
          type="button"
          onClick={onCancel}
          className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${
            dark
              ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e] hover:bg-white/[0.04] hover:text-white"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Cancel
        </button>
        <div className="flex gap-2">
          {!assignmentEditMode && step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${
                dark
                  ? "border-white/[0.06] bg-[#1a1b26] text-white hover:bg-white/[0.04]"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Back
            </button>
          ) : null}
          {!assignmentEditMode && step < 5 ? (
            <button
              type="button"
              onClick={goNext}
              className={`rounded-xl px-6 py-2.5 text-sm font-medium text-white ${
                dark ? "bg-[#7c4dff] hover:bg-[#6a3df0]" : "ref-btn-primary"
              }`}
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={saving}
              className={`rounded-xl px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60 ${
                dark ? "bg-[#7c4dff] hover:bg-[#6a3df0]" : "ref-btn-primary"
              }`}
            >
              {submitLabel}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
