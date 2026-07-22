import { useEffect, useMemo, useState } from "react";
import api from "../services/api/client";
import FormModal from "../components/ui/FormModal";
import ModernDatePicker from "../components/ui/ModernDatePicker";
import ScrollableSelect from "../components/ui/ScrollableSelect";
import { IconAbsent, IconLeave, IconPresent, IconStudents } from "../components/icons/DashboardIcons";
import useTeacherClassOptions from "../hooks/useTeacherClassOptions";

const MONTH_OPTIONS = [
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

const currentYear = new Date().getFullYear();

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const todayKey = () => toDateKey(new Date());

const getMonthRange = (monthIndex) => {
  const start = new Date(currentYear, monthIndex, 1);
  const end = new Date(currentYear, monthIndex + 1, 0);

  return {
    from: toDateKey(start),
    to: toDateKey(end),
    label: `${MONTH_OPTIONS[monthIndex]} ${currentYear}`,
  };
};

const getRangeLabel = (fromDate, toDate) => {
  if (!fromDate || !toDate) return "";

  const from = new Date(fromDate);
  const to = new Date(toDate);

  return `${from.toLocaleDateString([], { month: "short", day: "numeric" })} to ${to.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  })}`;
};

const getFullRangeLabel = (fromDate, toDate) => {
  if (!fromDate || !toDate) return "";

  const options = { day: "2-digit", month: "short", year: "numeric" };
  const from = new Date(fromDate).toLocaleDateString("en-GB", options);
  const to = new Date(toDate).toLocaleDateString("en-GB", options);
  return `${from} - ${to}`;
};

const academicFeatures = [
  {
    title: "View Assigned Monthly Syllabus",
    description: "Review class-wise syllabus coverage for the selected month.",
    icon: "book",
    target: "Monthly Syllabus",
  },
  {
    title: "Create Examination Date Sheets",
    description: "Plan 1st Term, 2nd Term and Final exam schedules.",
    icon: "calendar",
    target: { page: "Paper, Date Sheet & Result", intent: { mode: "DATE_SHEET", openForm: true } },
  },
  {
    title: "Schedule Automatic Roll Slip Delivery",
    description: "Queue roll slips for students and the principal.",
    icon: "send",
    target: "Roll No Slips Management",
  },
  {
    title: "Generate Student Result Cards",
    description: "Create result cards after exams are finalized.",
    icon: "file",
    target: { page: "Paper, Date Sheet & Result", intent: { mode: "RESULT", openForm: true } },
  },
  {
    title: "View Class Timetable",
    description: "Open the timetable for the selected class only.",
    icon: "clock",
    target: "Class Time Table",
  },
  {
    title: "Create Examination Papers",
    description: "Prepare papers for upcoming assessment cycles.",
    icon: "clipboard",
    target: { page: "Paper, Date Sheet & Result", intent: { mode: "PAPER", openForm: true } },
  },
];

const statCards = [
  {
    title: "Total Students",
    key: "totalStudents",
    tone: "violet",
    icon: IconStudents,
    line: "M2 24 C8 12 12 18 16 15 C22 8 24 6 30 13 C35 19 38 9 44 10",
  },
  {
    title: "Present Students",
    key: "presentStudents",
    tone: "green",
    icon: IconPresent,
    line: "M2 23 C7 15 11 29 17 22 C23 15 27 16 31 22 C36 29 39 12 44 16",
  },
  {
    title: "Absent Students",
    key: "absentStudents",
    tone: "rose",
    icon: IconAbsent,
    line: "M2 25 C8 23 8 7 14 11 C19 14 18 23 24 24 C31 25 34 14 38 14 C42 13 42 8 44 8",
  },
  {
    title: "Students on Leave",
    key: "studentsOnLeave",
    tone: "amber",
    icon: IconLeave,
    line: "M2 25 C7 15 12 15 17 23 C22 31 28 28 33 20 C38 11 40 18 44 15",
  },
];

const toneStyles = {
  violet: {
    card: "border-violet-100 bg-white shadow-[0_14px_34px_rgba(124,77,255,0.10)]",
    icon: "bg-violet-500 text-white shadow-[0_14px_28px_rgba(124,77,255,0.28)]",
    soft: "bg-violet-100",
    line: "#7c4dff",
  },
  green: {
    card: "border-emerald-100 bg-emerald-50/30 shadow-[0_14px_34px_rgba(16,185,129,0.10)]",
    icon: "bg-emerald-500 text-white shadow-[0_14px_28px_rgba(16,185,129,0.24)]",
    soft: "bg-emerald-100",
    line: "#10b981",
  },
  rose: {
    card: "border-rose-100 bg-rose-50/25 shadow-[0_14px_34px_rgba(244,63,94,0.10)]",
    icon: "bg-rose-500 text-white shadow-[0_14px_28px_rgba(244,63,94,0.24)]",
    soft: "bg-rose-100",
    line: "#f43f5e",
  },
  amber: {
    card: "border-amber-100 bg-amber-50/35 shadow-[0_14px_34px_rgba(245,158,11,0.10)]",
    icon: "bg-amber-500 text-white shadow-[0_14px_28px_rgba(245,158,11,0.24)]",
    soft: "bg-amber-100",
    line: "#f59e0b",
  },
};

const darkToneStyles = {
  violet: {
    card: "border-white/[0.06] bg-[#161722]",
    icon: "bg-[#7c4dff] text-white shadow-[0_14px_28px_rgba(124,77,255,0.22)]",
    soft: "bg-[#7c4dff]/15",
    line: "#7c4dff",
  },
  green: {
    card: "border-white/[0.06] bg-[#161722]",
    icon: "bg-[#4caf50] text-white shadow-[0_14px_28px_rgba(76,175,80,0.18)]",
    soft: "bg-[#4caf50]/15",
    line: "#4caf50",
  },
  rose: {
    card: "border-white/[0.06] bg-[#161722]",
    icon: "bg-[#e91e63] text-white shadow-[0_14px_28px_rgba(233,30,99,0.18)]",
    soft: "bg-[#e91e63]/15",
    line: "#e91e63",
  },
  amber: {
    card: "border-white/[0.06] bg-[#161722]",
    icon: "bg-[#ff9800] text-white shadow-[0_14px_28px_rgba(255,152,0,0.18)]",
    soft: "bg-[#ff9800]/15",
    line: "#ff9800",
  },
};

function FeatureIcon({ type, dark }) {
  const pathClass = "stroke-current";
  const paths = {
    book: (
      <>
        <path className={pathClass} d="M5 5.5h6a3 3 0 0 1 3 3v9a3 3 0 0 0-3-3H5z" />
        <path className={pathClass} d="M19 5.5h-5a3 3 0 0 0-3 3v9a3 3 0 0 1 3-3h5z" />
      </>
    ),
    calendar: (
      <>
        <rect className={pathClass} x="5" y="6" width="14" height="13" rx="2" />
        <path className={pathClass} d="M8 4v4M16 4v4M5 10h14" />
      </>
    ),
    id: (
      <>
        <rect className={pathClass} x="4.5" y="6" width="15" height="12" rx="2" />
        <path className={pathClass} d="M8 10h3M8 14h5M15 11.5h2M15 14.5h2" />
      </>
    ),
    send: (
      <>
        <path className={pathClass} d="m4 12 15-7-5 15-3-6z" />
        <path className={pathClass} d="m11 14 3-3" />
      </>
    ),
    file: (
      <>
        <path className={pathClass} d="M7 4.5h7l3 3V19a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 19z" />
        <path className={pathClass} d="M14 4.5V8h3M9 12h6M9 15h5" />
      </>
    ),
    clock: (
      <>
        <circle className={pathClass} cx="12" cy="12" r="7" />
        <path className={pathClass} d="M12 8.5V12l2.5 1.5" />
      </>
    ),
    clipboard: (
      <>
        <path className={pathClass} d="M8.5 5.5h7M9 4h6v3H9z" />
        <rect className={pathClass} x="6" y="6" width="12" height="14" rx="2" />
        <path className={pathClass} d="M9 11h6M9 14h6M9 17h4" />
      </>
    ),
  };

  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
        dark ? "bg-[#7c4dff]/15 text-[#7c4dff]" : "bg-violet-50 text-violet-600"
      }`}
    >
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" strokeWidth="1.9" aria-hidden="true">
        {paths[type] || paths.book}
      </svg>
    </span>
  );
}

function CompactLine({ feature, dark, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[52px] w-full items-center justify-between gap-4 border-b text-left transition last:border-b-0 ${
        dark ? "border-white/[0.06]" : "border-slate-100"
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <FeatureIcon type={feature.icon} dark={dark} />
        <span className={`truncate text-sm font-semibold ${dark ? "text-white" : "text-slate-800"}`}>{feature.title}</span>
      </span>
      <span
        className={`shrink-0 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase ${
          dark ? "bg-[#7c4dff]/15 text-[#a78bfa]" : "bg-violet-50 text-violet-600"
        }`}
      >
        Planned
      </span>
    </button>
  );
}

function FilterTileIcon({ type, dark }) {
  return (
    <span
      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${
        dark
          ? "border border-white/[0.06] bg-[#7c4dff]/15 text-[#7c4dff]"
          : "border border-violet-100 bg-violet-50 text-violet-600 shadow-[0_12px_28px_rgba(124,77,255,0.12)]"
      }`}
    >
      {type === "cap" ? (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden="true">
          <rect x="5" y="4.5" width="14" height="16" rx="2.5" />
          <path d="M9 3v4M15 3v4M8.5 11h7M8.5 15h5" />
        </svg>
      ) : (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden="true">
          <rect x="4" y="5" width="16" height="15" rx="2.5" />
          <path d="M8 3v4M16 3v4M4 10h16" />
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01M16 17h.01" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}

function TeacherStatCard({ title, value, tone, icon: Icon, line, dark, tooltip }) {
  const tones = dark ? darkToneStyles[tone] : toneStyles[tone];

  return (
    <article
      className={`relative flex min-h-[104px] items-center gap-4 rounded-2xl border px-5 py-4 ${tones.card}`}
      title={tooltip || undefined}
    >
      <span className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${tones.soft}`}>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones.icon}`}>
          <Icon className="h-5 w-5" />
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[11px] font-bold uppercase ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
          {title}
        </p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <h3 className={`text-3xl font-extrabold leading-none ${dark ? "text-white" : "text-slate-950"}`}>{value}</h3>
          <svg className="h-8 w-16 shrink-0" viewBox="0 0 46 32" fill="none" aria-hidden="true">
            <path d={line} stroke={tones.line} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {tooltip ? (
          <p className={`mt-2 text-[11px] font-semibold ${dark ? "text-[#a78bfa]" : "text-violet-600"}`}>{tooltip}</p>
        ) : null}
      </div>
    </article>
  );
}

function SummaryIllustration({ dark }) {
  return (
    <svg className="mx-auto h-44 w-full max-w-[290px]" viewBox="0 0 320 210" fill="none" aria-hidden="true">
      <ellipse cx="161" cy="181" rx="117" ry="8" fill={dark ? "#262840" : "#ebe7ff"} />
      <circle cx="232" cy="94" r="54" fill={dark ? "#211d3b" : "#efebff"} />
      <path d="M68 155c-12-37 4-58 32-52 22 5 21 31 43 34 20 3 25-16 46-5 26 14 23 42 4 48H83c-8-4-12-12-15-25Z" fill={dark ? "#181929" : "#f7f4ff"} />
      <path d="M76 165c14-40 44-38 62 0" stroke={dark ? "#7c4dff" : "#a78bfa"} strokeWidth="7" strokeLinecap="round" />
      <path d="M101 139c-20-18-13-46-1-57 19 18 12 45 1 57Z" fill={dark ? "#7c4dff" : "#8b5cf6"} opacity=".75" />
      <path d="M91 154c-21-6-30-24-28-41 22 6 30 25 28 41Z" fill={dark ? "#26a69a" : "#c4b5fd"} />
      <rect x="103" y="58" width="133" height="101" rx="12" fill={dark ? "#f8fafc" : "#ffffff"} />
      <path d="M103 71a13 13 0 0 1 13-13h107a13 13 0 0 1 13 13v23H103z" fill={dark ? "#7c4dff" : "#7c4dff"} />
      <path d="M121 56v-13M170 56v-13M218 56v-13" stroke={dark ? "#a78bfa" : "#7c4dff"} strokeWidth="9" strokeLinecap="round" />
      <path d="M121 56v-13M170 56v-13M218 56v-13" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" opacity=".65" />
      {[
        [121, 108],
        [153, 108],
        [185, 108],
        [217, 108],
        [121, 133],
        [153, 133],
        [185, 133],
        [217, 133],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="20" height="14" rx="4" fill={dark ? "#e9d5ff" : "#ddd6fe"} />
      ))}
      <circle cx="241" cy="143" r="39" fill={dark ? "#111827" : "#ffffff"} stroke={dark ? "#7c4dff" : "#8b5cf6"} strokeWidth="8" />
      <path d="M241 120v24l15 9" stroke={dark ? "#a78bfa" : "#7c4dff"} strokeWidth="5" strokeLinecap="round" />
      <path d="M61 91h26M74 78v26" stroke={dark ? "#343650" : "#e9d5ff"} strokeWidth="9" strokeLinecap="round" />
    </svg>
  );
}

