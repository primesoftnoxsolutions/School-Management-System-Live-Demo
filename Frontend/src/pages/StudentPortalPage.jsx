import { useEffect, useMemo, useState } from "react";
import ModernDatePicker from "../components/ui/ModernDatePicker";
import api from "../services/api/client";
import { resolveStudentPhotoUrl } from "../utils/mediaUrl";

function toDateInputValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toMonthInputValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthBounds(monthValue) {
  if (!monthValue || !/^\d{4}-\d{2}$/.test(monthValue)) return null;
  const [year, month] = monthValue.split("-").map(Number);
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0);
  return { from: toDateInputValue(from), to: toDateInputValue(to) };
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

function formatDueDate(value) {
  if (!value) return "No pending due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No pending due date";
  return `Due Date: ${date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;
}

function parseExamDate(value) {
  if (!value) return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function MoreDots() {
  return (
    <div className="absolute right-5 top-4 flex gap-1 text-slate-400">
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
    </div>
  );
}

function Wave({ color = "#22c55e" }) {
  return (
    <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full opacity-10" viewBox="0 0 500 120" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 95 C95 120 150 70 250 86 C350 102 410 42 500 20 L500 120 L0 120 Z" fill={color} />
      <path d="M0 112 C110 88 175 110 260 78 C355 42 420 80 500 52 L500 120 L0 120 Z" fill={color} opacity="0.55" />
    </svg>
  );
}

function StatShell({ children, border = "border-slate-100", shadow = "shadow-[0_12px_28px_rgba(15,23,42,0.06)]" }) {
  return (
    <div className={`relative min-h-[118px] overflow-hidden rounded-2xl border ${border} bg-white p-4 ${shadow}`}>
      {children}
    </div>
  );
}

function CircleProgress({ value }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="relative grid h-24 w-24 place-items-center rounded-full bg-emerald-50">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="45" fill="none" stroke="#dcfce7" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="#20b86b"
          strokeLinecap="round"
          strokeWidth="12"
          strokeDasharray={`${safe * 2.83} 283`}
        />
      </svg>
      <span className="absolute text-xl font-black text-emerald-700">{safe}%</span>
    </div>
  );
}

function IconBox({ tone, children }) {
  return <div className={`grid h-14 w-14 place-items-center rounded-2xl ${tone}`}>{children}</div>;
}

function AttendanceMiniCard({ label, value, tone, iconTone, icon, trend }) {
  return (
    <div className="relative flex min-h-[98px] items-center gap-4 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.05)]">
      <div className={`grid h-14 w-14 place-items-center rounded-full border border-dashed ${iconTone}`}>
        {icon}
      </div>
      <div>
        <p className="text-base font-bold text-slate-500">{label}</p>
        <p className={`mt-1.5 text-2xl font-black ${tone}`}>{value}</p>
        <p className="mt-1 text-sm font-medium text-slate-500">Selected period</p>
      </div>
      <div className={`ml-auto grid h-12 w-12 place-items-center rounded-full ${trend.bg} ${tone}`}>
        {trend.icon}
      </div>
    </div>
  );
}

function attendanceLabel(percent) {
  if (percent >= 90) return { badge: "Excellent", tip: "Keep it up!" };
  if (percent >= 75) return { badge: "Good", tip: "Stay consistent" };
  if (percent > 0) return { badge: "Needs Focus", tip: "Improve attendance" };
  return { badge: "No Record", tip: "No attendance in period" };
}

export default function StudentPortalPage({ user, dark = false }) {
  const cleanLastName =
    String(user?.lastName || "").trim() === "-" ||
    (user?.lastName && user?.fatherName && String(user.lastName).trim().toLowerCase() === String(user.fatherName).trim().toLowerCase())
      ? ""
      : user?.lastName || "";
  const studentName = `${user?.firstName || ""} ${cleanLastName}`.trim() || user?.fullName || "Student";
  const studentId = user?._id || user?.id || null;
  const photoUrl = resolveStudentPhotoUrl(user?.studentPhotoUrl || user?.photoUrl || user?.profilePhotoUrl);
  const initials =
    studentName
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ST";

  const [fromDate, setFromDate] = useState(() => toDateInputValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [toDate, setToDate] = useState(() => toDateInputValue());
  const [selectedMonth, setSelectedMonth] = useState(() => toMonthInputValue());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attendancePercent, setAttendancePercent] = useState(0);
  const [attendanceBreakdown, setAttendanceBreakdown] = useState({ present: 0, absent: 0, onLeave: 0, late: 0 });
  const [feesDue, setFeesDue] = useState(0);
  const [feesDueDate, setFeesDueDate] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState(0);

  const motivationalQuote = useMemo(() => {
    const quotes = [
      { t: "Education is the most powerful weapon which you can use to change the world.", a: "Nelson Mandela" },
      { t: "The beautiful thing about learning is nobody can take it away from you.", a: "B.B. King" },
      { t: "An investment in knowledge pays the best interest.", a: "Benjamin Franklin" },
      { t: "The expert in anything was once a beginner.", a: "Helen Hayes" },
      { t: "Learning never exhausts the mind.", a: "Leonardo da Vinci" },
    ];
    const key = (user?.admissionNo || user?._id || user?.id || studentName || "").toString();
    let sum = 0;
    for (let index = 0; index < key.length; index += 1) sum += key.charCodeAt(index);
    return quotes[sum % quotes.length];
  }, [user?.admissionNo, user?._id, user?.id, studentName]);

  const attendanceMeta = attendanceLabel(attendancePercent);

  useEffect(() => {
    const bounds = monthBounds(selectedMonth);
    if (!bounds) return;
    setFromDate(bounds.from);
    setToDate(bounds.to);
  }, [selectedMonth]);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      if (!studentId || !fromDate || !toDate) return;
      if (!cancelled) setLoading(true);
      setError("");

      try {
        const [attendanceRes, financeRes, dateSheetRes] = await Promise.all([
          api.get("/students/attendance-calendar", { params: { from: fromDate, to: toDate } }),
          api.get(`/students/${studentId}/finance-summary`),
          api.get("/academic-documents/my", { params: { documentType: "DATE_SHEET" } }),
        ]);

        if (cancelled) return;

        const attendanceData = attendanceRes.data?.data || {};
        const counts = attendanceData.counts || { present: 0, absent: 0, late: 0, leave: 0 };
        setAttendancePercent(Number(attendanceData.attendancePercent || 0));
        setAttendanceBreakdown({
          present: Number(counts.present || 0),
          absent: Number(counts.absent || 0),
          late: Number(counts.late || 0),
          onLeave: Number(counts.leave || 0),
        });

        const financeData = financeRes.data?.data || {};
        const pendingFees = Number(financeData.summary?.pendingFees || 0);
        setFeesDue(pendingFees);
        const nextDue = (financeData.fees || [])
          .filter((row) => Number(row.pendingAmount || 0) > 0 && row.dueDate)
          .map((row) => new Date(row.dueDate))
          .filter((date) => !Number.isNaN(date.getTime()))
          .sort((a, b) => a - b)[0];
        setFeesDueDate(nextDue || null);

        const rangeStart = new Date(`${fromDate}T00:00:00`);
        const rangeEnd = new Date(`${toDate}T23:59:59.999`);
        const rows = Array.isArray(dateSheetRes.data?.data?.payload?.rows) ? dateSheetRes.data.data.payload.rows : [];
        const examsInPeriod = rows.filter((row) => {
          const examDate = parseExamDate(row.date || row.dateLabel);
          if (!examDate) return false;
          return examDate >= rangeStart && examDate <= rangeEnd;
        }).length;
        setUpcomingExams(examsInPeriod);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || "Failed to load student dashboard");
        setAttendancePercent(0);
        setAttendanceBreakdown({ present: 0, absent: 0, late: 0, onLeave: 0 });
        setFeesDue(0);
        setFeesDueDate(null);
        setUpcomingExams(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDashboard();
    const intervalId = window.setInterval(loadDashboard, 5000);
    const onFocus = () => loadDashboard();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [studentId, fromDate, toDate]);

  return (
    <section className={`min-h-[calc(100vh-2rem)] ${dark ? "bg-[#f6f7fb]" : "bg-[#f8fafc]"} py-3`}>
      <div className="mx-auto w-full max-w-[1600px] px-6">
        <div className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-7">
              <div className={`grid h-44 w-44 place-items-center rounded-full ${dark ? "bg-[#0f1724]" : "bg-blue-50"}`}>
                <div className={`grid h-36 w-36 place-items-center overflow-hidden rounded-full text-3xl font-black text-white ${dark ? "bg-[#6366f1]" : "bg-indigo-600"}`}>
                  {photoUrl ? <img src={photoUrl} alt={`${studentName} profile`} className="block h-full w-full object-cover object-[center_38%]" /> : initials}
                </div>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-500">Welcome back,</p>
                <h2 className="mt-1 text-3xl font-black leading-tight text-gray-950">{studentName}</h2>
                <p className="mt-1.5 text-base font-medium text-gray-500">
                  {user?.className || "-"} - {user?.section || "-"}
                </p>
                <p className="mt-2 text-base font-bold text-indigo-600">Student ID: {user?.admissionNo || "-"}</p>
              </div>
            </div>

            <div className="w-full max-w-xl">
              <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 sm:grid-cols-3">
                <div className="min-w-0">
                  <ModernDatePicker label="From" value={fromDate} onChange={setFromDate} max={toDate || undefined} dark={dark} />
                </div>
                <div className="min-w-0">
                  <ModernDatePicker label="To" value={toDate} onChange={setToDate} min={fromDate || undefined} dark={dark} />
                </div>
                <label className="min-w-0 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Month</span>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
              </div>
              <p className="mt-3 text-right text-sm font-semibold leading-6 text-slate-600">
                <span className="text-3xl font-black leading-none text-indigo-200">"</span>
                {motivationalQuote.t}
                <span className="text-3xl font-black leading-none text-indigo-200">"</span>
                <span className="ml-2 text-indigo-600">- {motivationalQuote.a}</span>
              </p>
            </div>
          </div>
        </div>

        {error ? <p className="mb-3 text-sm font-semibold text-rose-600">{error}</p> : null}
        {loading ? <p className="mb-3 text-sm font-semibold text-slate-500">Syncing live student data...</p> : null}

        <div className="mb-3 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <StatShell border="border-emerald-100" shadow="shadow-[0_12px_28px_rgba(16,185,129,0.12)]">
            <Wave color="#22c55e" />
            <div className="relative flex items-center gap-5">
              <CircleProgress value={attendancePercent} />
              <div>
                <p className="text-xl font-black text-emerald-600">Attendance</p>
                <p className="mt-3 text-3xl font-black text-slate-950">{attendancePercent}%</p>
                <p className="mt-3 text-base font-medium text-slate-500">
                  <span className="rounded-lg bg-emerald-100 px-2.5 py-1 font-black text-emerald-600">{attendanceMeta.badge}</span>
                  <span className="ml-2">{attendanceMeta.tip}</span>
                </p>
              </div>
              <div className="ml-auto hidden rounded-2xl bg-emerald-50 p-3 text-emerald-600 ring-1 ring-emerald-100 sm:block">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-5" />
                </svg>
              </div>
            </div>
          </StatShell>

          <StatShell border="border-orange-100" shadow="shadow-[0_12px_28px_rgba(249,115,22,0.12)]">
            <MoreDots />
            <Wave color="#f97316" />
            <div className="relative flex items-center gap-6">
              <IconBox tone="bg-orange-50 text-orange-600">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 7H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5" />
                  <path d="M16 7V5a2 2 0 0 0-2-2H4" />
                  <path d="M18 13h.01" />
                </svg>
              </IconBox>
              <div>
                <p className="text-xl font-black text-orange-600">Fees Due</p>
                <p className="mt-5 text-3xl font-black text-slate-950">{formatMoney(feesDue)}</p>
                <p className="mt-3 text-base font-medium text-slate-500">{formatDueDate(feesDueDate)}</p>
              </div>
            </div>
          </StatShell>

          <StatShell border="border-violet-100" shadow="shadow-[0_12px_28px_rgba(124,58,237,0.12)]">
            <MoreDots />
            <Wave color="#7c3aed" />
            <div className="relative flex items-center gap-6">
              <IconBox tone="bg-violet-100 text-violet-600">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 2v4" />
                  <path d="M16 2v4" />
                  <path d="M3 10h18" />
                  <path d="M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                </svg>
              </IconBox>
              <div>
                <p className="text-xl font-black text-violet-600">Upcoming Exams</p>
                <p className="mt-5 text-3xl font-black text-slate-950">{upcomingExams}</p>
                <p className="mt-3 text-base font-medium text-slate-500">Exams in selected period</p>
              </div>
            </div>
          </StatShell>
        </div>

        <div className="mb-3 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <AttendanceMiniCard
            label="Present"
            value={attendanceBreakdown.present}
            tone="text-emerald-600"
            iconTone="border-emerald-200 bg-emerald-50 text-emerald-600"
            icon={
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                <path d="M4 22v-2a6 6 0 0 1 10.2-4.2" />
                <path d="m17 17 2 2 4-5" />
              </svg>
            }
            trend={{
              bg: "bg-emerald-50",
              icon: (
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m4 16 6-6 4 4 6-7" />
                  <path d="M14 7h6v6" />
                </svg>
              ),
            }}
          />
          <AttendanceMiniCard
            label="Absent"
            value={attendanceBreakdown.absent}
            tone="text-rose-600"
            iconTone="border-rose-200 bg-rose-50 text-rose-600"
            icon={
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                <path d="M4 22v-2a6 6 0 0 1 10.2-4.2" />
                <path d="m18 17 4 4" />
                <path d="m22 17-4 4" />
              </svg>
            }
            trend={{
              bg: "bg-rose-50",
              icon: (
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m4 8 6 6 4-4 6 7" />
                  <path d="M14 17h6v-6" />
                </svg>
              ),
            }}
          />
          <AttendanceMiniCard
            label="On Leave"
            value={attendanceBreakdown.onLeave}
            tone="text-amber-600"
            iconTone="border-amber-200 bg-amber-50 text-amber-600"
            icon={
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v6l4 2" />
              </svg>
            }
            trend={{
              bg: "bg-amber-50",
              icon: (
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 2v4" />
                  <path d="M16 2v4" />
                  <path d="M3 10h18" />
                  <path d="M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2z" />
                </svg>
              ),
            }}
          />
        </div>
      </div>
    </section>
  );
}
