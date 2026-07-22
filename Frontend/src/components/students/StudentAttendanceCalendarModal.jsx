import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api/client";
import FormModal from "../ui/FormModal";

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

function normalizeCalendarStatus(status) {
  if (status === "PRESENT" || status === "LATE") return "PRESENT";
  if (status === "ABSENT") return "ABSENT";
  if (status === "LEAVE") return "LEAVE";
  return null;
}

function getDayCircleClass(status, { outside, isToday, dark }) {
  const base =
    "flex h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] items-center justify-center rounded-full text-xl sm:text-2xl font-medium transition";

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
    <span className={`inline-flex items-center gap-2 text-base font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>
      <span className={`h-3 w-3 rounded-full ${className}`} />
      {label}
    </span>
  );
}

function studentFullName(student) {
  return `${student?.firstName || ""} ${student?.lastName || ""}`.trim() || "Student";
}

export default function StudentAttendanceCalendarModal({
  open,
  student,
  onClose,
  dark = false,
  onToggleTheme,
  refreshKey = 0,
}) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !student?._id) return;
    const current = new Date();
    setViewYear(current.getFullYear());
    setViewMonth(current.getMonth());
    setError("");
  }, [open, student?._id]);

  const cells = useMemo(() => buildCalendarCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const today = todayKey();

  const monthTotals = useMemo(() => {
    const totals = { present: 0, absent: 0, onLeave: 0 };
    Object.entries(attendanceMap).forEach(([dateKey, status]) => {
      const [year, month] = dateKey.split("-").map(Number);
      if (year !== viewYear || month !== viewMonth + 1 || !status) return;
      if (status === "PRESENT") totals.present += 1;
      else if (status === "ABSENT") totals.absent += 1;
      else if (status === "LEAVE") totals.onLeave += 1;
    });
    return totals;
  }, [attendanceMap, viewYear, viewMonth]);

  const loadCalendar = useCallback(async () => {
    if (!open || !student?._id) {
      setAttendanceMap({});
      return;
    }

    setLoadingCalendar(true);
    setError("");
    try {
      const { data } = await api.get("/students/attendance-calendar", {
        params: {
          studentId: student._id,
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
  }, [open, student?._id, viewYear, viewMonth, refreshKey]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const shiftMonth = (delta) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const navBtnClass = dark
    ? "flex h-9 w-9 items-center justify-center rounded-xl text-[#9e9e9e] transition hover:bg-white/[0.06] hover:text-white"
    : "flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800";

  const classLabel = student ? `${student.className} ${student.section || "A"}` : "";

  return (
    <FormModal
      open={open}
      title={student ? studentFullName(student) : "Student Attendance"}
      subtitle={student ? `${classLabel} · ${MONTHS[viewMonth]} ${viewYear} attendance` : ""}
      onClose={onClose}
      wide
      dark={dark}
      onToggleTheme={onToggleTheme}
      error={error}
    >
      {open && student ? (
        <div
          className={`w-full rounded-2xl border p-5 shadow-sm ${
            dark ? "border-white/[0.06] bg-[#1a1b26]/50" : "border-slate-200 bg-white"
          }`}
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={`text-2xl font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                {studentFullName(student)}
              </p>
              <p className={`text-lg ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                {classLabel} · {MONTHS[viewMonth]} {viewYear} attendance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className={navBtnClass} onClick={() => shiftMonth(-1)} aria-label="Previous month">
                <IconChevron direction="left" />
              </button>
              <span className={`min-w-[160px] text-center text-lg font-semibold ${dark ? "text-white" : "text-slate-800"}`}>
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
                className={`py-1 text-center text-sm font-semibold uppercase tracking-wide ${
                  dark ? "text-[#9e9e9e]" : "text-slate-400"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {loadingCalendar ? (
            <div className={`py-16 text-center text-lg ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
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
            className={`mt-4 flex flex-col items-center gap-3 border-t pt-3 ${
              dark ? "border-white/[0.06]" : "border-slate-100"
            }`}
          >
            <div className="flex flex-wrap items-center justify-center gap-4">
              <LegendItem label="Present" className={dark ? "bg-[#4caf50]" : "bg-green-500"} dark={dark} />
              <LegendItem label="Absent" className={dark ? "bg-[#ef4444]" : "bg-red-500"} dark={dark} />
              <LegendItem label="On Leave" className={dark ? "bg-[#facc15]" : "bg-yellow-400"} dark={dark} />
            </div>
            <p className={`text-center text-base ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>
              <span className={dark ? "text-[#4caf50]" : "text-green-600"}>Total Present: {monthTotals.present}</span>
              <span className="mx-2">·</span>
              <span className={dark ? "text-[#ef4444]" : "text-red-600"}>Total Absent: {monthTotals.absent}</span>
              <span className="mx-2">·</span>
              <span className={dark ? "text-[#facc15]" : "text-yellow-600"}>Total On Leave: {monthTotals.onLeave}</span>
            </p>
          </div>
        </div>
      ) : null}
    </FormModal>
  );
}
