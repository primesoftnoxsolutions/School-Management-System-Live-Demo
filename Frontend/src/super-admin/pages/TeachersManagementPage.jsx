import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import api from "../services/api/client";
import FormModal from "../components/ui/FormModal";
import CreateTeacherWizard, {
  assignedClassesToFormState,
  buildAssignmentsFromSelection,
  initialCreateTeacherForm,
  isNoAssignClass,
} from "../components/teachers/CreateTeacherWizard";
import TeacherRemoveModal from "../components/teachers/TeacherRemoveModal";
import TeacherAssignmentHistoryModal from "../components/teachers/TeacherAssignmentHistoryModal";
import TeacherDocumentsModal from "../components/teachers/TeacherDocumentsModal";
import TeacherLoginDetailsModal from "../components/teachers/TeacherLoginDetailsModal";
import TablePagination from "../components/ui/TablePagination";
import { withTeacherBranchParams } from "../utils/branch";
import { notifyTeacherAssignmentsUpdated } from "../../utils/teacherAssignmentsSync";

const TEACHER_IMPORT_HEADERS = [
  "Teacher Name",
  "Created Date",
  "Joining Date",
  "Qualification",
  "Designation",
  "Assign Classes/Section",
  "Branch",
  "Cnic",
  "Phone Number",
  "Salary",
  "Address",
  "Status",
  "Email ID",
  "Password",
];

function IconUsers() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m8-4a4 4 0 11-8 0 4 4 0 018 0zm-4 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
    </svg>
  );
}

function IconHistory() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3M3.05 11a9 9 0 1 0 .5-3.5M3 4v4h4" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3v10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 9l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 15.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconClassSection() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6.5h16M4 12h16M4 17.5h10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 4v15" />
    </svg>
  );
}

function IconTeacherProfile() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 10-16 0" />
      <circle cx="12" cy="8" r="3.5" />
    </svg>
  );
}

function IconUploadDocuments() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-6M9.5 14.5 12 12l2.5 2.5" />
    </svg>
  );
}

function IconKey() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.5 7.5a4 4 0 11-5.6 5.6L4 19v-3H1v-3l5.9-5.9a4 4 0 018.6.4z"
      />
      <circle cx="15" cy="9" r="1.5" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3.5h7l5 5V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3.5V9h5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6M9 16h6" />
    </svg>
  );
}

function IconUserPlus() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM19 8v6M22 11h-6" />
    </svg>
  );
}

function IconUserMinus() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 11h-6" />
    </svg>
  );
}

function IconUploadArrow({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 9.5L12 5l4.5 4.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5Z" />
    </svg>
  );
}

function IconSpreadsheet({ className = "h-12 w-12" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11h8M8 15h8" />
    </svg>
  );
}

function IconCloudUpload({ className = "h-16 w-16" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 18a4.5 4.5 0 1 1 0-9 5.5 5.5 0 0 1 10.55 1.68A3.75 3.75 0 1 1 18.5 18H7.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V8.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 11.5 12 9l2.5 2.5" />
    </svg>
  );
}

function IconImportAction({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 7.5 12 4l3.5 3.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 20h14a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1Z" />
    </svg>
  );
}

function ImportIllustration() {
  return (
    <svg viewBox="0 0 360 380" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="imp-grad-base" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#F2ECFF" />
          <stop offset="100%" stopColor="#DCD2FF" />
        </linearGradient>
        <linearGradient id="imp-grad-card" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F6F3FF" />
        </linearGradient>
        <linearGradient id="imp-grad-purple" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#7C4DFF" />
          <stop offset="100%" stopColor="#5B35E5" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="360" height="380" rx="24" fill="url(#imp-grad-base)" opacity="0.45" />
      <path d="M60 124c40 0 64 36 64 72" fill="none" stroke="#C9C1FF" strokeDasharray="5 8" strokeWidth="2" />
      <circle cx="78" cy="142" r="9" fill="none" stroke="#B9B0FF" strokeWidth="2" />
      <circle cx="238" cy="120" r="6" fill="#B3A7FF" opacity="0.7" />
      <circle cx="214" cy="170" r="5" fill="#B7A9FF" opacity="0.65" />
      <circle cx="260" cy="250" r="7" fill="#B7A9FF" opacity="0.6" />
      <circle cx="88" cy="238" r="5" fill="#B8ABFF" opacity="0.7" />
      <path d="M42 282h44l-18 28H24z" fill="#8E5CFF" opacity="0.25" />
      <path d="M48 278h44l-16 24H30z" fill="#7C4DFF" opacity="0.5" />
      <rect x="106" y="236" width="150" height="118" rx="16" fill="url(#imp-grad-card)" stroke="#E4DDFF" />
      <g transform="translate(121 257)">
        <rect x="0" y="0" width="44" height="44" rx="6" fill="#1F8B4C" />
        <rect x="9" y="11" width="8" height="22" rx="2" fill="#FFFFFF" opacity="0.95" />
        <path d="M12 11h11v4h-11z" fill="#FFFFFF" opacity="0.95" />
        <path d="M21 11h7v22h-7z" fill="#FFFFFF" opacity="0.85" />
        <path d="M21 18h7" stroke="#1F8B4C" strokeWidth="1.5" />
        <path d="M21 24h7" stroke="#1F8B4C" strokeWidth="1.5" />
      </g>
      <rect x="175" y="260" width="61" height="8" rx="4" fill="#E3E5F0" />
      <rect x="175" y="275" width="53" height="8" rx="4" fill="#E3E5F0" />
      <rect x="175" y="290" width="44" height="8" rx="4" fill="#E3E5F0" />
      <path d="M126 314h104" stroke="#D5D8E9" strokeWidth="6" strokeLinecap="round" />
      <path d="M126 329h78" stroke="#E3E5F0" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="184" cy="350" rx="118" ry="16" fill="#8A63FF" opacity="0.18" />
      <ellipse cx="184" cy="344" rx="96" ry="12" fill="#7C4DFF" opacity="0.3" />
      <ellipse cx="184" cy="338" rx="76" ry="10" fill="#6A3DF0" opacity="0.45" />
      <circle cx="272" cy="226" r="16" fill="#6A3DF0" opacity="0.85" />
      <path d="M278 216l11 4-3 11-12-3z" fill="#FFB26B" opacity="0.95" />
      <rect x="150" y="42" width="44" height="44" rx="22" fill="#E2D9FF" />
      <path d="M160 60h10v12h-10z" fill="none" stroke="#5C43E6" strokeWidth="2.2" />
      <path d="M170 50v12h12" fill="none" stroke="#5C43E6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M172 64v14" fill="none" stroke="#5C43E6" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M166 58l6-6 6 6" fill="none" stroke="#5C43E6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TeacherIllustration() {
  return (
    <svg viewBox="0 0 200 180" className="h-36 w-44 shrink-0" aria-hidden="true">
      <ellipse cx="100" cy="165" rx="70" ry="10" fill="#E0E7FF" />
      <rect x="55" y="95" width="90" height="70" rx="12" fill="#4F46E5" />
      <rect x="70" y="110" width="60" height="45" rx="6" fill="#EEF2FF" />
      <circle cx="100" cy="58" r="28" fill="#FCD9BD" />
      <path d="M72 58c0-18 12-28 28-28s28 10 28 28" fill="#312E81" />
      <rect x="118" y="108" width="28" height="36" rx="4" fill="#F8FAFC" stroke="#C7D2FE" />
      <line x1="124" y1="118" x2="140" y2="118" stroke="#94A3B8" strokeWidth="2" />
      <line x1="124" y1="126" x2="140" y2="126" stroke="#94A3B8" strokeWidth="2" />
      <line x1="124" y1="134" x2="136" y2="134" stroke="#94A3B8" strokeWidth="2" />
    </svg>
  );
}

function TeacherAvatar({ name }) {
  const parts = (name || "").trim().split(/\s+/);
  const initials = `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase() || "?";
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-sm font-bold text-indigo-700 ring-2 ring-white">
      {initials}
    </div>
  );
}

function StatusPill({ active, dark = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? dark
            ? "bg-[#4caf50]/15 text-[#4caf50]"
            : "bg-emerald-50 text-emerald-700"
          : dark
            ? "bg-white/[0.06] text-[#9e9e9e]"
            : "bg-slate-100 text-slate-600"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : dark ? "bg-[#9e9e9e]" : "bg-slate-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function TeacherProfileField({ label, value, dark = false, className = "" }) {
  const displayValue = value === undefined || value === null || value === "" ? "-" : value;

  return (
    <div className={className}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{label}</p>
      <p className={`mt-1 text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{displayValue}</p>
    </div>
  );
}

