import { useEffect, useMemo, useState } from "react";
import api from "../services/api/client";
import ScrollableSelect from "../components/ui/ScrollableSelect";
import ModernDatePicker from "../components/ui/ModernDatePicker";
import { StatsRowCard } from "../components/dashboard/StatsColumnBoard";
import { CLASS_OPTIONS, SECTION_OPTIONS } from "../constants/classes";
import { withStudentBranchParams, withTeacherBranchParams } from "../utils/branch";
import {
  IconAbsent,
  IconFee,
  IconPresent,
  IconStudents,
  IconTeachers,
} from "../components/icons/DashboardIcons";
import { IconPayroll } from "../components/icons/NavIcons";

const REPORT_TYPES = [
  { id: "overview", label: "General Overview", group: "General", endpoint: "/reports/overview" },
  { id: "students", label: "Students List", group: "Students", endpoint: "/reports/students" },
  { id: "teachers", label: "Teachers List", group: "Teachers", endpoint: "/teachers" },
  { id: "admissions", label: "Admissions", group: "Students", endpoint: "/reports/admissions" },
  { id: "attendance", label: "Attendance", group: "Students", endpoint: "/reports/attendance" },
  { id: "fee-collection", label: "Fee Collection", group: "Finance", endpoint: "/reports/fee-collection" },
  { id: "pending-fees", label: "Pending Fees", group: "Finance", endpoint: "/reports/pending-fees" },
  { id: "refunds", label: "Fee Refunds", group: "Finance", endpoint: "/reports/refunds" },
  { id: "fines", label: "Fines", group: "Finance", endpoint: "/reports/fines" },
  { id: "payroll", label: "Payroll", group: "Finance", endpoint: "/reports/payroll" },
  { id: "school-leaving", label: "Leaving & Character", group: "Students", endpoint: "/school-leaving" },
];

