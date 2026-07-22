import { useEffect, useMemo, useState } from "react";
import api from "../../services/api/client";
import ScrollableSelect from "../../components/ui/ScrollableSelect";

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

const toInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const monthRange = (year, monthIndex) => ({
  from: toInputDate(new Date(year, monthIndex, 1)),
  to: toInputDate(new Date(year, monthIndex + 1, 0)),
});

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function StatusBadge({ status }) {
  const tones = {
    PRESENT: "bg-emerald-50 text-emerald-700 border-emerald-100",
    ABSENT: "bg-rose-50 text-rose-700 border-rose-100",
    LATE: "bg-amber-50 text-amber-700 border-amber-100",
    LEAVE: "bg-violet-50 text-violet-700 border-violet-100",
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase ${tones[status] || "bg-slate-50 text-slate-600 border-slate-100"}`}>
      {status || "No Record"}
    </span>
  );
}

export default function TeacherAcademicRecordsPage({ dark = false }) {
  const now = new Date();
  const [teacherName, setTeacherName] = useState("");
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const range = useMemo(() => monthRange(year, monthIndex), [year, monthIndex]);

  const loadAttendance = async () => {
    setLoading(true);
    setError("");
    try {
      const [panelRes, attendanceRes] = await Promise.all([
        api.get("/teachers/my-panel"),
        api.get("/teacher-panel/my-attendance/summary", {
          params: { fromDate: range.from, toDate: range.to },
        }),
      ]);
      setTeacherName(panelRes.data?.data?.teacher?.fullName || "");
      setAttendance(attendanceRes.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load teacher attendance records");
      setAttendance(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [range.from, range.to]);

  const totals = attendance?.totals || { present: 0, absent: 0, late: 0, leave: 0, marked: 0 };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950">Academic Records</h2>
          <p className="text-sm text-slate-500">Month-wise attendance record for this teacher portal.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px]">
            <ScrollableSelect
              label="Month"
              placeholder="Select month"
              value={String(monthIndex)}
              options={MONTHS.map((month, index) => ({
                value: String(index),
                label: month,
              }))}
              onChange={(value) => setMonthIndex(Number(value))}
              dark={dark}
              portal
            />
          </div>
          <input
            type="number"
            className="h-11 w-28 rounded-xl border border-blue-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none"
            value={year}
            onChange={(event) => setYear(Number(event.target.value) || now.getFullYear())}
          />
        </div>
      </div>

      {error ? <p className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-5">
        {[
          ["Teacher", teacherName || "-"],
          ["Marked", totals.marked],
          ["Present", totals.present],
          ["Absent", totals.absent],
          ["Leave", totals.leave],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-black uppercase tracking-[0.08em] text-blue-700">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_14px_34px_rgba(37,99,235,0.08)]">
        <div className="border-b border-blue-100 px-5 py-4">
          <h3 className="text-base font-black text-slate-900">{MONTHS[monthIndex]} {year} Attendance</h3>
          <p className="text-xs font-medium text-slate-500">Present, absent, late and leave records for this month.</p>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-blue-50 text-left text-xs font-black uppercase text-blue-700">
            <tr>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="px-5 py-6 text-slate-500">Loading...</td></tr>
            ) : attendance?.items?.length ? (
              attendance.items.map((item) => (
                <tr key={`${item.date}-${item.status}`} className="border-t border-blue-50">
                  <td className="px-5 py-4 font-bold text-slate-950">{formatDate(item.date)}</td>
                  <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                  <td className="px-5 py-4 text-slate-600">{item.remarks || "-"}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={3} className="px-5 py-6 text-slate-500">No teacher attendance records found for this month.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
