import { useEffect, useMemo, useState } from "react";
import api from "../../services/api/client";
import ModernDatePicker from "../../components/ui/ModernDatePicker";
import ScrollableSelect from "../../components/ui/ScrollableSelect";
import { CLASS_OPTIONS, SECTION_OPTIONS } from "../../constants/classes";
import {
  findTimetableSlotsForAssignment,
  normalizeTimeTableForLookup,
} from "../../constants/timeTable";
import { withTeacherBranchParams } from "../../utils/branch";

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function formatDisplayDate(value) {
  const parsed = parseLocalDateInput(value);
  if (!parsed) return value;
  return parsed.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTeacherCreatedDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
}

function safeIndex(list, value) {
  const idx = list.indexOf(value);
  return idx === -1 ? 999 : idx;
}

function groupAssignments(assignedClasses = [], timeTable = null, teacherName = "") {
  const groups = new Map();

  assignedClasses.forEach((item) => {
    const key = `${item.className || ""}|${item.section || "A"}`;
    if (!groups.has(key)) {
      groups.set(key, {
        className: item.className || "-",
        section: item.section || "A",
        subjects: [],
        scheduleBySubject: {},
      });
    }
    const group = groups.get(key);
    if (item.subject && !group.subjects.includes(item.subject)) {
      group.subjects.push(item.subject);
    }

    if (item.subject && timeTable) {
      const slots = findTimetableSlotsForAssignment({
        timeTable,
        className: item.className,
        subject: item.subject,
        teacherName,
      });
      if (slots.length) {
        const existing = group.scheduleBySubject[item.subject] || [];
        const seen = new Set(existing.map((slot) => `${slot.number}|${slot.start}|${slot.end}`));
        slots.forEach((slot) => {
          const slotKey = `${slot.number}|${slot.start}|${slot.end}`;
          if (!seen.has(slotKey)) {
            seen.add(slotKey);
            existing.push(slot);
          }
        });
        group.scheduleBySubject[item.subject] = existing.sort((a, b) => a.number - b.number);
      }
    }
  });

  return [...groups.values()].sort((a, b) => {
    const classDiff = safeIndex(CLASS_OPTIONS, a.className) - safeIndex(CLASS_OPTIONS, b.className);
    if (classDiff !== 0) return classDiff;
    return safeIndex(SECTION_OPTIONS, a.section) - safeIndex(SECTION_OPTIONS, b.section);
  });
}

function getSubjectScheduleItems(row) {
  const subjects = row.subjects?.length ? row.subjects : ["Class Teacher"];
  return subjects.map((subject) => {
    const slots = row.scheduleBySubject?.[subject] || [];
    const times = slots.length
      ? slots.map((slot) => `${slot.start} - ${slot.end}`).join(", ")
      : "No timetable slot matched";
    return { subject, times, hasSchedule: slots.length > 0 };
  });
}

function IconChevron({ open = false }) {
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SubjectScheduleItem({ item, dark = false }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span
        className={`inline-flex rounded-md px-3 py-1.5 text-sm font-semibold ${
          dark ? "bg-[#7c4dff]/15 text-[#d7d2ff]" : "bg-indigo-50 text-indigo-700"
        }`}
      >
        {item.subject}
      </span>
      <span
        className={`text-xs font-medium leading-5 ${
          item.hasSchedule
            ? dark
              ? "text-emerald-300"
              : "text-emerald-700"
            : dark
              ? "text-[#9e9e9e]"
              : "text-slate-500"
        }`}
      >
        {item.times}
      </span>
    </div>
  );
}

