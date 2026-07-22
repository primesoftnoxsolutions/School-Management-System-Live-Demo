import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../services/api/client";
import { CLASS_OPTIONS, SECTION_OPTIONS } from "../../constants/classes";
import { resolveStudentPhotoUrl } from "../../utils/mediaUrl";
import { matchesStudentClassSection, matchesStudentCreatedDateRange } from "../../utils/studentFormat";
import StudentProfileDetails, { StudentProfileHeaderMeta } from "./StudentProfileDetails";
import ModernDatePicker from "../ui/ModernDatePicker";
import ScrollableSelect from "../ui/ScrollableSelect";

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultFromDate() {
  return todayKey();
}

function parseLocalDateInput(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function validateFilters(from, to) {
  if (!from || !to) return "From date and To date are both required.";
  const fromDate = parseLocalDateInput(from);
  const toDate = parseLocalDateInput(to);
  if (!fromDate || !toDate) return "Please enter valid dates.";
  if (fromDate > toDate) return "From date cannot be after To date.";
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (toDate > today) return "To date cannot be in the future.";
  return "";
}

function filterStudents(items, from, to, className, section, status) {
  return items.filter(
    (student) =>
      matchesStudentCreatedDateRange(student, from, to) &&
      matchesStudentClassSection(student, className, section) &&
      (!status || (student.status || "ACTIVE") === status)
  );
}

function formatDisplayDate(value) {
  const parsed = parseLocalDateInput(value);
  if (!parsed) return value || "-";
  return parsed.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `Rs. ${amount.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function deriveBranch(student) {
  if (student?.branch) return student.branch;
  if (student?.gender === "MALE") return "Boys";
  if (student?.gender === "FEMALE") return "Girls";
  return "-";
}

function formatStatusLabel(status) {
  return status === "ACTIVE" ? "Active" : "Removed";
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  if (/[,"\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function StatusBadge({ status, dark = false }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active
          ? dark
            ? "bg-[#4caf50]/15 text-[#4caf50]"
            : "bg-emerald-50 text-emerald-700"
          : dark
            ? "bg-white/[0.06] text-[#9e9e9e]"
            : "bg-slate-100 text-slate-600"
      }`}
    >
      {active ? "Active" : "Removed"}
    </span>
  );
}

