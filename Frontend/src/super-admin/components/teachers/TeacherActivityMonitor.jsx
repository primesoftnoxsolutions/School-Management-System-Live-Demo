import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api/client";
import { CLASS_OPTIONS, SECTION_OPTIONS } from "../../constants/classes";
import { withTeacherBranchParams } from "../../utils/branch";
import ScrollableSelect from "../ui/ScrollableSelect";
import ThemeToggleButton from "../ui/ThemeToggleButton";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayKey() {
  const now = new Date();
  return toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

function buildCalendarCells(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(year, month, 1 - firstDay + i);
    cells.push({
      day: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      outside: date.getMonth() !== month,
      key: toDateKey(date.getFullYear(), date.getMonth(), date.getDate()),
    });
  }
  return cells;
}

function getPrimaryAssignment(assignedClasses = [], branchSection = "") {
  if (!assignedClasses.length) return null;

  const groups = new Map();
  const selectedBranch = branchSection === "Girls" || branchSection === "Boys" ? branchSection : "";
  assignedClasses.forEach((item) => {
    const section = item.section || "A";
    const key = `${item.className}|${section}`;
    if (!groups.has(key)) {
      groups.set(key, { className: item.className, section });
    }
  });

  const sorted = [...groups.values()].sort((a, b) => {
    const classDiff = CLASS_OPTIONS.indexOf(a.className) - CLASS_OPTIONS.indexOf(b.className);
    if (classDiff !== 0) return classDiff;
    return SECTION_OPTIONS.indexOf(a.section) - SECTION_OPTIONS.indexOf(b.section);
  });

  if (!selectedBranch) return sorted[0] || null;

  const branchMatch = sorted.find((item) =>
    assignedClasses.some(
      (row) =>
        row.className === item.className &&
        (row.section || "A") === item.section &&
        (row.branch === "Boys" ? "Boys" : "Girls") === selectedBranch
    )
  );

  return branchMatch || sorted[0] || null;
}

function normalizeCalendarStatus(status) {
  if (status === "PRESENT" || status === "LATE") return "PRESENT";
  if (status === "ABSENT") return "ABSENT";
  if (status === "LEAVE") return "LEAVE";
  return null;
}

function getDayCircleClass(status, { outside, isToday, dark }) {
  const base =
    "flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full text-lg sm:text-xl font-bold transition";

  if (status === "PRESENT") {
    return `${base} ${dark ? "bg-[#4caf50] text-white" : "bg-green-500 text-white"}`;
  }
  if (status === "ABSENT") {
    return `${base} ${dark ? "bg-[#ef4444] text-white" : "bg-red-500 text-white"}`;
  }
  if (status === "LEAVE") {
    return `${base} ${dark ? "bg-[#facc15] text-yellow-950" : "bg-yellow-400 text-yellow-950"}`;
  }

  if (outside) {
    return `${base} ${dark ? "bg-transparent text-white/20" : "bg-transparent text-slate-300"}`;
  }

  if (isToday) {
    return `${base} ${dark ? "bg-[#7c4dff] text-white" : "bg-indigo-500 text-white"}`;
  }

  return `${base} ${dark ? "bg-white/[0.08] text-white" : "bg-slate-200 text-slate-700"}`;
}

function IconSearch() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
    </svg>
  );
}

function IconChevron({ direction = "left" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      {direction === "left" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
      )}
    </svg>
  );
}

function LegendItem({ label, className, dark }) {
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>
      <span className={`h-3 w-3 rounded-full ${className}`} />
      {label}
    </span>
  );
}