const STATUS_OPTIONS_BY_REPORT = {
  students: [
    { value: "", label: "All Status" },
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
  ],
  admissions: [
    { value: "", label: "All Status" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ],
  attendance: [
    { value: "", label: "All Status" },
    { value: "PRESENT", label: "Present" },
    { value: "ABSENT", label: "Absent" },
    { value: "LATE", label: "Late" },
    { value: "LEAVE", label: "Leave" },
  ],
  refunds: [
    { value: "", label: "All Status" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "PROCESSED", label: "Processed" },
  ],
  fines: [
    { value: "", label: "All Status" },
    { value: "PENDING", label: "Pending" },
    { value: "PAID", label: "Paid" },
    { value: "WAIVED", label: "Waived" },
  ],
  payroll: [
    { value: "", label: "All Status" },
    { value: "PENDING", label: "Pending" },
    { value: "PAID", label: "Paid" },
  ],
  "school-leaving": [
    { value: "", label: "All Status" },
    { value: "PENDING", label: "Pending" },
    { value: "ISSUED", label: "Issued" },
  ],
};

const currency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

const fullName = (person) => {
  if (!person) return "-";
  if (typeof person === "string") return person;
  if (person.fullName) return person.fullName;
  return `${person.firstName || ""} ${person.lastName || ""}`.trim() || "-";
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-GB");
};

const displayPhone = (row) => {
  if (row?.mobile && String(row.mobile).trim()) return String(row.mobile).trim();
  if (row?.phone && String(row.phone).trim()) return String(row.phone).trim();
  return "-";
};

const formatAssignments = (assignments = []) => {
  if (!assignments.length) return "NO ASSIGN";
  const unique = [...new Set(assignments.map((item) => `${item.className || "-"}-${item.section || "A"}`))];
  return unique.join(", ");
};

const rowsToCsv = (columns, rows = []) => {
  const csvRows = [
    columns.map((column) => column.label),
    ...rows.map((row) =>
      columns.map((column) => {
        if (column.csv) return column.csv(row);
        if (column.render) return column.render(row);
        return row[column.key];
      })
    ),
  ];

  return csvRows
    .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
};

const downloadBlob = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

function IconExport({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M12 3v10" />
      <path d="M8 9l4 4 4-4" />
      <path d="M5 15.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5" />
    </svg>
  );
}

function IconRemoved({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="18" y1="8" x2="23" y2="13" />
      <line x1="23" y1="8" x2="18" y2="13" />
    </svg>
  );
}

export default function ReportsPage({ dark = false, branchSection = "Boys" }) {
  const [reportType, setReportType] = useState("overview");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reportMeta = useMemo(() => REPORT_TYPES.find((item) => item.id === reportType) || REPORT_TYPES[0], [reportType]);
  const statusOptions = STATUS_OPTIONS_BY_REPORT[reportType] || null;
  const showClassFilters = !["overview", "payroll", "teachers"].includes(reportType);
  const showDateFilters = !["overview", "students", "teachers", "pending-fees"].includes(reportType);

  const classOptions = useMemo(
    () => [{ value: "", label: "All Classes" }, ...CLASS_OPTIONS.map((value) => ({ value, label: value }))],
    []
  );
  const sectionOptions = useMemo(
    () => [{ value: "", label: "All Sections" }, ...SECTION_OPTIONS.map((value) => ({ value, label: value }))],
    []
  );
  const reportTypeOptions = useMemo(
    () => REPORT_TYPES.map((item) => ({ value: item.id, label: item.label })),
    []
  );

  const loadReport = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      if (classFilter) params.className = classFilter;
      if (sectionFilter) params.section = sectionFilter;
      if (statusFilter) params.status = statusFilter;
      Object.assign(params, withStudentBranchParams({}, branchSection));

      if (reportType === "teachers") {
        const { data: res } = await api.get("/teachers", {
          params: withTeacherBranchParams({ page: 1, limit: 2000 }, branchSection),
        });
        setData({ items: res.data?.items || [] });
        return;
      }

      if (reportType === "school-leaving") {
        const { data: res } = await api.get("/school-leaving", { params: { page: 1, limit: 2000, ...params } });
        setData({ items: res.data?.items || res.data || [] });
        return;
      }

      const { data: res } = await api.get(reportMeta.endpoint, { params });
      setData(res.data);
    } catch (err) {
      setData(null);
      setError(err.response?.data?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setStatusFilter("");
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, branchSection]);

  const studentClassOf = (student) => student?.className || student?.studentId?.className || "";
  const studentSectionOf = (student) => student?.section || student?.studentId?.section || "";

  const matchesClassSection = (studentLike) => {
    if (classFilter && studentClassOf(studentLike) !== classFilter) return false;
    if (sectionFilter && (studentSectionOf(studentLike) || "A") !== sectionFilter) return false;
    return true;
  };

  const overviewCards = useMemo(() => {
    if (!data || reportType !== "overview") return [];
    return [
      { title: "Total Students", value: data.totalStudents ?? 0, tone: "green", icon: IconStudents },
      { title: "Absent Student", value: data.absentStudents ?? 0, tone: "rose", icon: IconAbsent },
      { title: "Present Students", value: data.presentStudents ?? 0, tone: "green", icon: IconPresent },
      { title: "Collected Fee", value: currency(data.feeCollected), tone: "blue", icon: IconFee },
      { title: "Pending Fees", value: currency(data.pendingFees), tone: "orange", icon: IconFee },
      { title: "Fines Pending", value: currency(data.finesPending), tone: "amber", icon: IconFee },
      { title: "Fines Collected", value: currency(data.finesCollected), tone: "sky", icon: IconFee },
      { title: "Removed Students", value: data.removedStudents ?? 0, tone: "rose", icon: IconRemoved },
      { title: "Total Teachers", value: data.totalTeachers ?? 0, tone: "purple", icon: IconTeachers },
      { title: "Present Teachers", value: data.presentTeachers ?? 0, tone: "green", icon: IconPresent },
      { title: "Absent Teachers", value: data.absentTeachers ?? 0, tone: "rose", icon: IconAbsent },
      { title: "Paid Salaries", value: currency(data.paidSalaries), tone: "blue", icon: IconPayroll },
      { title: "Pending Salaries", value: currency(data.pendingSalaries), tone: "orange", icon: IconPayroll },
      { title: "Removed Teachers", value: data.removedTeachers ?? 0, tone: "rose", icon: IconRemoved },
    ];
  }, [data, reportType]);

  const tableConfig = useMemo(() => {
    if (!data || reportType === "overview") return { columns: [], rows: [], summary: null };

    switch (reportType) {
      case "students": {
        const rows = (data.items || [])
          .filter((row) => matchesClassSection(row))
          .map((row) => ({ ...row, _phone: displayPhone(row) }));
        return {
          columns: [
            { key: "admissionNo", label: "Student ID", csv: (r) => r.admissionNo || "-", className: "w-[120px]" },
            {
              key: "rollNumber",
              label: "Roll No.",
              csv: (r) => r.rollNumber || "-",
              render: (r) => r.rollNumber || "-",
              className: "w-[90px]",
            },
            {
              key: "name",
              label: "Student Name",
              csv: (r) => fullName(r),
              render: (r) => fullName(r),
              className: "w-[150px]",
            },
            { key: "fatherName", label: "Father Name", csv: (r) => r.fatherName || "-", className: "w-[140px]" },
            { key: "className", label: "Class", className: "w-[110px]" },
            {
              key: "section",
              label: "Section",
              csv: (r) => r.section || "A",
              render: (r) => r.section || "A",
              className: "w-[90px]",
            },
            { key: "gender", label: "Gender", className: "w-[90px]" },
            { key: "status", label: "Status", className: "w-[100px]" },
            {
              key: "mobile",
              label: "Mobile",
              csv: (r) => r._phone,
              render: (r) => r._phone,
              className: "w-[130px]",
            },
          ],
          rows,
          summary: `Total students: ${rows.length}`,
        };
      }
      case "teachers": {
        const rows = data.items || [];
        return {
          columns: [
            {
              key: "name",
              label: "Teacher Name",
              csv: (r) => fullName(r),
              render: (r) => fullName(r),
            },
            {
              key: "createdAt",
              label: "Created Date",
              csv: (r) => formatDate(r.createdAt),
              render: (r) => formatDate(r.createdAt),
            },
            {
              key: "joiningDate",
              label: "Joining Date",
              csv: (r) => formatDate(r.profile?.joiningDate),
              render: (r) => formatDate(r.profile?.joiningDate),
            },
            {
              key: "qualification",
              label: "Qualification",
              csv: (r) => r.profile?.qualification || "-",
              render: (r) => r.profile?.qualification || "-",
            },
            {
              key: "designation",
              label: "Designation",
              csv: (r) => r.profile?.designation || "-",
              render: (r) => r.profile?.designation || "-",
            },
            {
              key: "assignments",
              label: "Assign Classes/Section",
              csv: (r) => formatAssignments(r.assignedClasses),
              render: (r) => formatAssignments(r.assignedClasses),
            },
            {
              key: "branch",
              label: "Branch",
              csv: (r) => r.profile?.branch || r.assignedClasses?.[0]?.branch || "-",
              render: (r) => r.profile?.branch || r.assignedClasses?.[0]?.branch || "-",
            },
            {
              key: "phone",
              label: "Phone Number",
              csv: (r) => r.profile?.phoneNumber || "-",
              render: (r) => r.profile?.phoneNumber || "-",
            },
            {
              key: "salary",
              label: "Salary",
              csv: (r) => (r.profile?.salary != null ? r.profile.salary : "-"),
              render: (r) => (r.profile?.salary != null ? currency(r.profile.salary) : "-"),
            },
            {
              key: "status",
              label: "Status",
              csv: (r) => (r.isActive === false ? "INACTIVE" : "ACTIVE"),
              render: (r) => (r.isActive === false ? "INACTIVE" : "ACTIVE"),
            },
          ],
          rows,
          summary: `Total teachers: ${rows.length}`,
        };
      }
      case "admissions": {
        const rows = (data.recent || []).filter((row) => matchesClassSection(row.studentId || row));
        return {
          columns: [
            { key: "student", label: "Student", csv: (r) => fullName(r.studentId), render: (r) => fullName(r.studentId) },
            { key: "class", label: "Class", csv: (r) => r.studentId?.className || "-", render: (r) => r.studentId?.className || "-" },
            { key: "section", label: "Section", csv: (r) => r.studentId?.section || "-", render: (r) => r.studentId?.section || "-" },
            { key: "status", label: "Status" },
            { key: "createdAt", label: "Date", csv: (r) => formatDate(r.createdAt), render: (r) => formatDate(r.createdAt) },
          ],
          rows,
          summary: `Total admissions: ${rows.length}`,
        };
      }
      case "attendance": {
        const rows = (data.items || []).filter((row) => matchesClassSection(row));
        return {
          columns: [
            { key: "date", label: "Date", csv: (r) => formatDate(r.date), render: (r) => formatDate(r.date) },
            { key: "student", label: "Student", csv: (r) => fullName(r.studentId), render: (r) => fullName(r.studentId) },
            { key: "className", label: "Class" },
            { key: "section", label: "Section", csv: (r) => r.section || "A", render: (r) => r.section || "A" },
            { key: "status", label: "Status" },
          ],
          rows,
          summary: `Total attendance rows: ${rows.length}`,
        };
      }
      case "fee-collection": {
        const rows = (data.payments || []).filter((row) => matchesClassSection(row.studentId));
        return {
          columns: [
            { key: "receiptNo", label: "Receipt" },
            { key: "student", label: "Student", csv: (r) => fullName(r.studentId), render: (r) => fullName(r.studentId) },
            { key: "class", label: "Class", csv: (r) => r.studentId?.className || "-", render: (r) => r.studentId?.className || "-" },
            { key: "feeType", label: "Fee Type" },
            { key: "netAmount", label: "Amount", csv: (r) => r.netAmount, render: (r) => currency(r.netAmount) },
            { key: "paidAt", label: "Paid At", csv: (r) => formatDate(r.paidAt), render: (r) => formatDate(r.paidAt) },
          ],
          rows,
          summary: `Total collected: ${currency(rows.reduce((sum, row) => sum + Number(row.netAmount || 0), 0))}`,
        };
      }
      case "pending-fees": {
        const rows = (Array.isArray(data) ? data : []).filter((row) => matchesClassSection(row.student));
        return {
          columns: [
            { key: "student", label: "Student", csv: (r) => fullName(r.student), render: (r) => fullName(r.student) },
            { key: "class", label: "Class", csv: (r) => r.student?.className || "-", render: (r) => r.student?.className || "-" },
            { key: "title", label: "Fee" },
            { key: "pendingAmount", label: "Pending", csv: (r) => r.pendingAmount, render: (r) => currency(r.pendingAmount) },
            { key: "status", label: "Status" },
          ],
          rows,
          summary: `Total pending: ${currency(rows.reduce((sum, row) => sum + Number(row.pendingAmount || 0), 0))}`,
        };
      }
      case "refunds": {
        const rows = (data.items || []).filter((row) => matchesClassSection(row.studentId));
        return {
          columns: [
            { key: "refundNo", label: "Refund No" },
            { key: "student", label: "Student", csv: (r) => fullName(r.studentId), render: (r) => fullName(r.studentId) },
            { key: "amount", label: "Amount", csv: (r) => r.amount, render: (r) => currency(r.amount) },
            { key: "status", label: "Status" },
            { key: "createdAt", label: "Date", csv: (r) => formatDate(r.createdAt), render: (r) => formatDate(r.createdAt) },
          ],
          rows,
          summary: `Total rows: ${rows.length}`,
        };
      }
      case "fines": {
        const rows = (data.items || []).filter((row) => matchesClassSection(row.studentId));
        return {
          columns: [
            { key: "student", label: "Student", csv: (r) => fullName(r.studentId), render: (r) => fullName(r.studentId) },
            { key: "fineType", label: "Type" },
            { key: "amount", label: "Amount", csv: (r) => r.amount, render: (r) => currency(r.amount) },
            { key: "status", label: "Status" },
            { key: "createdAt", label: "Date", csv: (r) => formatDate(r.createdAt), render: (r) => formatDate(r.createdAt) },
          ],
          rows,
          summary: `Total rows: ${rows.length}`,
        };
      }
      case "payroll": {
        const rows = data.items || [];
        return {
          columns: [
            { key: "staffName", label: "Staff" },
            {
              key: "month",
              label: "Month",
              csv: (r) => `${r.month || ""} ${r.year || ""}`.trim(),
              render: (r) => `${r.month || ""} ${r.year || ""}`.trim(),
            },
            { key: "netSalary", label: "Net Salary", csv: (r) => r.netSalary, render: (r) => currency(r.netSalary) },
            { key: "status", label: "Status" },
          ],
          rows,
          summary: `Total payroll: ${currency(data.total || rows.reduce((sum, row) => sum + Number(row.netSalary || 0), 0))}`,
        };
      }
      case "school-leaving": {
        const rows = (data.items || []).filter((row) => {
          if (classFilter && row.className !== classFilter) return false;
          if (sectionFilter && (row.section || "A") !== sectionFilter) return false;
          if (statusFilter && row.status !== statusFilter) return false;
          return true;
        });
        return {
          columns: [
            { key: "student", label: "Student", csv: (r) => fullName(r.studentId || r), render: (r) => fullName(r.studentId || r) },
            {
              key: "className",
              label: "Class",
              csv: (r) => r.className || r.studentId?.className || "-",
              render: (r) => r.className || r.studentId?.className || "-",
            },
            { key: "status", label: "Status" },
            {
              key: "issueDate",
              label: "Issue Date",
              csv: (r) => formatDate(r.issueDate || r.createdAt),
              render: (r) => formatDate(r.issueDate || r.createdAt),
            },
          ],
          rows,
          summary: `Total certificates: ${rows.length}`,
        };
      }
      default:
        return { columns: [], rows: [], summary: null };
    }
  }, [data, reportType, classFilter, sectionFilter, statusFilter]);

  const exportCsv = () => {
    if (reportType === "overview") {
      const csv = rowsToCsv(
        [
          { key: "title", label: "Metric" },
          { key: "value", label: "Value" },
        ],
        overviewCards.map((card) => ({ title: card.title, value: card.value }))
      );
      downloadBlob(csv, "general-overview-report.csv", "text/csv;charset=utf-8;");
      return;
    }
    if (!tableConfig.columns.length) return;
    downloadBlob(rowsToCsv(tableConfig.columns, tableConfig.rows), `${reportType}-report.csv`, "text/csv;charset=utf-8;");
  };

  const exportJson = () => {
    const payload =
      reportType === "overview"
        ? overviewCards.map((card) => ({ metric: card.title, value: card.value }))
        : tableConfig.rows;
    downloadBlob(
      JSON.stringify({ reportType, filters: { classFilter, sectionFilter, statusFilter, from, to }, data: payload }, null, 2),
      `${reportType}-report.json`,
      "application/json"
    );
  };

  const canExport = reportType === "overview" ? overviewCards.length > 0 : tableConfig.rows.length > 0;
  const shellCard = dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white";
  const titleClass = dark ? "text-white" : "text-slate-900";
  const mutedClass = dark ? "text-[#9e9e9e]" : "text-slate-500";

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h2 className={`text-[30px] font-bold leading-tight ${titleClass}`}>Reports</h2>
          <p className={`text-sm ${mutedClass}`}>Modern school reports with filters and full-list export.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadReport}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Generate
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!canExport}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-40 ${
              dark
                ? "border-[#7c4dff]/30 bg-[#7c4dff]/10 text-[#7c4dff]"
                : "border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
            }`}
          >
            <IconExport />
            Export CSV
          </button>
          <button
            type="button"
            onClick={exportJson}
            disabled={!canExport}
            className={`rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-40 ${
              dark ? "border-white/[0.08] text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Export JSON
          </button>
        </div>
      </div>

      <div className={`rounded-2xl border p-4 ${shellCard}`}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <ScrollableSelect
            label="Report Type"
            value={reportType}
            options={reportTypeOptions}
            onChange={setReportType}
            dark={dark}
            portal
            menuMaxHeight={280}
          />
          {showClassFilters ? (
            <ScrollableSelect
              label="Class"
              placeholder="All Classes"
              value={classFilter}
              options={classOptions}
              onChange={setClassFilter}
              dark={dark}
              portal
              menuMaxHeight={220}
            />
          ) : null}
          {showClassFilters ? (
            <ScrollableSelect
              label="Section"
              placeholder="All Sections"
              value={sectionFilter}
              options={sectionOptions}
              onChange={setSectionFilter}
              dark={dark}
              portal
              menuMaxHeight={180}
            />
          ) : null}
          {statusOptions ? (
            <ScrollableSelect
              label="Status"
              value={statusFilter}
              options={statusOptions}
              onChange={setStatusFilter}
              dark={dark}
              portal
              menuMaxHeight={200}
            />
          ) : null}
          {showDateFilters ? (
            <ModernDatePicker
              label="From"
              value={from}
              max={to || undefined}
              dark={dark}
              placeholder="Select from date"
              onChange={setFrom}
            />
          ) : null}
          {showDateFilters ? (
            <ModernDatePicker
              label="To"
              value={to}
              min={from || undefined}
              dark={dark}
              placeholder="Select to date"
              onChange={setTo}
            />
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className={`rounded-2xl border p-5 ${shellCard}`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className={`text-xl font-bold ${titleClass}`}>{reportMeta.label}</h3>
          {reportType !== "overview" && tableConfig.summary ? <p className={`text-sm ${mutedClass}`}>{tableConfig.summary}</p> : null}
        </div>

        {loading ? (
          <p className={`py-12 text-center text-sm ${mutedClass}`}>Loading report...</p>
        ) : reportType === "overview" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {overviewCards.map((card) => (
              <StatsRowCard key={card.title} title={card.title} value={card.value} tone={card.tone} icon={card.icon} dark={dark} />
            ))}
          </div>
        ) : (
          <div className={`overflow-hidden rounded-xl border ${dark ? "border-white/[0.06]" : "border-slate-200"}`}>
            <div className="overflow-x-auto">
              <table className={`w-full table-fixed text-left text-sm ${reportType === "students" ? "min-w-[980px]" : "min-w-[1100px]"}`}>
                <thead className={dark ? "bg-[#1a1b26] text-[#9e9e9e]" : "bg-slate-50 text-slate-700"}>
                  <tr>
                    {tableConfig.columns.map((column) => (
                      <th key={column.key} className={`px-3 py-3.5 font-semibold ${column.className || ""}`}>
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableConfig.rows.length ? (
                    tableConfig.rows.map((row, index) => (
                      <tr
                        key={row._id || row.receiptNo || row.refundNo || `${reportType}-${index}`}
                        className={dark ? "border-t border-white/[0.06]" : "border-t border-slate-100"}
                      >
                        {tableConfig.columns.map((column) => (
                          <td key={column.key} className={`px-3 py-3.5 ${dark ? "text-slate-200" : "text-slate-700"} ${column.className || ""}`}>
                            {column.render ? column.render(row) : row[column.key] ?? "-"}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={Math.max(tableConfig.columns.length, 1)} className={`px-5 py-10 text-center ${mutedClass}`}>
                        No records found for selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