function SubjectScheduleCell({ row, dark = false }) {
  const [open, setOpen] = useState(false);
  const items = getSubjectScheduleItems(row);
  const hasMultiple = items.length > 1;

  useEffect(() => {
    setOpen(false);
  }, [row.className, row.section, items.length]);

  if (!hasMultiple) {
    return (
      <div className="mx-auto max-w-[280px]">
        <SubjectScheduleItem item={items[0]} dark={dark} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[300px]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
          dark
            ? "border-white/[0.1] bg-[#1a1b26] text-white hover:bg-[#22243a]"
            : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
        }`}
      >
        <span className="min-w-0 truncate">
          {items[0].subject}
          <span className={`ml-1.5 text-xs font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
            +{items.length - 1} more
          </span>
        </span>
        <IconChevron open={open} />
      </button>

      {open ? (
        <ul className="mt-3 space-y-3">
          {items.map((item) => (
            <li key={item.subject}>
              <SubjectScheduleItem item={item} dark={dark} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function buildAssignmentStats(assignedClasses = []) {
  const classes = new Set();
  const sections = new Set();
  const subjects = new Set();

  assignedClasses.forEach((item) => {
    if (item.className) classes.add(item.className);
    if (item.section) sections.add(item.section);
    if (item.subject) subjects.add(item.subject);
  });

  return {
    classes: classes.size,
    sections: sections.size,
    subjects: subjects.size,
    total: assignedClasses.length,
  };
}

function downloadCsv(filename, rows) {
  const escapeCell = (value) => {
    const text = String(value ?? "");
    if (/[,"\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const csv = rows.map((row) => row.map(escapeCell).join(",")).join("\n");
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

function IconExport() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4 4 4-4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5" />
    </svg>
  );
}

function TeacherAvatar({ name, dark = false, size = "md" }) {
  const dim = size === "lg" ? "h-20 w-20 text-xl" : "h-10 w-10 text-sm";
  const initials =
    (String(name || "")
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?");

  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-full font-semibold ${
        dark ? "bg-[#7c4dff]/20 text-[#d7d2ff]" : "bg-indigo-100 text-indigo-700"
      }`}
    >
      {initials}
    </div>
  );
}

function StatCard({ label, value, tone, dark = false, icon }) {
  const toneMap = {
    blue: {
      light: "bg-blue-600",
      text: dark ? "text-blue-400" : "text-blue-700",
    },
    green: {
      light: "bg-emerald-600",
      text: dark ? "text-emerald-400" : "text-emerald-700",
    },
    purple: {
      light: "bg-violet-600",
      text: dark ? "text-violet-400" : "text-violet-700",
    },
    orange: {
      light: "bg-orange-500",
      text: dark ? "text-orange-400" : "text-orange-600",
    },
  };
  const accent = toneMap[tone] || toneMap.blue;

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-14 w-14 items-center justify-center rounded-full ${accent.light}`}>{icon}</div>
        <div className="min-w-0">
          <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{label}</p>
          <p className={`mt-1 text-3xl font-bold ${accent.text}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function IconUsers() {
  return (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m8-4a4 4 0 11-8 0 4 4 0 018 0zm-4 0a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
      />
    </svg>
  );
}

function IconBook() {
  return (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20H5a2 2 0 01-2-2V6a2 2 0 012-2h7m0 16h7a2 2 0 002-2V6a2 2 0 00-2-2h-7m0 16V4"
      />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function TeacherDetailsCard({ teacher, dark = false, loading = false, timeTable = null }) {
  const assignedClasses = teacher?.assignedClasses || [];
  const stats = buildAssignmentStats(assignedClasses);
  const grouped = groupAssignments(assignedClasses, timeTable, teacher?.fullName || "");

  return (
    <div className={`space-y-5 rounded-2xl border p-5 ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <TeacherAvatar name={teacher?.fullName} dark={dark} />
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${dark ? "text-[#9e9e9e]" : "text-indigo-600"}`}>
              Selected Teacher
            </p>
            <h3 className={`mt-1 text-2xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>
              {teacher?.fullName || "Select a teacher"}
            </h3>
            <p className={`mt-1 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{teacher?.email || "Teacher email"}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
              teacher?.isActive === false
                ? dark
                  ? "bg-white/[0.06] text-[#9e9e9e]"
                  : "bg-slate-100 text-slate-600"
                : dark
                  ? "bg-[#4caf50]/15 text-[#4caf50]"
                  : "bg-emerald-50 text-emerald-700"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${teacher?.isActive === false ? "bg-slate-400" : "bg-emerald-500"}`} />
            {teacher?.isActive === false ? "Inactive" : "Active"}
          </span>
          <span className={`text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
            Created {teacher?.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : "—"}
          </span>
        </div>
      </div>

      {loading ? (
        <div
          className={`rounded-xl border px-4 py-8 text-center text-sm ${
            dark ? "border-white/[0.06] text-[#9e9e9e]" : "border-slate-200 text-slate-500"
          }`}
        >
          Loading teacher details...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Classes Assigned" value={stats.classes} tone="blue" dark={dark} icon={<IconUsers />} />
            <StatCard label="Sections Assigned" value={stats.sections} tone="green" dark={dark} icon={<IconFolder />} />
            <StatCard label="Subjects Assigned" value={stats.subjects} tone="purple" dark={dark} icon={<IconBook />} />
            <StatCard label="Total Assignments" value={stats.total} tone="orange" dark={dark} icon={<IconCheck />} />
          </div>

          <div className={`rounded-2xl border ${dark ? "border-white/[0.06]" : "border-slate-200"}`}>
            <div className={`border-b px-4 py-3 ${dark ? "border-white/[0.06] bg-[#1a1b26]" : "border-slate-100 bg-slate-50"}`}>
              <h4 className={`text-sm font-bold uppercase tracking-[0.12em] ${dark ? "text-white" : "text-slate-800"}`}>
                Assignments Overview
              </h4>
            </div>

            <div className="overflow-x-auto overflow-y-visible">
              <table className="min-w-full text-sm">
                <thead className={dark ? "bg-[#102a5c] text-white" : "bg-[#0b3a8d] text-white"}>
                  <tr>
                    <th className="px-4 py-3 text-center font-semibold">Class</th>
                    <th className="px-4 py-3 text-center font-semibold">Sections</th>
                    <th className="px-4 py-3 text-center font-semibold">Subjects & Timetable</th>
                  </tr>
                </thead>
                <tbody className={dark ? "bg-[#161722]" : "bg-white"}>
                  {grouped.length ? (
                    grouped.map((row, index) => (
                      <tr
                        key={`${row.className}-${row.section}-${index}`}
                        className={dark ? "border-t border-white/[0.06]" : "border-t border-slate-200"}
                      >
                        <td className={`px-4 py-4 align-middle ${dark ? "text-white" : "text-slate-800"}`}>
                          <div className="flex flex-col items-center gap-2 text-center">
                            <span
                              className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${
                                dark ? "bg-blue-500/15 text-blue-300" : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {row.className.replace(/\D+/g, "") || row.className.charAt(0)}
                            </span>
                            <p className="font-semibold">{row.className}</p>
                          </div>
                        </td>
                        <td className={`px-4 py-4 align-middle text-center font-semibold ${dark ? "text-[#e0e0e0]" : "text-slate-700"}`}>
                          {row.className} - {row.section}
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <SubjectScheduleCell row={row} dark={dark} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className={`px-4 py-8 text-center text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                        No class assignments found for this teacher.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function TeacherClassesPage({ dark = false, refreshKey = 0, branchSection = "Boys" }) {
  const [teachers, setTeachers] = useState([]);
  const [timeTable, setTimeTable] = useState(null);
  const [fromDate, setFromDate] = useState(todayKey());
  const [toDate, setToDate] = useState(todayKey());
  const [teacherFilter, setTeacherFilter] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [error, setError] = useState("");
  const [filterError, setFilterError] = useState("");

  const teachersInRange = useMemo(() => {
    const message = validateFilters(fromDate, toDate);
    if (message) return [];

    const from = parseLocalDateInput(fromDate);
    const to = parseLocalDateInput(toDate);
    if (!from || !to) return [];

    return teachers.filter((teacher) => {
      const created = teacher?.createdAt ? new Date(teacher.createdAt) : null;
      if (!created || Number.isNaN(created.getTime())) return false;
      const day = new Date(created.getFullYear(), created.getMonth(), created.getDate());
      return day >= from && day <= to;
    });
  }, [teachers, fromDate, toDate]);

  const teacherOptions = useMemo(
    () =>
      teachersInRange.map((item) => ({
        value: item._id,
        label: item.fullName || "Unnamed Teacher",
      })),
    [teachersInRange]
  );

  const loadTeachers = async () => {
    setLoadingTeachers(true);
    setError("");
    try {
      const branch = branchSection === "Girls" ? "Girls" : "Boys";
      const [teachersRes, timeTableRes] = await Promise.all([
        api.get("/teachers", {
          params: withTeacherBranchParams({ page: 1, limit: 500 }, branchSection),
        }),
        api.get("/timetables", { params: { branch } }).catch(() => ({ data: { data: null } })),
      ]);
      setTeachers(teachersRes.data.data?.items || []);
      setTimeTable(normalizeTimeTableForLookup(timeTableRes.data?.data));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load teachers");
      setTeachers([]);
      setTimeTable(null);
    } finally {
      setLoadingTeachers(false);
    }
  };

  useEffect(() => {
    loadTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, branchSection]);

  // Default-select the first teacher in range; keep selection valid when filters change.
  useEffect(() => {
    if (!teachersInRange.length) {
      setTeacherFilter("");
      setSelectedTeacherId("");
      setSelectedTeacher(null);
      return;
    }

    const current =
      teachersInRange.find((item) => item._id === teacherFilter) ||
      teachersInRange.find((item) => item._id === selectedTeacherId) ||
      teachersInRange[0];

    if (teacherFilter !== current._id) {
      setTeacherFilter(current._id);
    }
    if (selectedTeacherId !== current._id) {
      setSelectedTeacherId(current._id);
    }
    setSelectedTeacher(current);
  }, [teachersInRange, teacherFilter, selectedTeacherId]);

  const pageClass = dark ? "text-white" : "text-slate-900";
  const panelClass = dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white";
  const summary = `${formatDisplayDate(fromDate)} to ${formatDisplayDate(toDate)}`;

  useEffect(() => {
    setFilterError(validateFilters(fromDate, toDate));
  }, [fromDate, toDate]);

  const handleExport = () => {
    if (!selectedTeacher) return;

    const isActive = selectedTeacher.isActive !== false;
    const rows = [
      ["Teacher Name", "Email", "Created", "Class", "Section", "Subjects & Timetable", "Status"],
      ...groupAssignments(selectedTeacher.assignedClasses || [], timeTable, selectedTeacher.fullName || "").map((row) => [
        selectedTeacher.fullName || "-",
        selectedTeacher.email || "-",
        selectedTeacher.createdAt ? formatTeacherCreatedDate(selectedTeacher.createdAt) : "-",
        row.className || "-",
        row.section || "-",
        getSubjectScheduleItems(row)
          .map((item) => `${item.subject}: ${item.times}`)
          .join(" | "),
        isActive ? "Active" : "Inactive",
      ]),
    ];

    const teacherLabel = teacherOptions.find((item) => item.value === teacherFilter)?.label || "teacher";
    const filename = `assigned-classes-${teacherLabel.replace(/\s+/g, "-")}-${fromDate}-to-${toDate}.csv`;
    downloadCsv(filename, rows);
  };

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className={`text-2xl font-bold ${pageClass}`}>Assigned Classes & Sections</h2>
        <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
          Choose a date range and a teacher, then inspect assignment details below.
        </p>
      </div>

      {error ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            dark ? "border-[#e91e63]/30 bg-[#e91e63]/10 text-[#e91e63]" : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div className={`rounded-2xl border p-5 ${panelClass}`}>
        <p className={`mb-3 text-sm font-semibold ${dark ? "text-white" : "text-slate-800"}`}>Filter teacher profiles</p>
        <div className="grid grid-cols-1 items-end gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <ModernDatePicker
            label="From date"
            value={fromDate}
            max={toDate || todayKey()}
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
            max={todayKey()}
            dark={dark}
            onChange={(value) => {
              setToDate(value);
              setFilterError("");
            }}
          />
          <ScrollableSelect
            label="Select Teachers"
            placeholder={loadingTeachers ? "Loading teachers..." : "Select teacher"}
            value={teacherFilter}
            options={teacherOptions}
            onChange={(value) => {
              if (!value) return;
              setTeacherFilter(value);
              setSelectedTeacherId(value);
              setFilterError("");
            }}
            menuMaxHeight={340}
            openUpward={false}
            dark={dark}
          />
          <button
            type="button"
            onClick={handleExport}
            disabled={loadingTeachers || !selectedTeacher}
            className={`h-[42px] w-full shrink-0 rounded-xl px-5 text-sm font-semibold text-white disabled:opacity-60 xl:w-auto ${
              dark ? "bg-[#7c4dff] hover:bg-[#6a3df0]" : "ref-btn-primary"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <IconExport />
              Export
            </span>
          </button>
        </div>
        {filterError ? (
          <p className={`mt-3 text-sm ${dark ? "text-[#e91e63]" : "text-rose-600"}`} role="alert">
            {filterError}
          </p>
        ) : null}
        {summary ? (
          <p className={`mt-3 text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
            Showing teachers for {summary}
            {teacherFilter ? ` · ${teacherOptions.find((item) => item.value === teacherFilter)?.label || ""}` : ""}
          </p>
        ) : null}
      </div>

      {!loadingTeachers && !teachers.length ? (
        <div
          className={`rounded-2xl border px-4 py-10 text-center text-sm ${
            dark ? "border-white/[0.06] text-[#9e9e9e]" : "border-slate-200 text-slate-500"
          }`}
        >
          No teachers available.
        </div>
      ) : loadingTeachers && !teachers.length ? (
        <div
          className={`rounded-2xl border px-4 py-10 text-center text-sm ${
            dark ? "border-white/[0.06] text-[#9e9e9e]" : "border-slate-200 text-slate-500"
          }`}
        >
          Loading teachers...
        </div>
      ) : !teachersInRange.length ? (
        <div
          className={`rounded-2xl border px-4 py-10 text-center text-sm ${
            dark ? "border-white/[0.06] text-[#9e9e9e]" : "border-slate-200 text-slate-500"
          }`}
        >
          No teachers found for the selected filters.
        </div>
      ) : (
        <TeacherDetailsCard
          teacher={selectedTeacher}
          dark={dark}
          loading={loadingTeachers && !teachers.length}
          timeTable={timeTable}
        />
      )}
    </section>
  );
}