export default function TeacherActivityMonitor({ dark = false, onToggleTheme, refreshKey = 0, branchSection = "" }) {
  const now = new Date();
  const [allTeachers, setAllTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState("");
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [error, setError] = useState("");

  const cells = useMemo(() => buildCalendarCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const today = todayKey();
  const selectedTeacher = allTeachers.find((teacher) => teacher._id === teacherId);
  const selectedBranch = branchSection === "Girls" || branchSection === "Boys" ? branchSection : "";

  const teacherMatchesBranch = useCallback(
    (teacher) => {
      const assignments = teacher.assignedClasses || [];
      if (!selectedBranch) return true;
      if (!assignments.length) return true;
      return assignments.some((item) => (item.branch === "Boys" ? "Boys" : "Girls") === selectedBranch);
    },
    [selectedBranch]
  );

  const loadTeachers = useCallback(async () => {
    setLoadingTeachers(true);
    setError("");
    try {
      const { data } = await api.get("/teachers", {
        params: withTeacherBranchParams({ page: 1, limit: 500 }, branchSection),
      });
      setAllTeachers(data.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load teachers");
      setAllTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  }, [branchSection]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const filteredTeachers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allTeachers.filter((teacher) => {
      if (!teacherMatchesBranch(teacher)) return false;
      const assignments = teacher.assignedClasses || [];
      if (className) {
        const hasClass = assignments.some((item) => item.className === className);
        if (!hasClass) return false;
      }
      if (section) {
        const hasSection = assignments.some(
          (item) => (item.section || "A") === section && (!className || item.className === className)
        );
        if (!hasSection) return false;
      }
      if (query) {
        const name = (teacher.fullName || "").toLowerCase();
        const email = (teacher.email || "").toLowerCase();
        if (!name.includes(query) && !email.includes(query)) return false;
      }
      return true;
    });
  }, [allTeachers, className, section, searchQuery, teacherMatchesBranch]);

  const teacherOptions = useMemo(
    () =>
      filteredTeachers.map((teacher) => ({
        value: teacher._id,
        label: teacher.fullName,
      })),
    [filteredTeachers]
  );

  const classOptions = useMemo(
    () => [{ value: "", label: "All Classes" }, ...CLASS_OPTIONS.map((item) => ({ value: item, label: item }))],
    []
  );

  const sectionOptions = useMemo(
    () => [{ value: "", label: "All Sections" }, ...SECTION_OPTIONS.map((item) => ({ value: item, label: `Section ${item}` }))],
    []
  );

  useEffect(() => {
    if (!teacherId) return;
    if (!allTeachers.some((teacher) => teacher._id === teacherId)) {
      setTeacherId("");
    }
  }, [allTeachers, teacherId]);

  useEffect(() => {
    if (!teacherId) return;
    if (!filteredTeachers.some((teacher) => teacher._id === teacherId)) {
      setTeacherId("");
    }
  }, [filteredTeachers, teacherId]);

  const loadCalendar = useCallback(async () => {
    if (!teacherId) {
      setAttendanceMap({});
      return;
    }

    setLoadingCalendar(true);
    setError("");
    try {
      const { data } = await api.get("/teacher-attendance/calendar", {
        params: {
          teacherId,
          year: viewYear,
          month: viewMonth + 1,
        },
      });
      const nextMap = {};
      (data.data?.days || []).forEach((item) => {
        nextMap[item.date] = normalizeCalendarStatus(item.status);
      });
      setAttendanceMap(nextMap);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load attendance calendar");
      setAttendanceMap({});
    } finally {
      setLoadingCalendar(false);
    }
  }, [teacherId, viewYear, viewMonth, refreshKey]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const shiftMonth = (delta) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const handleTeacherChange = (nextTeacherId) => {
    setTeacherId(nextTeacherId);
    const current = new Date();
    setViewYear(current.getFullYear());
    setViewMonth(current.getMonth());
    if (!nextTeacherId) return;

    const teacher = allTeachers.find((item) => item._id === nextTeacherId);
    const primary = getPrimaryAssignment(teacher?.assignedClasses, selectedBranch);
    if (primary) {
      setClassName(primary.className);
      setSection(primary.section);
    } else {
      setClassName("");
      setSection("");
    }
  };

  const navBtnClass = dark
    ? "flex h-9 w-9 items-center justify-center rounded-xl text-[#9e9e9e] transition hover:bg-white/[0.06] hover:text-white"
    : "flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800";

  return (
    <div>
      <div
        className={`flex flex-col gap-3 border-b px-5 py-4 xl:flex-row xl:items-center xl:justify-between ${
          dark ? "border-white/[0.06]" : "border-slate-100"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              dark ? "bg-[#4caf50]/15 text-[#4caf50]" : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </span>
          <h3 className={`text-base font-semibold ${dark ? "text-white" : "text-slate-800"}`}>Teacher Activity Monitor</h3>
          <ThemeToggleButton dark={dark} onToggle={onToggleTheme} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end xl:justify-end">
          <div className="min-w-[160px] flex-1 sm:max-w-[180px]">
            <ScrollableSelect
              label="Teacher"
              placeholder={loadingTeachers ? "Loading..." : "Select teacher"}
              value={teacherId}
              options={teacherOptions}
              onChange={handleTeacherChange}
              dark={dark}
            />
          </div>
          <div className="min-w-[140px] flex-1 sm:max-w-[160px]">
            <ScrollableSelect
              label="Class"
              placeholder="All Classes"
              value={className}
              options={classOptions}
              onChange={setClassName}
              dark={dark}
            />
          </div>
          <div className="min-w-[130px] flex-1 sm:max-w-[150px]">
            <ScrollableSelect
              label="Section"
              placeholder="All Sections"
              value={section}
              options={sectionOptions}
              onChange={setSection}
              dark={dark}
            />
          </div>
          <div className="min-w-[180px] flex-1 sm:max-w-[220px]">
            <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>
              Search
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSearch((prev) => !prev)}
                className={`absolute left-3 top-1/2 z-10 -translate-y-1/2 ${
                  dark ? "text-[#9e9e9e] hover:text-white" : "text-slate-400 hover:text-slate-600"
                }`}
                aria-label="Search teacher"
              >
                <IconSearch />
              </button>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearch(true)}
                placeholder="Type teacher name..."
                className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none ${
                  dark
                    ? "border-white/[0.06] bg-[#1a1b26] text-white placeholder:text-[#9e9e9e] focus:border-[#7c4dff]/40 focus:ring-2 focus:ring-[#7c4dff]/15"
                    : "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-5">
        {error ? (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              dark ? "border-[#e91e63]/30 bg-[#e91e63]/10 text-[#e91e63]" : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {error}
          </div>
        ) : null}

        {!teacherId ? (
          <div
            className={`rounded-2xl border px-4 py-14 text-center text-sm ${
              dark ? "border-white/[0.06] text-[#9e9e9e]" : "border-slate-200 text-slate-500"
            }`}
          >
            Select a teacher to view attendance calendar.
            {filteredTeachers.length === 0 && !loadingTeachers ? (
              <span className="mt-1 block">No teachers match the selected filters.</span>
            ) : null}
          </div>
        ) : (
          <div
            className={`w-full rounded-2xl border p-5 shadow-sm ${
              dark ? "border-white/[0.06] bg-[#1a1b26]/50" : "border-slate-200 bg-white"
            }`}
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className={`text-lg font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                  {selectedTeacher?.fullName || "Teacher"}
                </p>
                <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                  {className && section ? `${className} ${section} · ` : ""}
                  {MONTHS[viewMonth]} {viewYear} attendance
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className={navBtnClass} onClick={() => shiftMonth(-1)} aria-label="Previous month">
                  <IconChevron direction="left" />
                </button>
                <span className={`min-w-[140px] text-center text-sm font-semibold ${dark ? "text-white" : "text-slate-800"}`}>
                  {MONTHS[viewMonth]} {viewYear}
                </span>
                <button type="button" className={navBtnClass} onClick={() => shiftMonth(1)} aria-label="Next month">
                  <IconChevron direction="right" />
                </button>
              </div>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-x-1 gap-y-1">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className={`py-0.5 text-center text-[11px] font-semibold uppercase tracking-wide ${
                    dark ? "text-[#9e9e9e]" : "text-slate-400"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {loadingCalendar ? (
              <div className={`py-16 text-center text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                Loading calendar...
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-x-1 gap-y-1">
                {cells.map((cell) => {
                  const status = attendanceMap[cell.key] || null;
                  const isToday = cell.key === today;
                  return (
                    <div key={cell.key} className="flex items-center justify-center py-0.5">
                      <div
                        className={getDayCircleClass(status, { outside: cell.outside, isToday, dark })}
                        title={
                          status
                            ? `${cell.key}: ${status === "LEAVE" ? "On Leave" : status.charAt(0) + status.slice(1).toLowerCase()}`
                            : cell.key
                        }
                      >
                        {cell.day}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div
              className={`mt-4 flex flex-wrap items-center justify-center gap-4 border-t pt-3 ${
                dark ? "border-white/[0.06]" : "border-slate-100"
              }`}
            >
              <LegendItem
                label="Present"
                className={dark ? "bg-[#4caf50]" : "bg-green-500"}
                dark={dark}
              />
              <LegendItem
                label="Absent"
                className={dark ? "bg-[#ef4444]" : "bg-red-500"}
                dark={dark}
              />
              <LegendItem
                label="On Leave"
                className={dark ? "bg-[#facc15]" : "bg-yellow-400"}
                dark={dark}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