const buildSummaryCalendarCells = (range) => {
  const start = new Date(`${range.from}T00:00:00`);
  const year = start.getFullYear();
  const month = start.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const cells = [];

  for (let index = 0; index < 35; index += 1) {
    const date = new Date(year, month, index - startOffset + 1);
    const key = toDateKey(date);
    cells.push({
      key,
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      inRange: key >= range.from && key <= range.to,
    });
  }

  return cells;
};

function SummaryCalendar({ range, totals, dark }) {
  const cells = useMemo(() => buildSummaryCalendarCells(range), [range]);
  const monthLabel = new Date(`${range.from}T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const metricClass = dark ? "border-white/[0.06] bg-white/[0.03]" : "border-blue-100 bg-blue-50/70";

  return (
    <div className="mt-4 space-y-3">
      <div className={`rounded-2xl border p-3 ${dark ? "border-white/[0.06] bg-[#1a1b26]" : "border-blue-100 bg-white"}`}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className={`text-sm font-black ${dark ? "text-white" : "text-blue-950"}`}>{monthLabel}</p>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${dark ? "bg-[#7c4dff]/15 text-[#a78bfa]" : "bg-violet-50 text-violet-600"}`}>
            Selected Range
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase text-slate-400">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <span key={`${day}-${index}`}>{day}</span>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {cells.map((cell) => (
            <span
              key={cell.key}
              className={`flex h-9 items-center justify-center rounded-lg text-xs font-black ${
                cell.inRange
                  ? dark
                    ? "bg-[#7c4dff] text-white"
                    : "bg-violet-600 text-white"
                  : cell.inMonth
                    ? dark
                      ? "bg-white/[0.04] text-slate-300"
                      : "bg-slate-50 text-slate-600"
                    : "text-slate-300 opacity-50"
              }`}
            >
              {cell.day}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${metricClass}`}>
          <p className="text-[10px] font-black uppercase text-emerald-600">Present</p>
          <p className={`text-lg font-black ${dark ? "text-white" : "text-slate-950"}`}>{totals.presentStudents}</p>
        </div>
        <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${metricClass}`}>
          <p className="text-[10px] font-black uppercase text-rose-600">Absent</p>
          <p className={`text-lg font-black ${dark ? "text-white" : "text-slate-950"}`}>{totals.absentStudents}</p>
        </div>
        <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${metricClass}`}>
          <p className="text-[10px] font-black uppercase text-amber-600">Leave</p>
          <p className={`text-lg font-black ${dark ? "text-white" : "text-slate-950"}`}>{totals.studentsOnLeave}</p>
        </div>
      </div>
    </div>
  );
}

export default function TeacherPanelPage({ onNavigate, dark = false }) {
  const [panel, setPanel] = useState(null);
  const { classOptions } = useTeacherClassOptions();
  const [selectedClassId, setSelectedClassId] = useState("");
  const [monthIndex, setMonthIndex] = useState(new Date().getMonth());
  const [fromDate, setFromDate] = useState(todayKey());
  const [toDate, setToDate] = useState(todayKey());
  const [summaryRows, setSummaryRows] = useState([]);
  const [studentRows, setStudentRows] = useState([]);
  const [showDateModal, setShowDateModal] = useState(false);
  const [filterNonce, setFilterNonce] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState("");

  const classSectionOptions = useMemo(() => {
    const seen = new Set();
    return classOptions.filter((option) => {
      const key = `${option.className}__${option.section || "A"}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [classOptions]);

  const selectedClass = useMemo(
    () => classSectionOptions.find((option) => option._id === selectedClassId) || null,
    [classSectionOptions, selectedClassId]
  );

  const monthRange = useMemo(() => getMonthRange(monthIndex), [monthIndex]);
  const summaryRange = fromDate && toDate ? { from: fromDate, to: toDate, label: getRangeLabel(fromDate, toDate) } : monthRange;

  const summaryTotals = useMemo(
    () => {
      const totals = summaryRows.reduce(
        (acc, row) => {
          acc.presentStudents += Number(row.present || 0);
          acc.absentStudents += Number(row.absent || 0);
          acc.studentsOnLeave += Number(row.leave || 0);
          return acc;
        },
        { totalStudents: 0, presentStudents: 0, absentStudents: 0, studentsOnLeave: 0 }
      );

      totals.totalStudents = studentRows.length;
      return totals;
    },
    [studentRows.length, summaryRows]
  );

  const recentAdmissions = useMemo(() => {
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    return studentRows.filter((student) => {
      const stamp = new Date(student.admissionDate || student.createdAt || 0).getTime();
      return Number.isFinite(stamp) && stamp >= cutoff;
    }).length;
  }, [studentRows]);

  const totalStudentsTooltip =
    recentAdmissions > 0 ? `${recentAdmissions} new student${recentAdmissions === 1 ? "" : "s"} added recently` : "";

  useEffect(() => {
    const loadPanel = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/teachers/my-panel");
        setPanel(data?.data || null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load your teacher panel");
        setPanel(null);
      } finally {
        setLoading(false);
      }
    };

    loadPanel();
  }, []);

  useEffect(() => {
    if (!classSectionOptions.length) return;
    if (!selectedClassId) {
      setSelectedClassId(classSectionOptions[0]._id);
      return;
    }
    if (!classSectionOptions.some((option) => option._id === selectedClassId)) {
      setSelectedClassId(classSectionOptions[0]._id);
    }
  }, [classSectionOptions, selectedClassId]);

  useEffect(() => {
    if (!selectedClassId || !selectedClass?.className) {
      setStudentRows([]);
      return;
    }

    const loadStudents = async () => {
      try {
        const { data } = await api.get("/teacher-panel/students", {
          params: {
            className: selectedClass.className,
            section: selectedClass.section || "A",
          },
        });
        setStudentRows(data.data || []);
      } catch {
        setStudentRows([]);
      }
    };

    loadStudents();
  }, [selectedClass, selectedClassId]);

  useEffect(() => {
    if (!selectedClassId || !selectedClass?.className || !summaryRange.from || !summaryRange.to) {
      setSummaryRows([]);
      return;
    }

    const loadSummary = async () => {
      setLoadingSummary(true);
      setError("");
      try {
        const summaryRes = await api.get("/teacher-panel/attendance/summary", {
          params: {
            className: selectedClass.className,
            section: selectedClass.section || "A",
            fromDate: summaryRange.from,
            toDate: summaryRange.to,
          },
        });
        setSummaryRows(summaryRes.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load attendance summary");
        setSummaryRows([]);
      } finally {
        setLoadingSummary(false);
      }
    };

    loadSummary();
  }, [filterNonce, selectedClass, selectedClassId, summaryRange.from, summaryRange.to]);

  if (loading) {
    return <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Loading your panel...</p>;
  }

  if (error && !panel) {
    return <p className={`text-sm ${dark ? "text-[#e91e63]" : "text-rose-600"}`}>{error}</p>;
  }

  const filterInput = dark
    ? "h-[50px] rounded-xl border border-white/[0.08] bg-[#1a1b26] px-4 text-sm font-bold text-white outline-none"
    : "h-[50px] rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none shadow-[0_8px_20px_rgba(15,23,42,0.04)]";
  const filterLabel = dark ? "text-[#9e9e9e]" : "text-slate-800";

  return (
    <section className="space-y-5">
      <div
        className={`rounded-2xl border px-5 py-5 shadow-[0_18px_45px_rgba(124,77,255,0.10)] ${
          dark ? "border-white/[0.06] bg-[#161722]" : "border-white/80 bg-white"
        }`}
      >
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.04fr)_auto_minmax(0,1.44fr)_auto_minmax(0,1.12fr)_auto] xl:items-center">
          <div className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-4">
            <FilterTileIcon type="cap" dark={dark} />
            <div className="min-w-0 flex-1">
              <ScrollableSelect
                label="Class & Section"
                placeholder={classSectionOptions.length ? "Select class" : "No assigned classes"}
                value={selectedClassId}
                options={classSectionOptions.map((option) => ({
                  value: option._id,
                  label: `${option.className} - ${option.section || "A"}`,
                }))}
                onChange={setSelectedClassId}
                dark={dark}
                portal
              />
            </div>
          </div>

          <div className={`hidden h-16 w-px xl:block ${dark ? "bg-white/[0.06]" : "bg-slate-200"}`} />

          <div className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-4">
            <FilterTileIcon type="calendar" dark={dark} />
            <div className="min-w-0 flex-1">
              <label className={`mb-3 block text-xs font-extrabold uppercase leading-4 ${filterLabel}`}>
                Select From & To Date
              </label>
              <button
                type="button"
                onClick={() => setShowDateModal(true)}
                className={`${filterInput} flex w-full items-center justify-between gap-4 text-left transition ${
                  dark ? "text-white hover:border-[#7c4dff]" : "text-slate-900 hover:border-violet-300"
                }`}
              >
                <span className="block truncate">
                  {fromDate && toDate ? getFullRangeLabel(fromDate, toDate) : getFullRangeLabel(monthRange.from, monthRange.to)}
                </span>
                <svg className={`h-5 w-5 shrink-0 ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden="true">
                  <rect x="4" y="5" width="16" height="15" rx="2.5" />
                  <path d="M8 3v4M16 3v4M4 10h16" />
                </svg>
              </button>
            </div>
          </div>

          <div className={`hidden h-16 w-px xl:block ${dark ? "bg-white/[0.06]" : "bg-slate-200"}`} />

          <div className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-4">
            <FilterTileIcon type="calendar" dark={dark} />
            <div className="min-w-0 flex-1">
              <ScrollableSelect
                label="Month"
                placeholder="Select month"
                value={String(monthIndex)}
                options={MONTH_OPTIONS.map((month, index) => ({
                  value: String(index),
                  label: `${month} ${currentYear}`,
                }))}
                onChange={(value) => {
                  const nextIndex = Number(value);
                  setMonthIndex(nextIndex);
                  const nextRange = getMonthRange(nextIndex);
                  setFromDate(nextRange.from);
                  setToDate(nextRange.to);
                }}
                dark={dark}
                portal
              />
            </div>
          </div>

          <button
            type="button"
            className={`flex h-[58px] items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold text-white transition ${
              dark
                ? "bg-[#7c4dff] hover:bg-[#6d3df2]"
                : "bg-violet-600 shadow-[0_14px_28px_rgba(124,77,255,0.24)] hover:bg-violet-700"
            }`}
            onClick={() => setFilterNonce((value) => value + 1)}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m16.5 16.5 4 4" />
            </svg>
            Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <TeacherStatCard
            key={card.key}
            title={card.title}
            value={card.key === "totalStudents" ? studentRows.length : loadingSummary ? "..." : summaryTotals[card.key]}
            tone={card.tone}
            icon={card.icon}
            line={card.line}
            dark={dark}
            tooltip={card.key === "totalStudents" ? totalStudentsTooltip : ""}
          />
        ))}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(360px,1fr)]">
        <div className={`rounded-2xl border p-5 ${dark ? "border-white/[0.06] bg-[#161722]" : "border-white/80 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.05)]"}`}>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className={`flex items-center gap-3 text-sm font-extrabold uppercase ${dark ? "text-white" : "text-slate-800"}`}>
              <span className={`h-6 w-1 rounded-full ${dark ? "bg-[#7c4dff]" : "bg-violet-500"}`} />
              Academic Management
            </h3>
            <button
              type="button"
              className={`rounded-xl px-4 py-2 text-xs font-bold ${
                dark ? "bg-[#7c4dff]/15 text-[#a78bfa]" : "bg-violet-50 text-violet-600"
              }`}
            >
              View All
            </button>
          </div>
          <div className="space-y-0">
            {academicFeatures.map((feature) => (
              <CompactLine
                key={feature.title}
                feature={feature}
                dark={dark}
                onClick={() => {
                  if (feature.target) onNavigate?.(feature.target);
                }}
              />
            ))}
          </div>
        </div>

        <div className={`rounded-2xl border p-5 ${dark ? "border-white/[0.06] bg-[#161722]" : "border-white/80 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.05)]"}`}>
          <h3 className={`flex items-center gap-3 text-sm font-extrabold uppercase ${dark ? "text-white" : "text-slate-800"}`}>
            <span className={`h-6 w-1 rounded-full ${dark ? "bg-[#7c4dff]" : "bg-violet-500"}`} />
            Summary Range
          </h3>
          <div className="mt-5 space-y-3 px-4 text-sm">
            <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-5">
              <span className={`font-bold ${dark ? "text-white" : "text-slate-900"}`}>Class</span>
              <span className={`font-bold ${dark ? "text-[#a78bfa]" : "text-violet-600"}`}>
                {selectedClass ? `${selectedClass.className} - ${selectedClass.section || "A"}` : "Select a class"}
              </span>
            </div>
            <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-5">
              <span className={`font-bold ${dark ? "text-white" : "text-slate-900"}`}>Range</span>
              <span className={`font-bold ${dark ? "text-[#a78bfa]" : "text-violet-600"}`}>
                {fromDate && toDate ? getFullRangeLabel(fromDate, toDate) : getFullRangeLabel(summaryRange.from, summaryRange.to)}
              </span>
            </div>
          </div>
          <div className={`mt-5 h-px ${dark ? "bg-white/[0.06]" : "bg-slate-200"}`} />
          <SummaryCalendar range={summaryRange} totals={summaryTotals} dark={dark} />
        </div>
      </div>

      <FormModal
        open={showDateModal}
        title="Select From & To Date"
        onClose={() => setShowDateModal(false)}
        dark={dark}
        wide
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ModernDatePicker
            label="From Date"
            value={fromDate}
            onChange={setFromDate}
            dark={dark}
            max={toDate || undefined}
          />
          <ModernDatePicker
            label="To Date"
            value={toDate}
            onChange={setToDate}
            dark={dark}
            min={fromDate || undefined}
          />
        </div>

        <div className={`mt-5 rounded-2xl border p-4 ${dark ? "border-white/[0.06] bg-white/[0.02]" : "bg-slate-50"}`}>
          <p className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-800"}`}>Selected Range Preview</p>
          <p className={`mt-1 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>
            {fromDate && toDate ? getRangeLabel(fromDate, toDate) : "Pick both dates to update the dashboard summary."}
          </p>
        </div>
      </FormModal>
    </section>
  );
}
