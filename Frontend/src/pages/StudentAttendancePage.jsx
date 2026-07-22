import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { jsPDF } from "jspdf";
import ModernDatePicker from "../components/ui/ModernDatePicker";
import api from "../services/api/client";

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

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateKey(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (Number.isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return date;
}

function formatDate(value) {
  const date = typeof value === "string" ? parseDateKey(value) : value;
  if (!date) return "-";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function normalizeAttendanceStatus(value) {
  const status = String(value || "").trim().toUpperCase();
  if (status === "PRESENT") return "present";
  if (status === "ABSENT") return "absent";
  if (status === "LEAVE" || status === "ONLEAVE" || status === "ON_LEAVE") return "onleave";
  return null;
}

const statusMeta = {
  present: {
    label: "Present",
    time: "08:00 AM",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    dot: "bg-emerald-500",
    cell: "bg-emerald-500 text-white ring-emerald-500",
  },
  absent: {
    label: "Absent",
    time: "-",
    chip: "bg-rose-50 text-rose-700 ring-rose-100",
    dot: "bg-rose-500",
    cell: "bg-rose-500 text-white ring-rose-500",
  },
  onleave: {
    label: "On Leave",
    time: "-",
    chip: "bg-amber-50 text-amber-700 ring-amber-100",
    dot: "bg-amber-400",
    cell: "bg-amber-400 text-white ring-amber-400",
  },
  norecord: { label: "No Record", time: "-", chip: "bg-slate-50 text-slate-500 ring-slate-100" },
};

function ReportModal({ open, onClose, fromDate, toDate, setFromDate, setToDate, rows, user, dark = false, onDownloadPdf }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-500">Attendance Report</p>
            <h3 className="mt-1 text-xl font-black text-slate-900">{user?.fullName || "Student"}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDownloadPdf}
              className="flex h-10 items-center justify-center gap-2 border border-indigo-600 bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
              Download PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Close report"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid gap-4 border-b border-slate-100 px-6 py-5 sm:grid-cols-2">
          <ModernDatePicker label="From" value={fromDate} onChange={setFromDate} max={toDate || undefined} dark={dark} />
          <ModernDatePicker label="To" value={toDate} onChange={setToDate} min={fromDate || undefined} dark={dark} />
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-6 py-5">
          <div className="overflow-hidden border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((row) => (
                    <tr key={row.key} className="border-t border-slate-100">
                      <td className="px-4 py-4 font-semibold text-slate-800">{row.date}</td>
                      <td className="px-4 py-4 text-slate-600">{row.time}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex min-w-24 items-center justify-center px-3 py-1 text-xs font-bold ring-1 ${row.chip}`}>
                          {row.remarks}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-slate-500">
                      Select a valid from and to date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentAttendancePage({ dark = false }) {
  const user = useSelector((s) => s.auth?.user);
  const studentId = user?._id || user?.id || null;
  const studentName = user?.fullName || user?.name || "Student";
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [reportOpen, setReportOpen] = useState(false);
  const [fromDate, setFromDate] = useState(() => toDateKey(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [toDate, setToDate] = useState(() => toDateKey(today));
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadCalendar = async ({ silent = false } = {}) => {
      if (!studentId) {
        setAttendanceMap({});
        return;
      }

      if (!silent) setLoadingCalendar(true);
      try {
        const { data } = await api.get("/students/attendance-calendar", {
          params: { studentId, year, month: month + 1 },
        });
        if (cancelled) return;

        const nextMap = {};
        (data.data?.days || []).forEach((item) => {
          const status = normalizeAttendanceStatus(item.status);
          if (item.date && status) nextMap[item.date] = status;
        });
        setAttendanceMap(nextMap);
      } catch {
        if (!cancelled && !silent) setAttendanceMap({});
      } finally {
        if (!cancelled) setLoadingCalendar(false);
      }
    };

    loadCalendar({ silent: false });
    const intervalId = window.setInterval(() => loadCalendar({ silent: true }), 4000);
    const onFocus = () => loadCalendar({ silent: true });
    const onVisibility = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [studentId, month, year]);

  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const nextCells = [];
    for (let i = firstDay - 1; i >= 0; i -= 1) {
      nextCells.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = toDateKey(new Date(year, month, day));
      nextCells.push({ day, isCurrentMonth: true, status: attendanceMap[dateKey] });
    }
    let nextMonthDay = 1;
    while (nextCells.length < 42) {
      nextCells.push({ day: nextMonthDay, isCurrentMonth: false });
      nextMonthDay += 1;
    }
    return nextCells;
  }, [attendanceMap, month, year]);

  const reportRows = useMemo(() => {
    const start = parseDateKey(fromDate);
    const end = parseDateKey(toDate);
    if (!start || !end || start > end) return [];

    const rows = [];
    for (let date = start; date <= end; date = addDays(date, 1)) {
      const status = date.getMonth() === month && date.getFullYear() === year ? attendanceMap[toDateKey(date)] || "norecord" : "norecord";
      const meta = statusMeta[status] || statusMeta.norecord;
      rows.push({
        key: toDateKey(date),
        date: formatDate(date),
        time: meta.time,
        remarks: meta.label,
        chip: meta.chip,
      });
    }
    return rows;
  }, [attendanceMap, fromDate, month, toDate, year]);

  const goPrev = () => {
    const date = new Date(year, month - 1, 1);
    setYear(date.getFullYear());
    setMonth(date.getMonth());
  };

  const goNext = () => {
    const date = new Date(year, month + 1, 1);
    setYear(date.getFullYear());
    setMonth(date.getMonth());
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Attendance Report", 14, 16);
    doc.setFontSize(10);
    doc.text(`Student: ${user?.fullName || "Student"}`, 14, 24);
    doc.text(`Class: ${user?.className || "-"} - ${user?.section || "-"}`, 14, 30);
    doc.text(`From: ${formatDate(fromDate)}   To: ${formatDate(toDate)}`, 14, 36);

    let y = 48;
    doc.setFont(undefined, "bold");
    doc.text("Date", 14, y);
    doc.text("Time", 76, y);
    doc.text("Remarks", 122, y);
    doc.setFont(undefined, "normal");
    y += 7;

    reportRows.forEach((row) => {
      if (y > 280) {
        doc.addPage();
        y = 18;
      }
      doc.text(row.date, 14, y);
      doc.text(row.time, 76, y);
      doc.text(row.remarks, 122, y);
      y += 7;
    });

    doc.save(`attendance-report-${fromDate || "from"}-${toDate || "to"}.pdf`);
  };

  return (
    <section className="py-5">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
            <div>
              <h3 className={`text-2xl font-bold ${dark ? "text-slate-900" : "text-slate-900"}`}>
                {studentName}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {user?.className || "-"} {user?.section || "-"} - {MONTHS[month]} {year} attendance
              </p>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={goPrev}
                className="flex h-9 w-9 items-center justify-center text-slate-500 transition hover:text-slate-900"
                aria-label="Previous month"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <polyline points="15 18 9 12 15 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="flex min-w-36 items-center justify-center px-2 text-lg font-bold text-slate-900">
                {MONTHS[month]} {year}
              </div>
              <button
                type="button"
                onClick={goNext}
                className="flex h-9 w-9 items-center justify-center text-slate-500 transition hover:text-slate-900"
                aria-label="Next month"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="flex justify-start lg:justify-end">
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Download Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-x-2 gap-y-2 text-center text-sm text-gray-500 sm:gap-x-4 sm:gap-y-3">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:text-xs">
                {day}
              </div>
            ))}

            {cells.map((cell, index) => {
              const meta = statusMeta[cell.status] || null;
              return (
                <div key={`${cell.day}-${index}`} className="flex h-12 items-center justify-center sm:h-14">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ring-1 transition hover:-translate-y-0.5 sm:h-[52px] sm:w-[52px] sm:text-lg ${
                      cell.isCurrentMonth
                        ? meta
                          ? meta.cell
                          : "bg-slate-200 text-slate-700 ring-slate-200"
                        : "bg-transparent text-slate-300 ring-transparent"
                    }`}
                    title={cell.isCurrentMonth && meta ? meta.label : undefined}
                  >
                    {cell.day}
                  </div>
                </div>
              );
            })}
          </div>

          {loadingCalendar ? <div className="mt-4 text-center text-xs font-semibold text-slate-400">Loading attendance...</div> : null}

          <div className="mt-5 flex flex-col items-center gap-3 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-600">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" /> Present
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500" /> Absent
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-400" /> On Leave
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        fromDate={fromDate}
        toDate={toDate}
        setFromDate={setFromDate}
        setToDate={setToDate}
        rows={reportRows}
        user={user}
        dark={dark}
        onDownloadPdf={downloadPdf}
      />
    </section>
  );
}
