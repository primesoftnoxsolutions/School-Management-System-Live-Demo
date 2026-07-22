import { useEffect, useMemo, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import api from "../../services/api/client";
import { CLASS_OPTIONS, SECTION_OPTIONS } from "../../constants/classes";
import ModernDatePicker from "../ui/ModernDatePicker";
import ScrollableSelect from "../ui/ScrollableSelect";

const ALL_CLASSES = "ALL_CLASSES";
const ALL_SECTIONS = "ALL_SECTIONS";
const ALL_STATUSES = "ALL_STATUSES";

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

function toLocalDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toLocalDateInputValue(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function filterRows(rows, from, to, className, section) {
  return rows.filter((row) => {
    // Keep removed teachers visible even when their assignment dates fall outside the range
    const isRemovedTeacher = row.teacherStatus === "Removed";
    if (!isRemovedTeacher) {
      const key = toLocalDateKey(row.assignedAt);
      if (key < from || key > to) return false;
    }
    // Specific class/section must match a real assignment — empty className rows are "Not set" placeholders
    if (className && className !== ALL_CLASSES) {
      if (!row.className || row.className !== className) return false;
    }
    if (section && section !== ALL_SECTIONS) {
      if (!row.section || row.section !== section) return false;
    }
    return true;
  });
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

function formatClassLabel(value) {
  if (!value || value === ALL_CLASSES) return "All Classes";
  return value;
}

function formatSectionLabel(value) {
  if (!value || value === ALL_SECTIONS) return "All Sections";
  return `Section ${value}`;
}

function formatStatusLabel(value) {
  if (!value || value === ALL_STATUSES) return "All Status";
  return value;
}

function formatDisplayDate(value) {
  const date = parseLocalDateInput(value);
  if (!date) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSalary(value) {
  if (value === "" || value == null) return "Not set";
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatAssignedClassSection(row) {
  if (!row?.className) return "";
  return `${row.className}-${row.section || "A"}`;
}

function getExportFileBaseName({ from, to, className, section, status }) {
  return `teacher-assignment-history_${from}_${to}_${slugify(formatClassLabel(className))}_${slugify(
    formatSectionLabel(section)
  )}_${slugify(formatStatusLabel(status))}`;
}

function getExportFilterMeta(filters = {}) {
  return [
    ["From Date", filters.from ? formatDisplayDate(filters.from) : "Not set"],
    ["To Date", filters.to ? formatDisplayDate(filters.to) : "Not set"],
    ["Class", formatClassLabel(filters.className)],
    ["Section", formatSectionLabel(filters.section)],
    ["Status", formatStatusLabel(filters.status)],
  ];
}

function getExportRows(teachers) {
  const header = [
    "Teacher Name",
    "Created Date",
    "Joining Date",
    "Qualification",
    "Designation",
    "Assign Classes/Section",
    "Branch",
    "CNIC",
    "Phone Number",
    "Salary",
    "Address",
    "Status",
    "Email ID",
    "Password",
  ];
  const rows = teachers.map((teacher) => [
    teacher.teacherName,
    formatDate(teacher.createdAt),
    formatDate(teacher.joiningDate),
    teacher.qualification,
    teacher.designation,
    teacher.assignedClassSections,
    teacher.branches,
    teacher.cnic,
    teacher.phoneNumber,
    teacher.salary,
    teacher.address,
    teacher.status,
    teacher.email,
    teacher.loginPassword,
  ]);
  return { header, rows };
}

function escapeCsvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function buildCsvBlob(teachers, filters) {
  const meta = getExportFilterMeta(filters);
  const { header, rows } = getExportRows(teachers);
  const lines = [
    [escapeCsvCell("Teacher Assignment History"), ""].join(","),
    ...meta.map(([label, value]) => [escapeCsvCell(label), escapeCsvCell(value)].join(",")),
    "",
    header.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  return new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
}

function createExportDocumentElement(teachers, filters) {
  const meta = getExportFilterMeta(filters);
  const { header, rows } = getExportRows(teachers);
  const wrap = document.createElement("div");
  wrap.style.cssText =
    "font-family:Arial,sans-serif;background:#fff;color:#111;padding:16px;min-width:1100px;box-sizing:border-box;";

  const title = document.createElement("h2");
  title.textContent = "Teacher Assignment History";
  title.style.cssText = "margin:0 0 10px;font-size:18px;font-weight:700;color:#312e81;";
  wrap.appendChild(title);

  const metaRow = document.createElement("div");
  metaRow.style.cssText =
    "display:flex;flex-wrap:wrap;gap:8px 18px;margin:0 0 14px;padding:10px 12px;border:1px solid #c7d2fe;border-radius:10px;background:#eef2ff;font-size:12px;";
  meta.forEach(([label, value]) => {
    const item = document.createElement("div");
    const strong = document.createElement("strong");
    strong.style.color = "#3730a3";
    strong.textContent = `${label}: `;
    const span = document.createElement("span");
    span.textContent = String(value ?? "");
    item.appendChild(strong);
    item.appendChild(span);
    metaRow.appendChild(item);
  });
  wrap.appendChild(metaRow);

  const table = document.createElement("table");
  table.style.cssText = "border-collapse:collapse;font-size:11px;width:100%;";
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  header.forEach((label) => {
    const th = document.createElement("th");
    th.textContent = label;
    th.style.cssText =
      "border:1px solid #cbd5e1;padding:8px;background:#4f46e5;color:#fff;text-align:left;white-space:nowrap;";
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  rows.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.style.background = index % 2 ? "#f8fafc" : "#ffffff";
    row.forEach((cell) => {
      const td = document.createElement("td");
      td.textContent = String(cell ?? "");
      td.style.cssText = "border:1px solid #e2e8f0;padding:7px;vertical-align:top;";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}

async function captureExportNode(teachers, filters) {
  const documentNode = createExportDocumentElement(teachers, filters);
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:0;background:#fff;padding:0;";
  host.appendChild(documentNode);
  document.body.appendChild(host);
  try {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
    const canvas = await html2canvas(documentNode, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    return canvas;
  } finally {
    document.body.removeChild(host);
  }
}

async function buildPdfBlob(teachers, filters) {
  const canvas = await captureExportNode(teachers, filters);
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;
  const ratio = Math.min(usableWidth / canvas.width, usableHeight / canvas.height);
  const renderWidth = canvas.width * ratio;
  const renderHeight = canvas.height * ratio;
  let heightLeft = renderHeight;
  let position = margin;

  pdf.addImage(imgData, "PNG", margin, position, renderWidth, renderHeight);
  heightLeft -= usableHeight;
  while (heightLeft > 0) {
    position = margin - (renderHeight - heightLeft);
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, position, renderWidth, renderHeight);
    heightLeft -= usableHeight;
  }
  return pdf.output("blob");
}

async function buildPngBlob(teachers, filters) {
  const canvas = await captureExportNode(teachers, filters);
  const dataUrl = canvas.toDataURL("image/png");
  const response = await fetch(dataUrl);
  return response.blob();
}

function triggerAnchorDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

async function printTeacherHistory(teachers, filters) {
  const canvas = await captureExportNode(teachers, filters);
  const imgData = canvas.toDataURL("image/png");
  const cssWidth = Math.max(1, Math.round(canvas.width / 2));
  const cssHeight = Math.max(1, Math.round(canvas.height / 2));
  const printWindow = window.open("", "_blank", "width=1200,height=900");
  if (!printWindow) {
    throw new Error("Popup blocked. Allow popups to print the history.");
  }

  printWindow.document.open();
  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Teacher Assignment History Print</title>
    <style>
      @page { margin: 12mm; }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        background: #eef2ff;
        font-family: Arial, sans-serif;
      }
      .toolbar {
        position: sticky;
        top: 0;
        z-index: 2;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 12px 16px;
        background: rgba(255,255,255,0.96);
        border-bottom: 1px solid #dbe3f3;
      }
      .toolbar button {
        border: 1px solid #c7d2fe;
        background: #4f46e5;
        color: #fff;
        border-radius: 999px;
        padding: 8px 14px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }
      .toolbar button.secondary {
        background: #fff;
        color: #3730a3;
      }
      .preview-wrap {
        padding: 18px;
        display: flex;
        justify-content: center;
      }
      .preview-card {
        background: #fff;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
        border-radius: 12px;
        overflow: hidden;
      }
      .preview-card img {
        display: block;
        width: ${cssWidth}px;
        max-width: 100%;
        height: auto;
      }
      @media print {
        html, body { background: #fff; }
        .toolbar { display: none !important; }
        .preview-wrap { padding: 0; }
        .preview-card { box-shadow: none; border-radius: 0; }
        .preview-card img { width: 100%; max-width: none; }
      }
    </style>
  </head>
  <body>
    <div class="toolbar">
      <button type="button" class="secondary" onclick="window.close()">Close</button>
      <button type="button" onclick="window.print()">Print</button>
    </div>
    <div class="preview-wrap">
      <div class="preview-card">
        <img src="${imgData}" alt="Teacher assignment history" width="${cssWidth}" height="${cssHeight}" />
      </div>
    </div>
  </body>
</html>`);
  printWindow.document.close();
}

async function exportTeacherHistory(teachers, filters, format) {
  const baseName = getExportFileBaseName(filters);
  if (format === "print") {
    await printTeacherHistory(teachers, filters);
    return;
  }
  if (format === "pdf") {
    const blob = await buildPdfBlob(teachers, filters);
    triggerAnchorDownload(blob, `${baseName}.pdf`);
    return;
  }
  if (format === "png") {
    const blob = await buildPngBlob(teachers, filters);
    triggerAnchorDownload(blob, `${baseName}.png`);
    return;
  }
  const blob = buildCsvBlob(teachers, filters);
  triggerAnchorDownload(blob, `${baseName}.csv`);
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

function StatusBadge({ status, dark = false }) {
  const active = status === "Active";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? dark
            ? "bg-[#4caf50]/15 text-[#4caf50]"
            : "bg-emerald-50 text-emerald-700"
          : dark
            ? "bg-[#e91e63]/15 text-[#e91e63]"
            : "bg-rose-50 text-rose-700"
      }`}
    >
      {status}
    </span>
  );
}

function getTeacherDetailRows(rows = []) {
  const map = new Map();

  rows.forEach((row) => {
    const key = row.teacherId || `${row.teacherName}|${row.email}`;
    // Teacher-level Removed only when the teacher account is deleted — not when an old assignment was soft-replaced
    const teacherRemoved = row.teacherStatus === "Removed";
    const assignmentActive = row.assignmentStatus === "Active" && !teacherRemoved;
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        teacherId: row.teacherId,
        teacher: {
          _id: row.teacherId,
          id: row.teacherId,
          fullName: row.teacherName || "Not set",
          email: row.email || "",
          isActive: !teacherRemoved && row.teacherStatus === "Active",
          isDeleted: teacherRemoved,
          createdAt: row.teacherCreatedAt || row.createdAt,
          assignedClasses: [],
          profile: row.profile || null,
        },
        teacherName: row.teacherName || "Not set",
        email: row.email || "Not set",
        loginPassword: row.profile?.loginPassword || row.loginPassword || "Not set",
        createdAt: row.teacherCreatedAt || row.createdAt,
        joiningDate: row.profile?.joiningDate || row.joiningDate || row.teacherCreatedAt || row.createdAt,
        qualification: row.profile?.qualification || "Not set",
        designation: row.profile?.designation || "Not set",
        branches: new Set(),
        cnic: row.profile?.cnic || "Not set",
        phoneNumber: row.profile?.phoneNumber || "Not set",
        salary: formatSalary(row.profile?.salary),
        address: row.profile?.address || "Not set",
        status: teacherRemoved ? "Removed" : "Active",
        assignedClassSections: new Set(),
      });
    }

    const entry = map.get(key);
    if (row.profile) {
      entry.teacher.profile = row.profile;
      if (row.profile.loginPassword) entry.loginPassword = row.profile.loginPassword;
      if (row.profile.joiningDate) entry.joiningDate = row.profile.joiningDate;
      if (row.profile.qualification) entry.qualification = row.profile.qualification;
      if (row.profile.designation) entry.designation = row.profile.designation;
      if (row.profile.cnic) entry.cnic = row.profile.cnic;
      if (row.profile.phoneNumber) entry.phoneNumber = row.profile.phoneNumber;
      if (row.profile.salary != null && row.profile.salary !== "") entry.salary = formatSalary(row.profile.salary);
      if (row.profile.address) entry.address = row.profile.address;
    }
    if (row.profile?.cnic) entry.cnic = row.profile.cnic;
    if (row.profile?.phoneNumber) entry.phoneNumber = row.profile.phoneNumber;
    const classSection = formatAssignedClassSection(row);
    // Active teachers: show current assignments. Removed teachers: keep full history.
    if (classSection && (teacherRemoved || assignmentActive)) {
      entry.assignedClassSections.add(classSection);
    }
    if (row.className && (teacherRemoved || assignmentActive)) {
      entry.teacher.assignedClasses.push({
        className: row.className,
        branch: row.profile?.branch || row.branch || "",
        section: row.section || "A",
        subject: row.subject || "Class Teacher",
      });
    }
    if (row.profile?.branch) {
      entry.branches.add(row.profile.branch);
    }
    if (Array.isArray(row.assignedClasses) && row.assignedClasses.length) {
      row.assignedClasses.forEach((assignment) => {
        if (assignment?.branch) entry.branches.add(assignment.branch === "Boys" ? "Boys" : "Girls");
      });
    }
    if (teacherRemoved) {
      entry.status = "Removed";
      entry.teacher.isActive = false;
      entry.teacher.isDeleted = true;
    } else if (entry.status !== "Removed") {
      entry.status = "Active";
      entry.teacher.isActive = true;
      entry.teacher.isDeleted = false;
    }
  });

  return [...map.values()]
    .map((teacher) => ({
      ...teacher,
      assignedClassSections: [...teacher.assignedClassSections].join(", ") || "Not set",
      branches: [...teacher.branches].join(", ") || "Not set",
    }))
    .sort((a, b) => a.teacherName.localeCompare(b.teacherName));
}

export default function TeacherAssignmentHistoryModal({
  dark = false,
  refreshKey = 0,
  onViewProfile,
  onViewDocuments,
  onViewLoginDetails,
  onEditTeacher,
  resolveTeacherForEdit,
  onExportApiChange,
}) {
  const today = toLocalDateInputValue();
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const defaultFrom = toLocalDateInputValue(monthAgo);

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(today);
  const [className, setClassName] = useState(ALL_CLASSES);
  const [section, setSection] = useState(ALL_SECTIONS);
  const [status, setStatus] = useState("Active");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [appliedClass, setAppliedClass] = useState("");
  const [appliedSection, setAppliedSection] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterError, setFilterError] = useState("");
  const [loadError, setLoadError] = useState("");

  const classOptions = useMemo(
    () => [
      { value: ALL_CLASSES, label: "Select All Classes" },
      ...CLASS_OPTIONS.map((item) => ({ value: item, label: item })),
    ],
    []
  );
  const sectionOptions = useMemo(
    () => [
      { value: ALL_SECTIONS, label: "Select All Sections" },
      ...SECTION_OPTIONS.map((item) => ({ value: item, label: `Section ${item}` })),
    ],
    []
  );
  const statusOptions = useMemo(
    () => [
      { value: ALL_STATUSES, label: "Select Status" },
      { value: "Active", label: "Active" },
      { value: "Removed", label: "Removed" },
    ],
    []
  );

  const teacherDetails = useMemo(() => getTeacherDetailRows(rows), [rows]);
  const displayedTeacherDetails = useMemo(
    () => (status && status !== ALL_STATUSES ? teacherDetails.filter((teacher) => teacher.status === status) : teacherDetails),
    [status, teacherDetails]
  );
  const isRemovedView = status === "Removed";
  const tableColSpan = isRemovedView ? 14 : 16;

  useEffect(() => {
    const message = validateFilters(fromDate, toDate);
    if (message) {
      setFilterError(message);
      setRows([]);
      setAppliedFrom("");
      setAppliedTo("");
      return undefined;
    }

    let cancelled = false;
    setFilterError("");
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
    setAppliedClass(className || ALL_CLASSES);
    setAppliedSection(section || ALL_SECTIONS);
    setLoading(true);
    setLoadError("");

    api
      .get("/teachers/assignment-history", {
        params: {
          from: fromDate,
          to: toDate,
          className: className || ALL_CLASSES,
          section: section || ALL_SECTIONS,
          page: 1,
          limit: 200,
        },
      })
      .then(({ data }) => {
        if (cancelled) return;
        const items = filterRows(data.data?.items || [], fromDate, toDate, className || ALL_CLASSES, section || ALL_SECTIONS);
        setRows(items);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err.response?.data?.message || "Failed to load assignment history");
        setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [className, fromDate, refreshKey, section, toDate]);

  useEffect(() => {
    if (!onExportApiChange) return undefined;

    const filters = {
      from: appliedFrom,
      to: appliedTo,
      className: appliedClass || ALL_CLASSES,
      section: appliedSection || ALL_SECTIONS,
      status,
    };

    onExportApiChange({
      canExport: Boolean(appliedFrom && appliedTo && displayedTeacherDetails.length && !loading),
      export: async (format) => {
        if (!appliedFrom || !appliedTo) {
          const message = "Apply filter first before exporting.";
          setFilterError(message);
          throw new Error(message);
        }
        if (!displayedTeacherDetails.length) {
          const message = "No teacher details to export for the selected filters.";
          setFilterError(message);
          throw new Error(message);
        }
        setFilterError("");
        try {
          await exportTeacherHistory(displayedTeacherDetails, filters, format);
        } catch (error) {
          const message = error?.message || "Failed to export teacher assignment history.";
          setFilterError(message);
          throw error;
        }
      },
    });

    return () => onExportApiChange(null);
  }, [
    appliedClass,
    appliedFrom,
    appliedSection,
    appliedTo,
    displayedTeacherDetails,
    loading,
    onExportApiChange,
    status,
  ]);

  const filterSummary =
    appliedFrom && appliedTo
      ? `${formatClassLabel(appliedClass)} - ${formatSectionLabel(appliedSection)} - ${formatStatusLabel(status)} - ${
          appliedFrom === appliedTo
            ? formatDisplayDate(appliedFrom)
            : `${formatDisplayDate(appliedFrom)} to ${formatDisplayDate(appliedTo)}`
        }`
      : "";

  return (
    <div className="space-y-5">
      <div
        className={`rounded-2xl border px-4 py-3 ${
          dark ? "border-white/[0.06] bg-[#1a1b26]/60" : "border-slate-200 bg-slate-50/70"
        }`}
      >
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
            placeholder="Select class"
            value={className}
            options={classOptions}
            onChange={(value) => {
              setClassName(value);
              setFilterError("");
            }}
            dark={dark}
          />
          <ScrollableSelect
            label="Section"
            placeholder="Select section"
            value={section}
            options={sectionOptions}
            onChange={(value) => {
              setSection(value);
              setFilterError("");
            }}
            dark={dark}
          />
          <ScrollableSelect
            label="Status"
            placeholder="Select Status"
            value={status}
            options={statusOptions}
            onChange={(value) => {
              setStatus(value);
              setFilterError("");
            }}
            dark={dark}
          />
        </div>
        {filterError ? (
          <p className={`mt-2 text-sm ${dark ? "text-[#e91e63]" : "text-rose-600"}`} role="alert">
            {filterError}
          </p>
        ) : null}
        {filterSummary ? (
          <p className={`mt-2 text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
            Showing history for {filterSummary}
          </p>
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

      {appliedFrom ? (
        <div className={`overflow-hidden rounded-2xl border ${dark ? "border-white/[0.06]" : "border-slate-200"}`}>
          <div
            className={`border-b px-4 py-3 text-sm ${
              dark ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e]" : "border-slate-100 bg-slate-50 text-slate-600"
            }`}
          >
            {displayedTeacherDetails.length} teacher{displayedTeacherDetails.length === 1 ? "" : "s"} matched the selected filters.
          </div>
          <div className="max-w-full overflow-x-auto pb-3">
            <table className="min-w-[2020px] table-auto text-sm">
              <thead>
                <tr
                  className={`border-b text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                    dark ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e]" : "border-slate-100 bg-slate-50/80 text-slate-500"
                  }`}
                >
                  <th className="min-w-[170px] px-6 py-3">Teacher Name</th>
                  <th className="min-w-[150px] px-6 py-3">Created Date</th>
                  <th className="min-w-[150px] px-6 py-3">Joining Date</th>
                  <th className="min-w-[170px] px-6 py-3">Qualification</th>
                  <th className="min-w-[170px] px-6 py-3">Designation</th>
                  <th className="min-w-[280px] px-4 py-3">Assign Classes/Section</th>
                  <th className="min-w-[120px] px-4 py-3">Branch</th>
                  <th className="min-w-[150px] px-4 py-3">CNIC</th>
                  <th className="min-w-[150px] px-4 py-3">Phone Number</th>
                  <th className="min-w-[130px] px-4 py-3">Salary</th>
                  <th className="min-w-[280px] px-4 py-3">Address</th>
                  <th className="min-w-[130px] px-6 py-3">Status</th>
                  <th className="min-w-[120px] px-6 py-3 text-right">Profile</th>
                  <th className="min-w-[120px] px-6 py-3 text-right">Documents</th>
                  {!isRemovedView ? (
                    <>
                      <th className="min-w-[170px] px-6 py-3 text-right">Login Details</th>
                      <th className="min-w-[100px] px-6 py-3 text-right">Edit</th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={tableColSpan} className={`px-4 py-10 text-center ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                      Loading teacher details...
                    </td>
                  </tr>
                ) : displayedTeacherDetails.length ? (
                  displayedTeacherDetails.map((teacher) => (
                    <tr
                      key={teacher.id}
                      className={
                        dark ? "border-b border-white/[0.06] hover:bg-white/[0.03]" : "border-b border-slate-50 hover:bg-slate-50/50"
                      }
                    >
                      <td className={`whitespace-nowrap px-6 py-3 font-medium ${dark ? "text-white" : "text-slate-800"}`}>
                        {teacher.teacherName}
                      </td>
                      <td className={`whitespace-nowrap px-6 py-3 ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>
                        {formatDate(teacher.createdAt)}
                      </td>
                      <td className={`whitespace-nowrap px-6 py-3 ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>
                        {formatDate(teacher.joiningDate)}
                      </td>
                      <td className={`whitespace-nowrap px-6 py-3 ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>
                        {teacher.qualification}
                      </td>
                      <td className={`whitespace-nowrap px-6 py-3 ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>
                        {teacher.designation}
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>
                        {teacher.assignedClassSections}
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>
                        {teacher.branches}
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>
                        {teacher.cnic}
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>
                        {teacher.phoneNumber}
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>
                        {teacher.salary}
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>
                        {teacher.address}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3">
                        <StatusBadge status={teacher.status} dark={dark} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onViewProfile?.(teacher.teacher)}
                          title="View teacher profile"
                          className={`inline-flex items-center rounded-lg border p-1.5 ${
                            dark
                              ? "border-white/[0.06] text-[#9e9e9e] hover:bg-white/[0.04] hover:text-white"
                              : "border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          }`}
                        >
                          <IconEye />
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 text-right">
                        {Array.isArray(teacher.teacher?.profile?.documents) && teacher.teacher.profile.documents.length ? (
                          <button
                            type="button"
                            onClick={() => onViewDocuments?.(teacher.teacher)}
                            title="View teacher documents"
                            className={`inline-flex items-center rounded-lg border p-1.5 ${
                              dark
                                ? "border-[#7c4dff]/30 bg-[#7c4dff]/10 text-[#7c4dff] hover:bg-[#7c4dff]/15"
                                : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                            }`}
                          >
                            <IconDocument />
                          </button>
                        ) : (
                          <span className={`text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-400"}`}>-</span>
                        )}
                      </td>
                      {!isRemovedView ? (
                        <>
                          <td className="whitespace-nowrap px-6 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => onViewLoginDetails?.(teacher.teacher)}
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
                          </td>
                          <td className="whitespace-nowrap px-6 py-3 text-right">
                            {teacher.status === "Active" ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const resolvedTeacher = resolveTeacherForEdit?.(teacher.teacherId, teacher.teacher) || teacher.teacher;
                                  onEditTeacher?.(resolvedTeacher);
                                }}
                                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                                  dark ? "text-[#7c4dff] hover:bg-white/[0.04]" : "text-indigo-600 hover:bg-indigo-50"
                                }`}
                              >
                                Edit
                              </button>
                            ) : (
                              <span className={`text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-400"}`}>-</span>
                            )}
                          </td>
                        </>
                      ) : null}
                    </tr>
                  ))
              ) : (
                <tr>
                    <td colSpan={tableColSpan} className={`px-4 py-10 text-center ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                      No teachers found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div
          className={`rounded-xl border px-4 py-10 text-center text-sm ${
            dark ? "border-white/[0.06] text-[#9e9e9e]" : "border-slate-200 text-slate-500"
          }`}
        >
          Select date range, class, section, or status to view matching teacher details.
        </div>
      )}
    </div>
  );
}