function StudentAvatar({ student, dark = false, size = "md" }) {
  const dim = size === "lg" ? "h-20 w-20 text-xl" : "h-10 w-10 text-sm";
  const initials = `${student?.firstName || ""}${student?.lastName || ""}`
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
  const photo = resolveStudentPhotoUrl(student?.studentPhotoUrl);

  if (photo) {
    return (
      <img
        src={photo}
        alt={`${student?.firstName || ""} ${student?.lastName || ""}`.trim() || initials}
        className={`${dim} shrink-0 rounded-full object-cover ring-2 ring-white`}
      />
    );
  }

  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-full font-semibold ${
        dark ? "bg-[#7c4dff]/20 text-[#b794ff]" : "bg-blue-100 text-blue-700"
      }`}
    >
      {initials}
    </div>
  );
}

function StudentProfileOverlay({ student, dark, loading, onClose }) {
  if (!student && !loading) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[900] flex items-center justify-center px-4 ${
        dark ? "bg-[#0b0c15]/70 backdrop-blur-sm" : "bg-slate-900/45 backdrop-blur-[2px]"
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`modal-panel-enter w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl ${
          dark
            ? "border-white/[0.06] bg-[#161722]"
            : "border-slate-200 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {loading ? (
          <div className={`px-6 py-12 text-center text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
            Loading profile...
          </div>
        ) : (
          <>
            <div
              className={`border-b px-6 py-5 ${
                dark ? "border-white/[0.06] bg-[#1a1b26]" : "border-slate-100 bg-gradient-to-r from-slate-50 to-white"
              }`}
            >
              <div className="flex items-center gap-4">
                <StudentAvatar student={student} size="lg" dark={dark} />
                <div>
                  <h3 className={`text-lg font-bold ${dark ? "text-white" : "text-slate-900"}`}>
                    {student.firstName} {student.lastName}
                  </h3>
                  <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{student.admissionNo}</p>
                  <div className="mt-1">
                    <StatusBadge status={student.status || "ACTIVE"} dark={dark} />
                  </div>
                </div>
              </div>
              <StudentProfileHeaderMeta student={student} dark={dark} />
            </div>
            <StudentProfileDetails student={student} dark={dark} />
            <div className={`flex justify-end border-t px-6 py-4 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
              <button
                type="button"
                onClick={onClose}
                className={`rounded-xl px-5 py-2.5 text-sm font-medium text-white ${
                  dark ? "bg-[#7c4dff] hover:bg-[#6a3df0]" : "ref-btn-primary"
                }`}
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

function IconDownload() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4 4 4-4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5" />
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

function IconKey() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8a3.5 3.5 0 11-6.999.001A3.5 3.5 0 0115.5 8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11.5l-7 7h-2v-2l7-7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 7.5L18 6l2 2-1.5 1.5" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4l10.5-10.5a2.1 2.1 0 00-3-3L5 17v3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
    </svg>
  );
}

export default function StudentProfilesModal({
  dark = false,
  onOpenProfile,
  onOpenLoginDetails,
  onEditStudent,
}) {
  const today = todayKey();
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(today);
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [appliedClassName, setAppliedClassName] = useState("");
  const [appliedSection, setAppliedSection] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("ACTIVE");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterError, setFilterError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [profileStudent, setProfileStudent] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const classOptions = useMemo(
    () => [{ value: "", label: "All Classes" }, ...CLASS_OPTIONS.map((item) => ({ value: item, label: item }))],
    []
  );
  const sectionOptions = useMemo(
    () => [{ value: "", label: "All Sections" }, ...SECTION_OPTIONS.map((item) => ({ value: item, label: `Section ${item}` }))],
    []
  );
  const statusOptions = useMemo(
    () => [
      { value: "", label: "All Status" },
      { value: "ACTIVE", label: "Active" },
      { value: "INACTIVE", label: "Inactive" },
    ],
    []
  );

  const filterSummary = `${className || "All Classes"} - ${section ? `Section ${section}` : "All Sections"} - ${
    status ? (status === "ACTIVE" ? "Active" : "Inactive") : "All Status"
  } - ${fromDate === toDate ? formatDisplayDate(fromDate) : `${formatDisplayDate(fromDate)} to ${formatDisplayDate(toDate)}`}`;

  const handleExport = () => {
    if (!students.length) return;

    const rows = [
      [
        "Registration Number",
        "Student Name",
        "Class+section",
        "Roll #",
        "Branch",
        "Student CNIC",
        "Date of Birth",
        "Student Mobile",
        "Admission Date",
        "Father Name",
        "Father CNIC",
        "Father Mobile",
        "Address",
        "Paid Fee",
        "Pendding fee",
        "Status",
      ],
      ...students.map((student) => {
        const paidFee = Number(student?.admissionFeePaid ? student?.admissionFee || 0 : 0);
        const totalFee = Number(student?.admissionFee || 0) + Number(student?.annualFee || 0);
        const pendingFee = Math.max(totalFee - paidFee, 0);
        return [
          student.admissionNo || "-",
          `${student.firstName || ""} ${student.lastName || ""}`.trim() || "-",
          student.className ? `${student.className} - ${student.section || "A"}` : "-",
          student.rollNumber || "-",
          deriveBranch(student),
          student.cnicBForm || "-",
          formatDate(student.dateOfBirth),
          student.phoneNumber || "-",
          formatDate(student.admissionDate),
          student.fatherName || student.guardianName || "-",
          student.fatherCnic || "-",
          student.guardianPhone || "-",
          student.address || "-",
          formatCurrency(paidFee),
          formatCurrency(pendingFee),
          formatStatusLabel(student.status || "ACTIVE"),
        ];
      }),
    ];

    const fromLabel = formatDisplayDate(appliedFrom || fromDate);
    const toLabel = formatDisplayDate(appliedTo || toDate);
    downloadCsv(`student-profiles_${fromLabel}_to_${toLabel}.csv`.replace(/\s+/g, "_"), rows);
  };

  useEffect(() => {
    const message = validateFilters(fromDate, toDate);
    if (message) {
      setFilterError(message);
      setStudents([]);
      return undefined;
    }

    let cancelled = false;
    setFilterError("");
    setLoadError("");
    setLoading(true);

    (async () => {
      try {
        const { data } = await api.get("/students", {
          params: {
            page: 1,
            limit: 500,
            className: className || undefined,
            section: section || undefined,
            status: status || undefined,
          },
        });

        if (cancelled) return;

        const filtered = filterStudents(data.data?.items || [], fromDate, toDate, className, section, status);
        setStudents(filtered);
        setAppliedFrom(fromDate);
        setAppliedTo(toDate);
        setAppliedClassName(className);
        setAppliedSection(section);
          setAppliedStatus(status);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err.response?.data?.message || "Failed to load student profiles");
        setStudents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fromDate, toDate, className, section, status]);

  const handleViewProfile = async (student) => {
    setProfileLoading(true);
    setProfileStudent(student);
    try {
      const { data } = await api.get(`/students/${student._id}`);
      setProfileStudent(data.data || student);
    } catch {
      setProfileStudent(student);
    } finally {
      setProfileLoading(false);
    }
  };

  const thClass = dark
    ? "bg-[#1a1b26] px-4 py-3 font-medium text-[#9e9e9e]"
    : "bg-slate-50 px-4 py-3 font-medium text-slate-500";
  const tdClass = dark ? "px-4 py-3 text-[#e0e0e0]" : "px-4 py-3 text-slate-700";
  const borderClass = dark ? "border-white/[0.06]" : "border-slate-100";
  const headerRowClass = `border-b text-left whitespace-nowrap ${
    dark ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e]" : "border-slate-100 bg-slate-50/80 text-slate-500"
  }`;
  const rowClass = dark ? "border-b border-white/[0.06]" : "border-b border-slate-50";

  return (
    <>
      <div className="space-y-5">
        <div className={`rounded-2xl border p-4 ${dark ? "border-white/[0.06] bg-[#1a1b26]/60" : "border-slate-200 bg-slate-50/70"}`}>
          <p className={`mb-3 text-sm font-semibold ${dark ? "text-white" : "text-slate-800"}`}>Filter student profiles</p>
          <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
            <ModernDatePicker
              label="From date"
              value={fromDate}
              max={toDate || today}
              dark={dark}
              onChange={(value) => {
                setFromDate(value);
                setFilterError("");
              }}
            />
            <ModernDatePicker
              label="To date"
              value={toDate}
              min={fromDate || undefined}
              max={today}
              dark={dark}
              onChange={(value) => {
                setToDate(value);
                setFilterError("");
              }}
            />
            <ScrollableSelect
              label="Class"
              placeholder="All Classes"
              value={className}
              options={classOptions}
              onChange={(value) => {
                setClassName(value);
                setFilterError("");
              }}
              openUpward
              portal
              menuMaxHeight={320}
              dark={dark}
            />
            <ScrollableSelect
              label="Section"
              placeholder="All Sections"
              value={section}
              options={sectionOptions}
              onChange={(value) => {
                setSection(value);
                setFilterError("");
              }}
              openUpward
              portal
              menuMaxHeight={320}
              dark={dark}
            />
            <ScrollableSelect
              label="Status"
              placeholder="Active"
              value={status}
              options={statusOptions}
              onChange={(value) => {
                setStatus(value);
                setFilterError("");
              }}
              openUpward
              portal
              menuMaxHeight={320}
              dark={dark}
            />
            <button
              type="button"
              onClick={handleExport}
              disabled={!students.length}
              className={`inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 xl:w-auto ${
                dark
                  ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e] hover:bg-white/[0.04] hover:text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <IconDownload />
              Export
            </button>
          </div>
          {filterError ? (
            <p className={`mt-3 text-sm ${dark ? "text-[#e91e63]" : "text-rose-600"}`} role="alert">
              {filterError}
            </p>
          ) : null}
          {filterSummary ? (
            <p className={`mt-3 text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Showing profiles for {filterSummary}</p>
          ) : null}
        </div>

        {loadError ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              dark ? "border-[#e91e63]/30 bg-[#e91e63]/10 text-[#e91e63]" : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
            role="alert"
          >
            {loadError}
          </div>
        ) : null}

        {!appliedFrom && !loading ? (
          <div className={`rounded-xl border px-4 py-10 text-center text-sm ${dark ? "border-white/[0.06] text-[#9e9e9e]" : "border-slate-200 text-slate-500"}`}>
            Select date range and filters to view student profiles.
          </div>
        ) : (
          <div className={`overflow-hidden rounded-2xl border ${dark ? "border-white/[0.06]" : "border-slate-200"}`}>
            <div
              className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 text-sm ${
                dark ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e]" : "border-slate-100 bg-slate-50 text-slate-600"
              }`}
            >
              <span>
                {students.length} student{students.length === 1 ? "" : "s"} found
              </span>
            </div>
            <div className="max-w-full overflow-x-auto pb-3">
              <table className="min-w-[2050px] table-auto text-sm">
                <thead className={`text-left ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                  <tr className={headerRowClass}>
                    <th className="min-w-[150px] px-6 py-3 text-sm font-medium lowercase">Registration Number</th>
                    <th className="min-w-[180px] px-6 py-3 text-sm font-medium lowercase">Student Name</th>
                    <th className="min-w-[150px] px-6 py-3 text-sm font-medium lowercase">Class+section</th>
                    <th className="min-w-[100px] px-6 py-3 text-sm font-medium lowercase">Roll #</th>
                    <th className="min-w-[100px] px-6 py-3 text-sm font-medium lowercase">Branch</th>
                    <th className="min-w-[150px] px-6 py-3 text-sm font-medium lowercase">Student CNIC</th>
                    <th className="min-w-[130px] px-6 py-3 text-sm font-medium lowercase">Date of Birth</th>
                    <th className="min-w-[140px] px-6 py-3 text-sm font-medium lowercase">Student Mobile</th>
                    <th className="min-w-[140px] px-6 py-3 text-sm font-medium lowercase">Admission Date</th>
                    <th className="min-w-[170px] px-6 py-3 text-sm font-medium lowercase">Father Name</th>
                    <th className="min-w-[150px] px-6 py-3 text-sm font-medium lowercase">Father CNIC</th>
                    <th className="min-w-[140px] px-6 py-3 text-sm font-medium lowercase">Father Mobile</th>
                    <th className="min-w-[260px] px-6 py-3 text-sm font-medium lowercase">Address</th>
                    <th className="min-w-[120px] px-6 py-3 text-sm font-medium lowercase">Paid Fee</th>
                    <th className="min-w-[120px] px-6 py-3 text-sm font-medium lowercase">Pendding fee</th>
                    <th className="min-w-[120px] px-6 py-3 text-sm font-medium lowercase">Status</th>
                    <th className="min-w-[100px] px-6 py-3 text-right text-sm font-medium lowercase">Profile</th>
                    <th className="min-w-[160px] px-6 py-3 text-right text-sm font-medium lowercase">Login Details</th>
                    <th className="min-w-[90px] px-6 py-3 text-right text-sm font-medium lowercase">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={19} className={`px-4 py-10 text-center ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                        Loading student profiles...
                      </td>
                    </tr>
                  ) : students.length ? (
                    students.map((student) => {
                      const paidFee = Number(student?.admissionFeePaid ? student?.admissionFee || 0 : 0);
                      const totalFee = Number(student?.admissionFee || 0) + Number(student?.annualFee || 0);
                      const pendingFee = Math.max(totalFee - paidFee, 0);
                      const studentName = `${student.firstName || ""} ${student.lastName || ""}`.trim() || "-";
                      const classSection = student.className ? `${student.className} - ${student.section || "A"}` : "-";
                      const branch = deriveBranch(student);
                      return (
                        <tr
                          key={student._id}
                          className={rowClass}
                        >
                          <td className={`whitespace-nowrap px-6 py-3 text-base font-normal ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>{student.admissionNo || "-"}</td>
                          <td className={`whitespace-nowrap px-6 py-3 text-base font-normal ${dark ? "text-white" : "text-slate-800"}`}>{studentName}</td>
                          <td className={`whitespace-nowrap px-6 py-3 ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>{classSection}</td>
                          <td className={`whitespace-nowrap px-6 py-3 text-base font-normal ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>{student.rollNumber || "-"}</td>
                          <td className={`whitespace-nowrap px-6 py-3 ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>{branch}</td>
                          <td className={`whitespace-nowrap px-6 py-3 text-base font-normal ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>{student.cnicBForm || "-"}</td>
                          <td className={`whitespace-nowrap px-6 py-3 ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>{formatDate(student.dateOfBirth)}</td>
                          <td className={`whitespace-nowrap px-6 py-3 text-base font-normal ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>{student.phoneNumber || "-"}</td>
                          <td className={`whitespace-nowrap px-6 py-3 ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>{formatDate(student.admissionDate)}</td>
                          <td className={`whitespace-nowrap px-6 py-3 text-base font-normal ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>{student.fatherName || student.guardianName || "-"}</td>
                          <td className={`whitespace-nowrap px-6 py-3 text-base font-normal ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>{student.fatherCnic || "-"}</td>
                          <td className={`whitespace-nowrap px-6 py-3 text-base font-normal ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>{student.guardianPhone || "-"}</td>
                          <td className={`whitespace-nowrap px-6 py-3 ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>{student.address || "-"}</td>
                          <td className={`whitespace-nowrap px-6 py-3 ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>{formatCurrency(paidFee)}</td>
                          <td className={`whitespace-nowrap px-6 py-3 ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>{formatCurrency(pendingFee)}</td>
                          <td className="whitespace-nowrap px-6 py-3">
                            <StatusBadge status={student.status || "ACTIVE"} dark={dark} />
                          </td>
                          <td className="whitespace-nowrap px-6 py-3 text-right">
                            <button
                              type="button"
                              title="View student profile"
                              onClick={() => {
                                if (onOpenProfile) onOpenProfile(student);
                                else handleViewProfile(student);
                              }}
                              className={`inline-flex items-center rounded-lg border p-1.5 transition ${
                                dark
                                  ? "border-white/[0.06] text-[#9e9e9e]"
                                  : "border-slate-200 text-slate-500"
                              }`}
                            >
                              <IconEye />
                            </button>
                          </td>
                          <td className="whitespace-nowrap px-6 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => onOpenLoginDetails?.(student)}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                                dark
                                  ? "border-[#7c4dff]/30 bg-[#7c4dff]/10 text-[#7c4dff]"
                                  : "border-indigo-200 bg-indigo-50 text-indigo-700"
                              }`}
                            >
                              <IconKey />
                              Login Details
                            </button>
                          </td>
                          <td className="whitespace-nowrap px-6 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => onEditStudent?.(student)}
                              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                                dark ? "text-[#7c4dff]" : "text-indigo-600"
                              }`}
                            >
                              <span className="inline-flex items-center gap-1">
                                <IconEdit />
                                Edit
                              </span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={19} className={`px-4 py-10 text-center ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                        No student profiles found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <StudentProfileOverlay
        student={profileStudent}
        dark={dark}
        loading={profileLoading}
        onClose={() => {
          setProfileStudent(null);
          setProfileLoading(false);
        }}
      />
    </>
  );
}