function getTeacherAssignmentSummary(assignedClasses = []) {
  const classNames = new Set();
  const sections = new Set();

  assignedClasses.forEach((item) => {
    if (item.className) classNames.add(item.className);
    if (item.section) sections.add(item.section);
  });

  return {
    classes: classNames.size,
    sections: sections.size,
  };
}

function TeacherProfileModal({ teacher, dark = false, onClose, onSave }) {
  const safeTeacher = teacher || {};
  const assignedClasses = safeTeacher.assignedClasses || [];
  const profile = safeTeacher.profile || {};
  const fullName = safeTeacher.fullName || "Teacher Profile";
  const summary = getTeacherAssignmentSummary(assignedClasses);
  const createdDate = safeTeacher.createdAt
    ? new Date(safeTeacher.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";
  const readOnly = Boolean(safeTeacher.isDeleted);
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber || "");
  const [salary, setSalary] = useState(profile.salary != null ? String(profile.salary) : "");
  const [address, setAddress] = useState(profile.address || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setPhoneNumber(profile.phoneNumber || "");
    setSalary(profile.salary != null ? String(profile.salary) : "");
    setAddress(profile.address || "");
    setSaveError("");
    setSavingProfile(false);
  }, [profile.address, profile.phoneNumber, profile.salary, safeTeacher._id]);

  const handleSave = async () => {
    if (readOnly) return;
    setSavingProfile(true);
    setSaveError("");
    try {
      await onSave?.(safeTeacher._id, {
        phoneNumber: phoneNumber.trim(),
        salary: salary.trim(),
        address: address.trim(),
      });
      onClose?.();
    } catch (err) {
      setSaveError(err?.response?.data?.message || err?.message || "Failed to update teacher profile");
    } finally {
      setSavingProfile(false);
    }
  };

  if (!teacher) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center overflow-y-auto bg-slate-900/40 px-4 py-8 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`modal-panel-enter w-full max-w-lg overflow-hidden rounded-2xl border ${
          dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          className={`border-b px-6 py-5 ${
            dark ? "border-white/[0.06] bg-[#1a1b26]" : "border-slate-100 bg-gradient-to-r from-slate-50 to-white"
          }`}
        >
          <div className="flex items-center gap-4">
            <TeacherAvatar name={safeTeacher.fullName} />
            <div className="min-w-0">
              <h3 className={`text-lg font-bold ${dark ? "text-white" : "text-slate-900"}`}>{fullName}</h3>
              <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{safeTeacher.email || "-"}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusPill active={safeTeacher.isActive} dark={dark} />
                {readOnly ? (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${dark ? "bg-[#e91e63]/15 text-[#e91e63]" : "bg-rose-50 text-rose-700"}`}>
                    Removed
                  </span>
                ) : null}
                {createdDate ? <span className={`text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Created {createdDate}</span> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5 text-sm">
          <div className={`grid grid-cols-1 gap-3 border-b pb-4 sm:grid-cols-2 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
            <TeacherProfileField label="Assigned Classes" value={summary.classes} dark={dark} />
            <TeacherProfileField label="Assigned Sections" value={summary.sections} dark={dark} />
          </div>

          <div className="grid grid-cols-1 gap-x-3 gap-y-5 sm:grid-cols-2">
            <TeacherProfileField label="CNIC" value={profile.cnic} dark={dark} />
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Phone Number</p>
              {readOnly ? (
                <p className={`mt-1 text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{phoneNumber || "-"}</p>
              ) : (
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={`mt-1 w-full border-0 bg-transparent p-0 text-sm font-semibold outline-none shadow-none ${
                    dark ? "text-white placeholder:text-[#7f8197]" : "text-slate-900 placeholder:text-slate-400"
                  }`}
                />
              )}
            </div>
            <TeacherProfileField label="Qualification" value={profile.qualification} dark={dark} />
            <TeacherProfileField label="Designation" value={profile.designation} dark={dark} />
            <TeacherProfileField
              label="Joining Date"
              value={
                profile.joiningDate
                  ? new Date(profile.joiningDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : createdDate
              }
              dark={dark}
            />
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Salary</p>
              {readOnly ? (
                <p className={`mt-1 text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{salary || "-"}</p>
              ) : (
                <input
                  type="text"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className={`mt-1 w-full border-0 bg-transparent p-0 text-sm font-semibold outline-none shadow-none ${
                    dark ? "text-white placeholder:text-[#7f8197]" : "text-slate-900 placeholder:text-slate-400"
                  }`}
                />
              )}
            </div>
            <div className="sm:col-span-2">
              <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Address</p>
              {readOnly ? (
                <p className={`mt-1 text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{address || "-"}</p>
              ) : (
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`mt-1 w-full resize-none border-0 bg-transparent p-0 text-sm font-semibold outline-none shadow-none ${
                    dark ? "text-white placeholder:text-[#7f8197]" : "text-slate-900 placeholder:text-slate-400"
                  }`}
                />
              )}
            </div>
          </div>
          {saveError ? (
            <div className={`rounded-xl border px-4 py-3 text-sm ${dark ? "border-[#e91e63]/30 bg-[#e91e63]/10 text-[#e91e63]" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
              {saveError}
            </div>
          ) : null}
        </div>

        <div className={`flex justify-end border-t px-6 py-4 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
          {!readOnly ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={savingProfile}
              className={`rounded-xl px-5 py-2.5 text-sm font-medium text-white ${
                dark ? "bg-[#7c4dff] hover:bg-[#6a3df0]" : "ref-btn-primary"
              }`}
            >
              {savingProfile ? "Saving..." : "Save"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className={`${readOnly ? "" : "ml-2 "}rounded-xl border px-5 py-2.5 text-sm font-medium ${
              dark
                ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e] hover:bg-white/[0.04] hover:text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Close
          </button>
        </div>
      </div>
      </div>,
    document.body
  );
}

function TeacherImportModal({ open, dark = false, onClose, onImport, importing = false }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadNotice, setUploadNotice] = useState("");
  const [uploadTone, setUploadTone] = useState("neutral");
  const [skippedTeachers, setSkippedTeachers] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setDragActive(false);
      setUploadNotice("");
      setUploadTone("neutral");
      setSkippedTeachers([]);
    }
  }, [open]);

  if (!open) return null;

  const pickFile = () => fileInputRef.current?.click();

  const importSelectedFile = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setUploadNotice("Importing file...");
    setUploadTone("neutral");
    setSkippedTeachers([]);
    try {
      const result = await onImport(file);
      const importedCount = Number(result?.importedCount || 0);
      const skipped = Array.isArray(result?.skipped) ? result.skipped : [];
      const failed = Array.isArray(result?.failed) ? result.failed : [];
      setSkippedTeachers(skipped);

      if (!importedCount && skipped.length && !failed.length) {
        setUploadNotice("No new teachers were added. All matched teachers already exist with same details.");
        setUploadTone("error");
        return;
      }

      if (importedCount && skipped.length) {
        setUploadNotice(
          `${importedCount} teacher${importedCount === 1 ? "" : "s"} imported successfully. ${skipped.length} already exist with same details and were skipped.`
        );
        setUploadTone("success");
        onClose();
        return;
      }

      if (importedCount && failed.length) {
        setUploadNotice(
          `${importedCount} teacher${importedCount === 1 ? "" : "s"} imported. ${failed.length} row${failed.length === 1 ? "" : "s"} failed.`
        );
        setUploadTone("success");
        onClose();
        return;
      }

      if (failed.length && !importedCount) {
        setUploadNotice(failed[0]?.message || "Failed to import teachers.");
        setUploadTone("error");
        return;
      }

      setUploadNotice(
        importedCount === 1 ? "Teacher imported successfully." : `${importedCount} teachers imported successfully.`
      );
      setUploadTone("success");
      if (importedCount > 0) onClose();
    } catch (error) {
      setSkippedTeachers([]);
      setUploadNotice(error?.message || "Failed to import file.");
      setUploadTone("error");
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) await importSelectedFile(file);
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[130] flex items-center justify-center overflow-y-auto px-4 py-8 backdrop-blur-[2px] ${
        dark ? "bg-slate-950/70" : "bg-slate-900/50"
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !importing) onClose();
      }}
    >
      <div
        className={`modal-panel-enter w-full max-w-[1040px] overflow-hidden rounded-[28px] border ${
          dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="grid min-h-[700px] grid-cols-1 lg:grid-cols-[310px_minmax(0,1fr)]">
          <div
            className={`relative overflow-hidden px-8 py-10 ${
              dark
                ? "bg-[linear-gradient(180deg,#151427_0%,#1c1734_56%,#241b43_100%)]"
                : "bg-[linear-gradient(180deg,#f7f3ff_0%,#f3efff_56%,#ece4ff_100%)]"
            }`}
          >
            <div className="relative z-10 flex h-full flex-col">
              <div className="max-w-[270px]">
                <h3 className={`text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] ${dark ? "text-white" : "text-slate-900"}`}>
                  Import Teachers
                  <br />
                  from <span className={dark ? "text-[#8b78ff]" : "text-[#5b46e5]"}>Excel</span>
                </h3>
                <div className="mt-3 h-1 w-10 rounded-full bg-[#7c4dff]" />
                <p className={`mt-4 text-[16px] leading-7 ${dark ? "text-[#c9c4f0]" : "text-slate-600"}`}>
                  Upload your Excel file to quickly add or update teacher records.
                </p>
              </div>

              <div className="mt-auto pt-8">
                <div className="relative mx-auto h-[260px] w-[240px]">
                  <ImportIllustration />
                </div>
              </div>
            </div>
          </div>

          <div className={`relative flex min-h-0 flex-col ${dark ? "bg-[#161722]" : "bg-white"}`}>
            <button
              type="button"
              onClick={onClose}
              disabled={importing}
              className={`absolute right-8 top-7 rounded-full p-1.5 transition disabled:opacity-50 ${
                dark
                  ? "text-[#9e9e9e] hover:bg-white/[0.04] hover:text-white"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              }`}
              aria-label="Close import modal"
            >
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className={`flex min-h-0 flex-1 flex-col px-7 pb-5 pt-14 ${dark ? "bg-[#161722]" : "bg-white"}`}>
              <div
                role="button"
                tabIndex={0}
                onClick={pickFile}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    pickFile();
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`flex min-h-[360px] w-full cursor-pointer flex-col items-center justify-center rounded-[30px] border-2 border-dashed px-7 text-center transition ${
                  dragActive
                    ? "border-[#8b78ff] bg-[#f6f2ff]"
                    : dark
                      ? "border-[#4f4688] bg-[#1a1b26] hover:bg-[#1d1e2b]"
                      : "border-[#c8beff] bg-white hover:bg-[#fcfbff]"
                }`}
              >
                <div className={`flex h-24 w-24 items-center justify-center rounded-full ${dark ? "bg-[#2a2447] text-[#8b78ff]" : "bg-[#e7e1ff] text-[#5b46e5]"}`}>
                  <IconCloudUpload className="h-12 w-12" />
                </div>
                <p className={`mt-8 text-[22px] font-semibold leading-tight ${dark ? "text-white" : "text-slate-900"}`}>
                  Drag & drop your Excel file here
                </p>
                <p className={`mt-3 text-[18px] leading-none ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>or</p>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    pickFile();
                  }}
                  className="mt-4 inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#6c58ef] to-[#5b35e5] px-12 py-3.5 text-[18px] font-semibold text-white shadow-[0_10px_24px_rgba(91,53,229,0.22)]"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/40">
                    <IconImportAction className="h-4 w-4" />
                  </span>
                  Browse File
                </button>
                <p className={`mt-3 text-[16px] ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Supports .xlsx, .xls, .csv files</p>
                {selectedFile ? (
                  <div
                    className={`mt-5 inline-flex max-w-full items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-sm ${
                      dark ? "border-white/[0.08] bg-[#1a1b26] text-white" : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <IconImportAction className="h-4 w-4" />
                    <span className="max-w-[360px] truncate">{selectedFile.name}</span>
                  </div>
                ) : null}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0] || null;
                    if (nextFile) {
                      importSelectedFile(nextFile);
                    }
                    event.target.value = "";
                  }}
                />
              </div>

              <div
                className={`mt-5 rounded-[24px] px-6 py-5 shadow-[0_0_0_1px_rgba(91,70,229,0.08)] ${
                  dark ? "bg-[#1a1b26] shadow-[0_0_0_1px_rgba(139,120,255,0.12)]" : "bg-[#f6f3ff]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${dark ? "bg-[#2a2447] text-[#8b78ff]" : "bg-[#e8e2ff] text-[#5b46e5]"}`}>
                    <span className="text-2xl font-semibold">i</span>
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[18px] font-semibold leading-tight ${dark ? "text-white" : "text-slate-900"}`}>Required details:</p>
                    <p className={`mt-2 text-[16px] leading-[1.6] ${dark ? "text-[#d7d2f3]" : "text-slate-800"}`}>
                      {TEACHER_IMPORT_HEADERS.join(", ")}.
                    </p>
                    <p className={`mt-3 text-[15px] leading-[1.55] ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                      First row should contain these exact headers, and each next row should contain teacher data.
                    </p>
                    {uploadNotice ? (
                      <p
                        className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          uploadTone === "success"
                            ? "bg-emerald-50 text-emerald-700"
                            : uploadTone === "error"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-white text-slate-500"
                        }`}
                      >
                        {uploadNotice}
                      </p>
                    ) : null}
                    {skippedTeachers.length ? (
                      <div
                        className={`mt-3 max-h-36 space-y-1.5 overflow-y-auto rounded-xl border px-3 py-2 text-left text-xs ${
                          dark ? "border-[#e91e63]/30 bg-[#e91e63]/10 text-[#ff8fb0]" : "border-rose-200 bg-rose-50 text-rose-700"
                        }`}
                      >
                        {skippedTeachers.map((item, index) => (
                          <p key={`${item.name}-${index}`}>
                            {item.name || "Teacher"} already exists with same details, so this teacher was not added.
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className={`mt-6 flex items-center justify-end gap-3 border-t pt-5 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={importing}
                  className={`rounded-xl border px-5 py-2.5 text-sm font-medium ${
                    dark
                      ? "border-white/[0.08] bg-[#1a1b26] text-[#9e9e9e] hover:bg-white/[0.04] hover:text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedFile) {
                      onClose();
                      return;
                    }
                    pickFile();
                  }}
                  disabled={importing}
                  className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#6c58ef] to-[#5b35e5] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(91,53,229,0.22)] disabled:opacity-60"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/40">
                    <IconImportAction className="h-4 w-4" />
                  </span>
                  Import Teachers
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ActivityStatusBadge({ status }) {
  const success = status === "SUCCESS";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        success ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      {success ? "✓" : "!"}
      {status}
    </span>
  );
}

export default function TeachersManagementPage({ dark = false, onToggleTheme, branchSection = "", onAssignmentsUpdated }) {
  const [createForm, setCreateForm] = useState({ ...initialCreateTeacherForm });
  const [assignTeacherId, setAssignTeacherId] = useState(null);
  const [teacherModalMode, setTeacherModalMode] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0, limit: 10 });
  const [createModalTeacherName, setCreateModalTeacherName] = useState("");
  const [createWizardKey, setCreateWizardKey] = useState(0);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showTeacherProfileModal, setShowTeacherProfileModal] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [showTeacherDocumentsModal, setShowTeacherDocumentsModal] = useState(false);
  const [teacherDocumentsTeacher, setTeacherDocumentsTeacher] = useState(null);
  const [showLoginDetailsModal, setShowLoginDetailsModal] = useState(false);
  const [loginDetailsTeacher, setLoginDetailsTeacher] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [historyExportApi, setHistoryExportApi] = useState(null);
  const [historyExportOpen, setHistoryExportOpen] = useState(false);
  const [historyExporting, setHistoryExporting] = useState(false);
  const [assignEditPanel, setAssignEditPanel] = useState("classes");
  const [assignTeacher, setAssignTeacher] = useState(null);

  const loadData = async (nextPage = page, nextSearch = search) => {
    setLoading(true);
    setError("");
    try {
      const teachersRes = await api.get("/teachers", {
        params: withTeacherBranchParams(
          { search: nextSearch, page: nextPage, limit: pagination.limit },
          branchSection
        ),
      });
      const data = teachersRes.data?.data || {};
      const items = [...(data.items || [])].sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        if (bTime !== aTime) return bTime - aTime;
        return String(b._id || "").localeCompare(String(a._id || ""));
      });
      setTeachers(items);
      setPagination({
        total: data.total || 0,
        totalPages: data.totalPages || 1,
        limit: data.limit || 10,
      });
      setPage(data.page || nextPage);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load teachers data");
      setTeachers([]);
      setPagination({ totalPages: 1, total: 0, limit: 10 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchSection]);

  useEffect(() => {
    if (!success) return undefined;
    const timer = window.setTimeout(() => setSuccess(""), 4000);
    return () => window.clearTimeout(timer);
  }, [success]);

  const resetCreateForm = () => {
    setCreateForm({ ...initialCreateTeacherForm });
  };

  const parseBooleanValue = (value) => {
    const normalized = String(value || "").trim().toLowerCase();
    return normalized === "true" || normalized === "yes" || normalized === "1" || normalized === "on";
  };

  const parseKeyValueText = (text) => {
    const result = {};
    const lines = String(text || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    lines.forEach((line) => {
      if (line.startsWith("#")) return;
      const separatorIndex = line.indexOf(":") >= 0 ? line.indexOf(":") : line.indexOf("=");
      if (separatorIndex === -1) return;
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (!key) return;
      result[key] = value;
    });

    return result;
  };

  const splitList = (value) =>
    String(value || "")
      .split(/[,|]/)
      .map((item) => item.trim())
      .filter(Boolean);

  const normalizeImportKey = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");

  const readRowValue = (row, aliases) => {
    const aliasSet = new Set(aliases.map((item) => normalizeImportKey(item)));
    for (const [key, value] of Object.entries(row || {})) {
      if (aliasSet.has(normalizeImportKey(key))) {
        return value;
      }
    }
    return "";
  };

  const asImportText = (value) => {
    if (value == null || value === "") return "";
    if (typeof value === "number" && Number.isFinite(value)) {
      // Keep phone/CNIC/password digits exact (avoid 3.63e12 style strings).
      if (Number.isInteger(value) || Math.abs(value % 1) < 1e-9) {
        return String(Math.trunc(value));
      }
      return String(value);
    }
    return String(value).trim();
  };

  const parseFlexibleDate = (value) => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

    // Excel/CSV parsers often emit serial day numbers (e.g. 46222 for Jul 19, 2026).
    if (typeof value === "number" && Number.isFinite(value) && value > 20000 && value < 100000) {
      const parsed = XLSX.SSF?.parse_date_code?.(value);
      if (parsed?.y) {
        return new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H || 0, parsed.M || 0, parsed.S || 0);
      }
      const utc = Math.round((value - 25569) * 86400 * 1000);
      const date = new Date(utc);
      if (!Number.isNaN(date.getTime())) {
        return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
      }
    }

    const text = asImportText(value);
    if (!text) return null;

    // Excel serial encoded as text
    if (/^\d{5}$/.test(text)) {
      return parseFlexibleDate(Number(text));
    }

    // YYYY-MM-DD or YYYY/MM/DD
    const isoMatch = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(text);
    if (isoMatch) {
      const date = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
      if (!Number.isNaN(date.getTime())) return date;
    }

    // DD-MM-YYYY or DD/MM/YYYY (common in import sheets)
    const dmyMatch = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(text);
    if (dmyMatch) {
      const day = Number(dmyMatch[1]);
      const month = Number(dmyMatch[2]);
      const year = Number(dmyMatch[3]);
      const date = new Date(year, month - 1, day);
      if (
        !Number.isNaN(date.getTime()) &&
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {
        return date;
      }
    }

    const direct = new Date(text);
    if (!Number.isNaN(direct.getTime())) return direct;

    return null;
  };

  const normalizeImportHeader = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");

  const validateTeacherImportHeaders = (headers = []) => {
    const normalizedHeaders = new Set(headers.map((header) => normalizeImportHeader(header)).filter(Boolean));
    const missingHeaders = TEACHER_IMPORT_HEADERS.filter(
      (header) => !normalizedHeaders.has(normalizeImportHeader(header))
    );
    if (missingHeaders.length) {
      throw new Error(`Import file is missing required headings: ${missingHeaders.join(", ")}.`);
    }
  };

  const slugifyForEmail = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "") || "teacher";

  const generateTeacherEmail = (fullName) => `${slugifyForEmail(fullName)}@schoolerp.local`;

  const generateTeacherPassword = (fullName) => {
    const token = String(fullName || "Teacher")
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 6)
      .toLowerCase();
    return `${token || "teacher"}@123`;
  };

  const parseAssignmentText = (value, branch = "Girls") => {
    const normalizedBranch = branch === "Boys" ? "Boys" : "Girls";
    const tokens = splitList(value);
    return tokens
      .flatMap((item) => {
        const text = String(item || "").trim();
        if (!text) return [];
        const match = /^(.+?)[\s\-\/|]+([A-Za-z0-9]+)$/.exec(text);
        if (match) {
          return [
            {
              className: match[1].trim(),
              branch: normalizedBranch,
              section: match[2].trim(),
              subject: "Class Teacher",
            },
          ];
        }
        return [
          {
            className: text,
            branch: normalizedBranch,
            section: "A",
            subject: "Class Teacher",
          },
        ];
      })
      .filter((item) => item.className && item.section);
  };

  const normalizeTeacherImportRecord = (raw) => {
    const fullName = asImportText(
      readRowValue(raw, ["Teacher Name", "Full Name", "Name", "teacherName", "fullName"])
    );
    const emailValue = asImportText(readRowValue(raw, ["Email", "Email ID", "email", "emailId"]));
    const passwordValue = asImportText(readRowValue(raw, ["Password", "Login Password", "password"]));
    const createdDateValue = parseFlexibleDate(readRowValue(raw, ["Created Date", "Created", "createdAt"]));
    const joiningDateValue =
      parseFlexibleDate(readRowValue(raw, ["Joining Date", "joiningDate", "Join Date"])) || createdDateValue;
    const statusValue = asImportText(readRowValue(raw, ["Status", "status"]) || "Active").toLowerCase();
    const branchValue = asImportText(readRowValue(raw, ["Branch", "branch", "Campus"]) || "Girls") === "Boys" ? "Boys" : "Girls";
    const assignmentsText =
      readRowValue(raw, ["Assign Classes/Section", "Assigned Classes", "Class Section", "Classes & Sections", "Assignments"]) ||
      "";

    const normalized = {
      fullName,
      email: emailValue || generateTeacherEmail(fullName),
      password: passwordValue || generateTeacherPassword(fullName),
      cnic: asImportText(readRowValue(raw, ["Cnic", "CNIC", "cnic", "CNIC No", "CNIC Number"])),
      address: asImportText(readRowValue(raw, ["Address", "address"])),
      phoneNumber: asImportText(readRowValue(raw, ["Phone Number", "Phone", "Mobile", "phoneNumber"])),
      branch: branchValue,
      designation: asImportText(readRowValue(raw, ["Designation", "designation"])),
      qualification: asImportText(readRowValue(raw, ["Qualification", "qualification"])),
      expertise: asImportText(readRowValue(raw, ["Expertise", "Favorite Subjects", "Subjects", "expertise"])),
      salary: asImportText(readRowValue(raw, ["Salary", "salary"])),
      isActive: statusValue !== "inactive" && statusValue !== "inactive account" && statusValue !== "disabled",
      createdAt: createdDateValue ? createdDateValue.toISOString() : "",
      joiningDate: joiningDateValue ? joiningDateValue.toISOString() : "",
      allowPasswordReset:
        readRowValue(raw, ["Allow Password Reset", "allowPasswordReset"]) === ""
          ? true
          : parseBooleanValue(readRowValue(raw, ["Allow Password Reset", "allowPasswordReset"])),
      assignments: [],
    };

    const assignmentsSource = Array.isArray(readRowValue(raw, ["Assignments", "assignments"]))
      ? readRowValue(raw, ["Assignments", "assignments"])
      : typeof readRowValue(raw, ["Assignments", "assignments"]) === "string" &&
          String(readRowValue(raw, ["Assignments", "assignments"])).trim()
        ? (() => {
            try {
              const parsed = JSON.parse(String(readRowValue(raw, ["Assignments", "assignments"])));
              return Array.isArray(parsed) ? parsed : [parsed];
            } catch {
              return [];
            }
          })()
        : [];

    if (assignmentsSource.length) {
      normalized.assignments = assignmentsSource
        .map((item) => ({
          className: String(item.className || "").trim(),
          branch: item.branch === "Boys" ? "Boys" : item.branch === "Girls" ? "Girls" : branchValue,
          section: String(item.section || "").trim(),
          subject: String(item.subject || "").trim() || "Class Teacher",
        }))
        .filter((item) => item.className && item.section && item.subject);
    } else if (assignmentsText) {
      normalized.assignments = parseAssignmentText(assignmentsText, branchValue);
    } else if (
      readRowValue(raw, ["Class Name", "Class", "className"]) &&
      (readRowValue(raw, ["Sections", "Section", "sections", "section"]) || readRowValue(raw, ["Subject", "Subjects", "subject", "subjects"]))
    ) {
      const className = String(readRowValue(raw, ["Class Name", "Class", "className"]) || "").trim();
      const sections = Array.isArray(readRowValue(raw, ["Sections", "sections"]))
        ? readRowValue(raw, ["Sections", "sections"])
        : splitList(readRowValue(raw, ["Sections", "Section", "sections", "section"]));
      const subjectGroups = {};

      const sectionSubjectsValue = readRowValue(raw, ["Section Subjects", "sectionSubjects"]);
      if (sectionSubjectsValue && typeof sectionSubjectsValue === "object" && !Array.isArray(sectionSubjectsValue)) {
        Object.entries(sectionSubjectsValue).forEach(([sectionKey, value]) => {
          subjectGroups[String(sectionKey).trim()] = Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : splitList(value);
        });
      }

      Object.entries(raw).forEach(([key, value]) => {
        const sectionMatch = /^sectionsubjects?\.(.+)$/i.exec(key) || /^subjects\.(.+)$/i.exec(key);
        if (sectionMatch) {
          subjectGroups[sectionMatch[1].trim()] = splitList(value);
        }
      });

      if (sections.length) {
        normalized.assignments = sections.flatMap((section) => {
          const subjects = subjectGroups[section] || splitList(readRowValue(raw, ["Subject", "Subjects", "subject", "subjects"]) || "Class Teacher");
          return subjects.map((subject) => ({
            className,
            branch: branchValue,
            section,
            subject: subject || "Class Teacher",
          }));
        });
      } else {
        normalized.assignments = [
          {
            className,
            branch: branchValue,
            section: String(readRowValue(raw, ["Section", "section"]) || "A").trim(),
            subject: String(readRowValue(raw, ["Subject", "subject"]) || "Class Teacher").trim() || "Class Teacher",
          },
        ];
      }
    }

    if (!normalized.fullName) {
      throw new Error("Each row must include Teacher Name.");
    }

    return normalized;
  };

  const parseTeacherImportFile = async (file) => {
    if (!file) {
      throw new Error("Please choose a file to import.");
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["xlsx", "xls", "csv"].includes(extension)) {
      throw new Error("Only .xlsx, .xls, and .csv files are supported for teacher import.");
    }

    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("Import file is empty.");
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
    if (!rows.length) {
      throw new Error("Import file is empty.");
    }

    const [headerRow, ...dataRows] = rows;
    validateTeacherImportHeaders(headerRow);

    const records = dataRows
      .filter((row) => row.some((cell) => String(cell ?? "").trim()))
      .map((row) =>
        headerRow.reduce((acc, header, index) => {
          acc[header] = row[index] ?? "";
          return acc;
        }, {})
      );

    const normalizedRows = records.map((row) => normalizeTeacherImportRecord(row)).filter((row) => row.fullName && row.email && row.password);

    if (!normalizedRows.length) {
      throw new Error("Import file must include at least one teacher row.");
    }

    return normalizedRows;
  };

  const importTeacherFromFile = async (file) => {
    if (!file) return { importedCount: 0, skipped: [], failed: [] };
    setImporting(true);
    setError("");
    setSuccess("");
    try {
      const payloads = await parseTeacherImportFile(file);
      const imported = [];
      const skipped = [];
      const failed = [];
      const seenEmails = new Set();

      for (const payload of payloads) {
        const emailKey = String(payload.email || "")
          .trim()
          .toLowerCase();
        const displayName = payload.fullName || emailKey || "Teacher";

        // Only email must be unique in the file — same phone/CNIC is allowed across teachers.
        if (emailKey && seenEmails.has(emailKey)) {
          skipped.push({
            name: displayName,
            email: emailKey,
            reason: "Duplicate email in import file",
          });
          continue;
        }

        try {
          await api.post("/teachers", {
            ...payload,
            salary: String(payload.salary || "").replace(/[^\d.]/g, ""),
            importMode: true,
          });
          imported.push(displayName);
          if (emailKey) seenEmails.add(emailKey);
        } catch (err) {
          const status = err.response?.status;
          const message = err.response?.data?.message || err.message || "Failed to import teacher";
          if (status === 409) {
            skipped.push({
              name: displayName,
              email: emailKey,
              reason: message,
            });
          } else {
            failed.push({
              name: displayName,
              email: emailKey,
              message,
            });
          }
        }
      }

      if (imported.length) {
        setSuccess(
          imported.length === 1
            ? "Teacher imported successfully."
            : `${imported.length} teachers imported successfully.`
        );
        refreshTeacherHistory();
        await loadData(1, search);
      } else if (!skipped.length && failed.length) {
        setError(failed[0]?.message || "Failed to import teachers");
      }

      if (!imported.length && !skipped.length && failed.length) {
        throw new Error(failed[0]?.message || "Failed to import teachers");
      }

      return {
        importedCount: imported.length,
        skipped,
        failed,
      };
    } catch (err) {
      setError(err.message || err.response?.data?.message || "Failed to import teacher");
      throw err;
    } finally {
      setImporting(false);
    }
  };

  const closeTeacherModal = () => {
    setAssignTeacherId(null);
    setAssignTeacher(null);
    setAssignEditPanel("classes");
    setTeacherModalMode(null);
    setCreateModalTeacherName("");
    setError("");
    resetCreateForm();
  };

  const openTeacherModal = (mode) => {
    setAssignTeacherId(null);
    setTeacherModalMode(mode);
    setCreateForm({ ...initialCreateTeacherForm, branch: branchSection });
    setCreateWizardKey((key) => key + 1);
    setCreateModalTeacherName("");
    setError("");
  };

  const openImportModal = () => {
    setError("");
    setSuccess("");
    setShowImportModal(true);
  };

  const closeImportModal = () => {
    if (importing) return;
    setShowImportModal(false);
  };

  const refreshTeacherHistory = () => {
    setHistoryRefreshKey((key) => key + 1);
  };

  const onSaveAssignments = async (teacherId, wizardForm) => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const assignments = isNoAssignClass(wizardForm.className)
        ? []
        : buildAssignmentsFromSelection(
            wizardForm.classAssignments || wizardForm.classNames || wizardForm.className,
            wizardForm.branch,
            wizardForm.sections,
            wizardForm.sectionSubjects
          );
      await api.put(`/teachers/${teacherId}`, { assignments });
      closeTeacherModal();
      setSuccess(
        assignments.length
          ? "Class assignments saved successfully."
          : "Teacher marked as NO ASSIGN — all class assignments removed."
      );
      refreshTeacherHistory();
      await loadData(page, search);
      onAssignmentsUpdated?.();
      notifyTeacherAssignmentsUpdated(teacherId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save class assignments");
    } finally {
      setSaving(false);
    }
  };

  const onSaveAssignProfile = async (teacherId, wizardForm) => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.put(`/teachers/${teacherId}`, {
        cnic: (wizardForm.cnic || "").trim(),
        phoneNumber: (wizardForm.phoneNumber || "").trim(),
        salary: (wizardForm.salary || "").trim(),
        address: (wizardForm.address || "").trim(),
      });
      closeTeacherModal();
      setSuccess("Teacher profile updated successfully.");
      await loadData(page, search);
      refreshTeacherHistory();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update teacher profile");
    } finally {
      setSaving(false);
    }
  };

  const onSaveAssignDocuments = async (teacherId, wizardForm) => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const documentFiles = Array.isArray(wizardForm.documentFiles) ? wizardForm.documentFiles : [];
      if (!documentFiles.length) {
        setError("Please upload at least one document.");
        return;
      }
      const formData = new FormData();
      documentFiles.forEach((file) => formData.append("documents", file));
      await api.put(`/teachers/${teacherId}`, formData);
      closeTeacherModal();
      setSuccess("Teacher documents uploaded successfully.");
      await loadData(page, search);
      refreshTeacherHistory();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload teacher documents");
    } finally {
      setSaving(false);
    }
  };

  const onWizardSubmit = async (wizardForm, meta = {}) => {
    if (assignTeacherId) {
      const panel = meta.panel || assignEditPanel;
      if (panel === "profile") {
        await onSaveAssignProfile(assignTeacherId, wizardForm);
        return;
      }
      if (panel === "documents") {
        await onSaveAssignDocuments(assignTeacherId, wizardForm);
        return;
      }
      await onSaveAssignments(assignTeacherId, wizardForm);
      return;
    }
    await onCreateTeacher(wizardForm);
  };

  const onCreateTeacher = async (wizardForm) => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const assignments = isNoAssignClass(wizardForm.className)
        ? []
        : buildAssignmentsFromSelection(
            wizardForm.classAssignments || wizardForm.classNames || wizardForm.className,
            wizardForm.branch,
            wizardForm.sections,
            wizardForm.sectionSubjects
          );
      const documentFiles = Array.isArray(wizardForm.documentFiles) ? wizardForm.documentFiles : [];
      const hasDocuments = documentFiles.length > 0;
      const basePayload = {
        fullName: wizardForm.fullName.trim(),
        email: wizardForm.email.trim(),
        password: wizardForm.password,
        cnic: wizardForm.cnic,
        address: wizardForm.address,
        phoneNumber: wizardForm.phoneNumber,
        branch: wizardForm.branch,
        designation: wizardForm.designation,
        qualification: wizardForm.qualification,
        expertise: wizardForm.expertise,
        salary: wizardForm.salary,
        classInchargeClasses: wizardForm.classInchargeClasses || [],
        allowPasswordReset: wizardForm.allowPasswordReset,
        assignments,
      };

      if (hasDocuments) {
        const formData = new FormData();
        Object.entries(basePayload).forEach(([key, value]) => {
          if (value == null) return;
          if (key === "assignments" || key === "classInchargeClasses") {
            formData.append(key, JSON.stringify(value));
          } else if (typeof value === "boolean" || typeof value === "number") {
            formData.append(key, String(value));
          } else {
            formData.append(key, value);
          }
        });
        documentFiles.forEach((file) => formData.append("documents", file));
        await api.post("/teachers", formData);
      } else {
        await api.post("/teachers", basePayload);
      }
      resetCreateForm();
      setSuccess(
        teacherModalMode === "import"
          ? "Teacher imported successfully."
          : assignments.length
            ? "Teacher created successfully with assigned classes."
            : "Teacher created successfully without class assignment."
      );
      setTeacherModalMode(null);
      refreshTeacherHistory();
      await loadData(1, search);
      onAssignmentsUpdated?.();
      notifyTeacherAssignmentsUpdated();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create teacher");
    } finally {
      setSaving(false);
    }
  };

  const openLoginDetailsModal = (teacher) => {
    setLoginDetailsTeacher(teacher);
    setShowLoginDetailsModal(true);
  };

  const openTeacherProfileModal = (teacher) => {
    setTeacherProfile(teacher);
    setShowTeacherProfileModal(true);
  };

  const openTeacherDocumentsModal = (teacher) => {
    setTeacherDocumentsTeacher(teacher);
    setShowTeacherDocumentsModal(true);
  };

  const saveTeacherProfile = async (teacherId, payload) => {
    const { data } = await api.put(`/teachers/${teacherId}`, payload);
    await loadData(page, search);
    if (data?.data) {
      setTeacherProfile((current) => (current?._id === teacherId || current?.id === teacherId ? { ...current, ...data.data } : current));
    }
    return data?.data || null;
  };

  const closeLoginDetailsModal = () => {
    setShowLoginDetailsModal(false);
    setLoginDetailsTeacher(null);
  };

  const closeTeacherProfileModal = () => {
    setShowTeacherProfileModal(false);
    setTeacherProfile(null);
  };

  const closeTeacherDocumentsModal = () => {
    setShowTeacherDocumentsModal(false);
    setTeacherDocumentsTeacher(null);
  };

  const openAssignModal = (teacher) => {
    setAssignTeacherId(teacher._id);
    setAssignTeacher(teacher);
    setAssignEditPanel("classes");
    setTeacherModalMode("assign");
    setCreateForm(assignedClassesToFormState(teacher.assignedClasses, teacher));
    setCreateModalTeacherName(teacher.fullName || "");
    setCreateWizardKey((key) => key + 1);
    setError("");
  };

  const resolveTeacherForEdit = (teacherId, fallbackTeacher) => {
    const latestTeacher = teachers.find((teacher) => teacher._id === teacherId || teacher.id === teacherId);
    return latestTeacher || fallbackTeacher;
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setHistoryExportOpen(false);
    setHistoryExporting(false);
    setHistoryExportApi(null);
  };

  const handleHistoryExport = async (format) => {
    if (!historyExportApi?.export || historyExporting) return;
    setHistoryExporting(true);
    setHistoryExportOpen(false);
    try {
      await historyExportApi.export(format);
    } catch {
      // Error message is surfaced inside the history modal filters area.
    } finally {
      setHistoryExporting(false);
    }
  };

  const cardClass = dark
    ? "overflow-hidden rounded-2xl border border-white/[0.06] bg-[#161722]"
    : "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm";

  const hasOpenModal =
    Boolean(teacherModalMode) ||
    showImportModal ||
    showRemoveModal ||
    showHistoryModal ||
    showTeacherProfileModal ||
    showTeacherDocumentsModal ||
    showLoginDetailsModal;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ${
              dark ? "bg-[#7c4dff] shadow-[#7c4dff]/20" : "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-200"
            }`}
          >
            <IconUsers />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>Teachers Management</h2>
            <p className={`mt-0.5 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
              Create teacher accounts, assign classes and monitor teacher activities.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => openTeacherModal("create")}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium text-white ${
              dark ? "bg-[#7c4dff] hover:bg-[#6a3df0]" : "ref-btn-primary"
            }`}
          >
            <IconUserPlus />
            Create Teacher
          </button>
          <button
            type="button"
            onClick={openImportModal}
            disabled={importing}
          className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-medium ${
            dark
              ? "border-[#7c4dff]/30 bg-[#7c4dff]/10 text-[#7c4dff] hover:bg-[#7c4dff]/15"
              : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            <IconUploadArrow className="h-4 w-4" />
            {importing ? "Importing..." : "Import Teacher"}
          </button>
          <button
            type="button"
            onClick={() => setShowRemoveModal(true)}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-medium ${
              dark
                ? "border-[#e91e63]/30 bg-[#e91e63]/10 text-[#e91e63] hover:bg-[#e91e63]/15"
                : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            <IconUserMinus />
            Teacher Remove at School
          </button>
        </div>
      </div>

      {error && !hasOpenModal ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            dark ? "border-[#e91e63]/30 bg-[#e91e63]/10 text-[#e91e63]" : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {error}
        </div>
      ) : null}
      {success ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            dark ? "border-[#4caf50]/30 bg-[#4caf50]/10 text-[#4caf50]" : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {success}
        </div>
      ) : null}

      {/* Search bar */}
      <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${dark ? "text-[#9e9e9e]" : "text-slate-400"}`}>
            <IconSearch />
          </span>
          <input
            className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none ${
              dark
                ? "border-white/[0.06] bg-[#161722] text-white placeholder:text-[#9e9e9e] focus:border-[#7c4dff]/40 focus:ring-2 focus:ring-[#7c4dff]/15"
                : "border-slate-200 bg-white text-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            }`}
            placeholder="Search teacher by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadData(1, search)}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setSearch("");
            loadData(1, "");
          }}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium ${
            dark
              ? "border-white/[0.06] bg-[#161722] text-[#9e9e9e] hover:bg-white/[0.04] hover:text-white"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => setShowHistoryModal(true)}
          title="Assignment history"
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-md ${
            dark
              ? "bg-[#7c4dff] shadow-[#7c4dff]/20 hover:bg-[#6a3df0]"
              : "bg-gradient-to-r from-indigo-500 to-violet-600 shadow-indigo-200 hover:from-indigo-600 hover:to-violet-700"
          }`}
        >
          <IconHistory />
          History
        </button>
      </div>

      {/* Teacher accounts table */}
      <div className={cardClass}>
        <div
          className={`flex items-center border-b px-5 py-4 ${
            dark ? "border-white/[0.06]" : "border-slate-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                dark ? "bg-[#7c4dff]/15 text-[#7c4dff]" : "bg-indigo-50 text-indigo-600"
              }`}
            >
              <IconUsers />
            </span>
            <h3 className={`text-base font-semibold ${dark ? "text-white" : "text-slate-800"}`}>
              Teacher Accounts{pagination.total ? ` (${pagination.total})` : ""}
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr
                className={`border-b text-left text-[11px] font-semibold uppercase tracking-wider ${
                  dark ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e]" : "border-slate-100 bg-slate-50/80 text-slate-500"
                }`}
              >
                <th className="px-5 py-2">Teacher Name</th>
                <th className="px-5 py-2">Profile Details</th>
                <th className="px-5 py-2">Classes & Sections</th>
                <th className="px-5 py-2 pl-12">Status</th>
                <th className="px-5 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className={`px-5 py-8 text-center ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                    Loading teachers...
                  </td>
                </tr>
              ) : teachers.length ? (
                teachers.map((teacher) => (
                  <tr
                    key={teacher._id}
                    className={dark ? "border-b border-white/[0.06] hover:bg-white/[0.03]" : "border-b border-slate-50 hover:bg-slate-50/50"}
                  >
                    <td className="px-5 py-3 align-middle">
                      <div className="flex items-center gap-3">
                        <TeacherAvatar name={teacher.fullName} />
                        <div>
                          <p className={`text-base font-semibold leading-tight ${dark ? "text-white" : "text-slate-800"}`}>{teacher.fullName}</p>
                          <p className={`text-sm whitespace-nowrap ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                            Created{" "}
                            {teacher.createdAt
                              ? new Date(teacher.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "Not set"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 align-middle">
                      <div className={`grid grid-cols-1 gap-1.5 text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                        <p>
                          Joining Date:{" "}
                          <span className="font-bold">
                            {teacher.profile?.joiningDate || teacher.createdAt
                              ? new Date(teacher.profile?.joiningDate || teacher.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "Not set"}
                          </span>
                        </p>
                        <p>
                          Phone Number: <span className="font-bold">{teacher.profile?.phoneNumber || "Not set"}</span>
                        </p>
                        <p>
                          Qualification: <span className="font-bold">{teacher.profile?.qualification || "Not set"}</span>
                        </p>
                        <p>
                          Designation: <span className="font-bold">{teacher.profile?.designation || "Not set"}</span>
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3 align-middle">
                      <div className="space-y-1.5">
                        <span
                          className={`block rounded-full px-2.5 py-1 text-xs font-semibold ${
                            dark ? "bg-[#7c4dff]/15 text-[#7c4dff]" : "bg-indigo-50 text-indigo-700"
                          }`}
                        >
                          {getTeacherAssignmentSummary(teacher.assignedClasses).classes} Assigned Classes
                        </span>
                        <span
                          className={`block rounded-full px-2.5 py-1 text-xs font-semibold ${
                            dark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {getTeacherAssignmentSummary(teacher.assignedClasses).sections} Assigned Sections
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 align-middle pl-12">
                      <StatusPill active={teacher.isActive} dark={dark} />
                    </td>
                    <td className="px-5 py-3 align-middle text-right">
                      <div className="inline-flex items-center gap-1 align-middle">
                        <button
                          type="button"
                          onClick={() => openTeacherProfileModal(teacher)}
                          title="View teacher profile"
                          className={`inline-flex items-center rounded-lg border p-1.5 ${
                            dark
                              ? "border-white/[0.06] text-[#9e9e9e] hover:bg-white/[0.04] hover:text-white"
                              : "border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          }`}
                          >
                            <IconEye />
                          </button>
                        {Array.isArray(teacher.profile?.documents) && teacher.profile.documents.length ? (
                          <button
                            type="button"
                            onClick={() => openTeacherDocumentsModal(teacher)}
                            title="View teacher documents"
                            className={`inline-flex items-center rounded-lg border p-1.5 ${
                              dark
                                ? "border-[#7c4dff]/30 bg-[#7c4dff]/10 text-[#7c4dff] hover:bg-[#7c4dff]/15"
                                : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                            }`}
                          >
                            <IconDocument />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => openLoginDetailsModal(teacher)}
                          title="View login details"
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                            dark
                              ? "border-[#7c4dff]/30 bg-[#7c4dff]/10 text-[#7c4dff] hover:bg-[#7c4dff]/15"
                              : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          }`}
                        >
                          <IconKey />
                          Login Details
                        </button>
                        <button
                          type="button"
                          onClick={() => openAssignModal(teacher)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                            dark ? "text-[#7c4dff] hover:bg-white/[0.04]" : "text-indigo-600 hover:bg-indigo-50"
                          }`}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className={`px-5 py-10 text-center ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                    No teachers found. Create a teacher to enable their panel.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          dark={dark}
          onPrev={() => loadData(page - 1, search)}
          onNext={() => loadData(page + 1, search)}
        />
      </div>

      <FormModal
        open={Boolean(teacherModalMode)}
        title={
          teacherModalMode === "assign"
            ? assignEditPanel === "profile"
              ? "Teacher Profile"
              : assignEditPanel === "documents"
                ? "Upload Documents"
                : "Class Assignments"
            : "Create Teacher"
        }
        subtitle={createModalTeacherName}
        onClose={closeTeacherModal}
        wide
        dark={dark}
        onToggleTheme={onToggleTheme}
        headerActions={
          teacherModalMode === "assign" ? (
            <div className="flex items-center gap-2">
              {[
                { key: "classes", label: "Class / Section", icon: <IconClassSection /> },
                { key: "profile", label: "Teacher Profile", icon: <IconTeacherProfile /> },
                { key: "documents", label: "Upload Documents", icon: <IconUploadDocuments /> },
              ].map((item) => {
                const active = assignEditPanel === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setAssignEditPanel(item.key);
                      setError("");
                    }}
                    title={item.label}
                    aria-label={item.label}
                    aria-pressed={active}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                      active
                        ? dark
                          ? "border-[#7c4dff] bg-[#7c4dff] text-white"
                          : "border-indigo-600 bg-indigo-600 text-white"
                        : dark
                          ? "border-[#7c4dff]/30 bg-[#7c4dff]/10 text-[#7c4dff] hover:bg-[#7c4dff]/15"
                          : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    }`}
                  >
                    {item.icon}
                  </button>
                );
              })}
            </div>
          ) : null
        }
      >
        {teacherModalMode ? (
          <CreateTeacherWizard
            key={createWizardKey}
            form={createForm}
            setForm={setCreateForm}
            onSubmit={onWizardSubmit}
            saving={saving}
            onCancel={closeTeacherModal}
            onTitleChange={setCreateModalTeacherName}
            dark={dark}
            mode={teacherModalMode === "assign" ? "assign" : "create"}
            submitError={error}
            onDismissError={() => setError("")}
            assignPanel={assignEditPanel}
            assignTeacher={assignTeacher}
          />
        ) : null}
      </FormModal>

      <TeacherImportModal
        open={showImportModal}
        dark={dark}
        onClose={closeImportModal}
        onImport={importTeacherFromFile}
        importing={importing}
      />

      <FormModal
        open={showHistoryModal}
        title="Teacher Assignment History"
        subtitle="Class / Section / Subject"
        onClose={closeHistoryModal}
        extraWide
        dark={dark}
        onToggleTheme={onToggleTheme}
        headerActions={
          <div className="relative">
            <button
              type="button"
              onClick={() => setHistoryExportOpen((open) => !open)}
              disabled={historyExporting || !historyExportApi?.canExport}
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition disabled:opacity-50 ${
                dark
                  ? "border-[#7c4dff]/30 bg-[#7c4dff]/10 text-[#7c4dff] hover:bg-[#7c4dff]/15"
                  : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              }`}
              title="Export teacher assignment history"
              aria-label="Export teacher assignment history"
              aria-expanded={historyExportOpen}
            >
              <IconDownload />
            </button>
            {historyExportOpen ? (
              <div
                className={`absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-xl border shadow-lg ${
                  dark ? "border-white/[0.08] bg-[#1a1b26]" : "border-slate-200 bg-white"
                }`}
              >
                {[
                  { key: "csv", label: "CSV" },
                  { key: "pdf", label: "PDF" },
                  { key: "png", label: "PNG" },
                  { key: "print", label: "Print" },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    disabled={historyExporting || !historyExportApi?.canExport}
                    onClick={() => handleHistoryExport(option.key)}
                    className={`block w-full px-4 py-2.5 text-left text-sm font-semibold transition ${
                      dark ? "text-[#e8e8ef] hover:bg-white/[0.05]" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {historyExporting ? "Exporting..." : option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        }
      >
        {showHistoryModal ? (
          <TeacherAssignmentHistoryModal
            dark={dark}
            refreshKey={historyRefreshKey}
            onViewProfile={openTeacherProfileModal}
            onViewDocuments={openTeacherDocumentsModal}
            onViewLoginDetails={openLoginDetailsModal}
            onEditTeacher={openAssignModal}
            resolveTeacherForEdit={resolveTeacherForEdit}
            onExportApiChange={setHistoryExportApi}
          />
        ) : null}
      </FormModal>

      {showTeacherProfileModal ? (
        <TeacherProfileModal
          teacher={teacherProfile}
          dark={dark}
          onClose={closeTeacherProfileModal}
          onSave={saveTeacherProfile}
        />
      ) : null}

      <TeacherDocumentsModal
        open={showTeacherDocumentsModal}
        teacher={teacherDocumentsTeacher}
        documents={teacherDocumentsTeacher?.profile?.documents || []}
        dark={dark}
        onClose={closeTeacherDocumentsModal}
      />

      <TeacherLoginDetailsModal
        open={showLoginDetailsModal}
        teacher={loginDetailsTeacher}
        onClose={closeLoginDetailsModal}
        dark={dark}
      />

      <FormModal
        open={showRemoveModal}
        title="Teacher Remove at School"
        onClose={() => setShowRemoveModal(false)}
        extraWide
        dark={dark}
        onToggleTheme={onToggleTheme}
      >
        {showRemoveModal ? (
          <TeacherRemoveModal
            dark={dark}
            onRemoved={(name) => {
              setSuccess(`${name} removed from school successfully.`);
              refreshTeacherHistory();
              loadData(page, search);
            }}
          />
        ) : null}
      </FormModal>
    </section>
  );
}
