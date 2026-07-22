import { useEffect, useMemo, useState } from "react";
import ScrollableSelect from "../components/ui/ScrollableSelect";
import api from "../services/api/client";
import {
  DEFAULT_BREAK,
  extractSubjectFromCell,
  normalizeTimeTableForLookup,
  toTimeTableClassColumn,
} from "../constants/timeTable";

const DEFAULT_CLASS = "8th";
const DEFAULT_SECTION = "A";
const DEFAULT_CLASS_SECTION = `${DEFAULT_CLASS} - ${DEFAULT_SECTION}`;
const DEFAULT_YEAR = "2026";
const DEFAULT_MONTH = "July";
const DEFAULT_WEEK = `01 - 07 ${DEFAULT_MONTH} ${DEFAULT_YEAR}`;

const VIEW_TYPE_OPTIONS = [
  { value: "Weekly", label: "Weekly" },
  { value: "Daily", label: "Daily" },
];

const CLASS_OPTIONS = ["PG", "Nursery", "Prep", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"].map((value) => ({
  value,
  label: value,
}));

const SECTION_OPTIONS = ["A", "B", "C", "D"].map((value) => ({ value, label: value }));
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
].map((value) => ({ value, label: value }));
const DATE_OPTIONS = Array.from({ length: 31 }, (_, index) => {
  const day = String(index + 1).padStart(2, "0");
  return { value: day, label: day };
});
const getDayForDate = (date) => {
  const numericDate = Number(date);
  if (!Number.isFinite(numericDate) || numericDate < 1) return WEEK_DAYS[0].day;
  return WEEK_DAYS[(numericDate - 1) % WEEK_DAYS.length]?.day || WEEK_DAYS[0].day;
};
const CLASS_SECTION_OPTIONS = CLASS_OPTIONS.flatMap((classItem) =>
  SECTION_OPTIONS.map((sectionItem) => {
    const value = `${classItem.value} - ${sectionItem.value}`;
    return { value, label: value };
  })
);

const YEAR_OPTIONS = Array.from({ length: 1001 }, (_, index) => {
  const year = 3000 - index;
  return { value: String(year), label: String(year) };
});

const buildWeekOptions = (month, year) => [
  { value: `01 - 07 ${month} ${year}`, label: `01 - 07 ${month} ${year}` },
  { value: `07 - 14 ${month} ${year}`, label: `07 - 14 ${month} ${year}` },
  { value: `08 - 21 ${month} ${year}`, label: `08 - 21 ${month} ${year}` },
  { value: `21 - 28 ${month} ${year}`, label: `21 - 28 ${month} ${year}` },
  { value: `28 - 31 ${month} ${year}`, label: `28 - 31 ${month} ${year}` },
];

const WEEK_DAYS = [
  { day: "Monday", date: "20 May" },
  { day: "Tuesday", date: "21 May" },
  { day: "Wednesday", date: "22 May" },
  { day: "Thursday", date: "23 May" },
  { day: "Friday", date: "24 May" },
  { day: "Saturday", date: "25 May" },
  { day: "Sunday", date: "26 May" },
];

const TONES = ["green", "blue", "orange", "purple", "pink", "sky", "violet"];

function parseTeacherFromCell(cellValue, fallbackTeacher = "") {
  const raw = String(cellValue || "").trim();
  const match = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(raw);
  if (match) return { teacher: match[1].trim() || fallbackTeacher, subject: match[2].trim() };
  return { teacher: fallbackTeacher, subject: extractSubjectFromCell(raw) || raw };
}

function buildPeriodsFromCampus(timeTable, classColumn, classSection) {
  if (!timeTable?.periods?.length || !classColumn) return [];

  const breakAfter = Number(timeTable.breakTime?.afterPeriod || DEFAULT_BREAK.afterPeriod);
  const breakLabel = timeTable.breakTime?.label || DEFAULT_BREAK.label;
  const breakStart = timeTable.breakTime?.start || DEFAULT_BREAK.start;
  const breakEnd = timeTable.breakTime?.end || DEFAULT_BREAK.end;
  const classTeacher = String(timeTable.classTeachers?.[classColumn] || "").trim();
  const rows = [];

  timeTable.periods.forEach((period, index) => {
    if (Number(period.number) === Number(breakAfter) + 1) {
      rows.push({
        number: "break",
        time: `${breakStart} - ${breakEnd}`,
        label: breakLabel,
      });
    }

    const cellValue = String(period.assignments?.[classColumn] || "").trim();
    const parsed = parseTeacherFromCell(cellValue, classTeacher);
    const tone = TONES[index % TONES.length];
    const cell = [parsed.subject || "", parsed.teacher || classTeacher || "", classSection, tone];

    rows.push({
      number: period.number,
      time: `${period.start} - ${period.end}`,
      cells: WEEK_DAYS.map(() => [...cell]),
    });
  });

  return rows;
}

const normalizeCell = (cell) => {
  if (!Array.isArray(cell)) return ["", "", DEFAULT_CLASS_SECTION, "blue"];
  const [subject = "", teacher = "", classSection = DEFAULT_CLASS_SECTION, tone = "blue"] = cell;
  return [subject, teacher, classSection, tone];
};

const normalizeRows = (rows) =>
  rows.map((row) => ({
    ...row,
    cells: Array.isArray(row.cells) ? row.cells.map((cell) => normalizeCell(cell)) : undefined,
  }));

const normalizeOffEntries = (entries) =>
  Array.isArray(entries)
    ? entries
        .map((entry) => ({
          day: entry?.day || "",
          date: entry?.date || "",
          month: entry?.month || DEFAULT_MONTH,
          year: entry?.year || DEFAULT_YEAR,
        }))
        .filter((entry) => entry.day)
    : [];

const TIMETABLE_ROWS = [
  { number: 1, time: "7:45 - 8:30", label: "Assembly", allStudents: true, color: "violet" },
  {
    number: 2,
    time: "8:30 - 9:05",
    cells: [
      ["English", "Mr. Ali", DEFAULT_CLASS_SECTION, "green"],
      ["Mathematics", "Mr. Imran", DEFAULT_CLASS_SECTION, "blue"],
      ["English", "Mr. Ali", DEFAULT_CLASS_SECTION, "green"],
      ["Mathematics", "Mr. Imran", DEFAULT_CLASS_SECTION, "blue"],
      ["Pakistan Studies", "Mr. Hamid", DEFAULT_CLASS_SECTION, "green"],
      ["Sports", "Mr. Danish", DEFAULT_CLASS_SECTION, "pink"],
      ["English", "Mr. Ali", DEFAULT_CLASS_SECTION, "green"],
    ],
  },
  {
    number: 3,
    time: "9:05 - 9:40",
    cells: [
      ["Mathematics", "Mr. Imran", DEFAULT_CLASS_SECTION, "blue"],
      ["Chemistry", "Mr. Naveed", DEFAULT_CLASS_SECTION, "orange"],
      ["Physics", "Mr. Bilal", DEFAULT_CLASS_SECTION, "orange"],
      ["English", "Mr. Ali", DEFAULT_CLASS_SECTION, "green"],
      ["Chemistry", "Mr. Naveed", DEFAULT_CLASS_SECTION, "orange"],
      ["Library", "Mr. Usman", DEFAULT_CLASS_SECTION, "blue"],
      ["Mathematics", "Mr. Imran", DEFAULT_CLASS_SECTION, "blue"],
    ],
  },
  {
    number: 4,
    time: "9:40 - 10:15",
    cells: [
      ["Urdu", "Mr. Aslam", DEFAULT_CLASS_SECTION, "purple"],
      ["Urdu", "Mr. Aslam", DEFAULT_CLASS_SECTION, "purple"],
      ["Chemistry", "Mr. Naveed", DEFAULT_CLASS_SECTION, "orange"],
      ["Islamiat", "Mr. Hamid", DEFAULT_CLASS_SECTION, "green"],
      ["Mathematics", "Mr. Imran", DEFAULT_CLASS_SECTION, "blue"],
      ["Pakistan Studies", "Mr. Hamid", DEFAULT_CLASS_SECTION, "green"],
      ["Chemistry", "Mr. Naveed", DEFAULT_CLASS_SECTION, "orange"],
    ],
  },
  {
    number: 5,
    time: "10:15 - 10:50",
    cells: [
      ["Islamiat", "Mr. Hamid", DEFAULT_CLASS_SECTION, "green"],
      ["Pakistan Studies", "Mr. Hamid", DEFAULT_CLASS_SECTION, "green"],
      ["Urdu", "Mr. Aslam", DEFAULT_CLASS_SECTION, "purple"],
      ["Physics", "Mr. Bilal", DEFAULT_CLASS_SECTION, "orange"],
      ["English", "Mr. Ali", DEFAULT_CLASS_SECTION, "green"],
      ["Mathematics", "Mr. Imran", DEFAULT_CLASS_SECTION, "blue"],
      ["Islamiat", "Mr. Hamid", DEFAULT_CLASS_SECTION, "green"],
    ],
  },
  {
    number: "break",
    time: "10:50 - 11:15",
    label: "Lunch Time",
  },
  {
    number: 6,
    time: "11:15 - 11:50",
    cells: [
      ["Physics", "Mr. Bilal", DEFAULT_CLASS_SECTION, "orange"],
      ["Physics", "Mr. Bilal", DEFAULT_CLASS_SECTION, "orange"],
      ["Pakistan Studies", "Mr. Hamid", DEFAULT_CLASS_SECTION, "green"],
      ["Urdu", "Mr. Aslam", DEFAULT_CLASS_SECTION, "purple"],
      ["Islamiat", "Mr. Hamid", DEFAULT_CLASS_SECTION, "green"],
      ["Chemistry", "Mr. Naveed", DEFAULT_CLASS_SECTION, "orange"],
      ["Pakistan Studies", "Mr. Hamid", DEFAULT_CLASS_SECTION, "green"],
    ],
  },
  {
    number: 7,
    time: "11:50 - 12:25",
    cells: [
      ["Sports", "Mr. Danish", DEFAULT_CLASS_SECTION, "pink"],
      ["Islamiat", "Mr. Hamid", DEFAULT_CLASS_SECTION, "green"],
      ["Sports", "Mr. Danish", DEFAULT_CLASS_SECTION, "pink"],
      ["Computer", "Mr. Usman", DEFAULT_CLASS_SECTION, "blue"],
      ["Urdu", "Mr. Aslam", DEFAULT_CLASS_SECTION, "purple"],
      ["Physics", "Mr. Bilal", DEFAULT_CLASS_SECTION, "orange"],
      ["Sports", "Mr. Danish", DEFAULT_CLASS_SECTION, "pink"],
    ],
  },
  {
    number: 8,
    time: "12:25 - 1:00",
    cells: [
      ["Computer", "Mr. Usman", DEFAULT_CLASS_SECTION, "sky"],
      ["Computer", "Mr. Usman", DEFAULT_CLASS_SECTION, "sky"],
      ["Library", "Mr. Usman", DEFAULT_CLASS_SECTION, "blue"],
      ["Sports", "Mr. Danish", DEFAULT_CLASS_SECTION, "pink"],
      ["Computer", "Mr. Usman", DEFAULT_CLASS_SECTION, "sky"],
      ["Urdu", "Mr. Aslam", DEFAULT_CLASS_SECTION, "purple"],
      ["Library", "Mr. Usman", DEFAULT_CLASS_SECTION, "blue"],
    ],
  },
];

const remapRowsForClass = (rows, classSection) =>
  normalizeRows(
    rows.map((row) => ({
      ...row,
      cells: Array.isArray(row.cells)
        ? row.cells.map(([subject, teacher, , tone]) => [subject, teacher, classSection, tone || "blue"])
        : undefined,
    }))
  );

function IconSend({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 3 11 14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 3 15 21l-4-7-7-4 18-7Z" />
    </svg>
  );
}

function IconDocument({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13H7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6M9 17h6" />
    </svg>
  );
}

function IconPrinter({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8V3h10v5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 17H5a2 2 0 0 1-2-2v-4a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v4a2 2 0 0 1-2 2h-1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 14h10v7H7z" />
    </svg>
  );
}

function IconPlus({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconManage({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" />
    </svg>
  );
}

function IconEdit({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
    </svg>
  );
}

function IconCup({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 10h11v1a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4v-1Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 10V6h11v4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 15v2M14 15v2" />
    </svg>
  );
}

function subjectTone(tone) {
  const map = {
    green: "bg-emerald-500",
    blue: "bg-blue-500",
    orange: "bg-orange-500",
    purple: "bg-violet-500",
    pink: "bg-rose-500",
    sky: "bg-sky-500",
    violet: "bg-violet-500",
  };
  return map[tone] || "bg-slate-400";
}

function PeriodCell({ subject, teacher, classSection, tone, dark }) {
  return (
    <div className="flex min-h-[96px] items-center justify-center text-center">
      <div className="flex flex-col items-center justify-center gap-1">
        <div className="min-w-0 text-center">
          <p className={`text-[16px] font-semibold leading-tight ${dark ? "text-white" : "text-slate-900"}`}>{subject}</p>
          <p className={`mt-1 text-[14px] font-medium leading-tight ${dark ? "text-slate-400" : "text-slate-500"}`}>{teacher}</p>
          <p className={`mt-1 text-[13px] font-medium leading-tight ${dark ? "text-[#9e9e9e]" : "text-slate-400"}`}>{classSection}</p>
        </div>
      </div>
    </div>
  );
}

export default function StudentTimeTablePage({ dark = false, branchSection = "Boys" }) {
  const [viewType, setViewType] = useState("Weekly");
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [className, setClassName] = useState(DEFAULT_CLASS);
  const [section, setSection] = useState(DEFAULT_SECTION);
  const [week, setWeek] = useState(DEFAULT_WEEK);
  const [editMode, setEditMode] = useState(false);
  const [manageLecturesMode, setManageLecturesMode] = useState(false);
  const [offModalOpen, setOffModalOpen] = useState(false);
  const [offEntries, setOffEntries] = useState([]);
  const [offDraft, setOffDraft] = useState({
    date: "20",
    day: getDayForDate("20"),
    month: DEFAULT_MONTH,
    year: DEFAULT_YEAR,
  });
  const [periods, setPeriods] = useState(() => remapRowsForClass(TIMETABLE_ROWS, DEFAULT_CLASS_SECTION));
  const [campusTimeTable, setCampusTimeTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const weekOptions = useMemo(() => buildWeekOptions(month, year), [month, year]);
  const classSectionValue = `${className} - ${section}`;
  const offDaySet = useMemo(() => new Set(offEntries.map((entry) => entry.day)), [offEntries]);
  const classColumn = useMemo(() => toTimeTableClassColumn(className), [className]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const { data } = await api.get("/timetables", {
          params: { branch: branchSection === "Girls" ? "Girls" : "Boys" },
        });
        setCampusTimeTable(normalizeTimeTableForLookup(data?.data));
      } catch (err) {
        setCampusTimeTable(null);
        setLoadError(err.response?.data?.message || "Failed to load campus timetable");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [branchSection]);

  useEffect(() => {
    const fromCampus = campusTimeTable
      ? normalizeRows(buildPeriodsFromCampus(campusTimeTable, classColumn, classSectionValue))
      : [];
    setPeriods(fromCampus.length ? fromCampus : remapRowsForClass(TIMETABLE_ROWS, classSectionValue));
    setEditMode(false);
    setManageLecturesMode(false);
  }, [campusTimeTable, classColumn, classSectionValue]);

  useEffect(() => {
    if (!weekOptions.some((item) => item.value === week)) {
      setWeek(weekOptions[0]?.value || DEFAULT_WEEK);
    }
  }, [week, weekOptions]);

  const campusLabel = branchSection === "Girls" ? "Girls" : "Boys";
  const weekSummary = campusTimeTable?.periods?.length
    ? `Synced from ${campusLabel} campus timetable · ${classSectionValue}`
    : `Weekly timetable layout · ${classSectionValue}`;

  const cloneRows = (rows) =>
    rows.map((row) => ({
      ...row,
      cells: Array.isArray(row.cells) ? row.cells.map((cell) => [...cell]) : undefined,
    }));

  const createBlankTimetable = () => {
    const source = campusTimeTable?.periods?.length
      ? campusTimeTable.periods
      : TIMETABLE_ROWS.filter((row) => row.number !== "break" && row.number !== 1).map((row, index) => ({
          number: index + 2,
          start: String(row.time || "").split(" - ")[0] || "08:00",
          end: String(row.time || "").split(" - ")[1] || "08:45",
        }));
    const rows = [
      { number: 1, time: "7:45 - 8:30", label: "Assembly", allStudents: true, color: "violet" },
      ...source.map((period, index) => ({
        number: period.number ?? index + 2,
        time: period.start && period.end ? `${period.start} - ${period.end}` : period.time || "08:00 - 08:45",
        cells: WEEK_DAYS.map(() => ["", "", classSectionValue, TONES[index % TONES.length]]),
      })),
    ];
    // Insert lunch break after period 5 when using demo shape
    if (!campusTimeTable?.periods?.length) {
      rows.splice(5, 0, { number: "break", time: "10:50 - 11:15", label: "Lunch Time" });
    }
    return rows;
  };

  const updatePeriodRow = (rowIndex, patch) => {
    setPeriods((prev) => prev.map((row, index) => (index === rowIndex ? { ...row, ...patch } : row)));
  };

  const updateCell = (rowIndex, cellIndex, fieldIndex, value) => {
    setPeriods((prev) =>
      prev.map((row, index) => {
        if (index !== rowIndex || !Array.isArray(row.cells)) return row;
        return {
          ...row,
          cells: row.cells.map((cell, cIndex) => (cIndex === cellIndex ? cell.map((item, itemIndex) => (itemIndex === fieldIndex ? value : item)) : cell)),
        };
      })
    );
  };

  const handleCreateTimeTable = () => {
    const ok = window.confirm("Create a new blank timetable for this branch?");
    if (!ok) return;
    setPeriods(createBlankTimetable());
    setEditMode(true);
    setManageLecturesMode(true);
  };

  const handleResetToDefault = () => {
    const ok = window.confirm("Reload the default weekly timetable layout?");
    if (!ok) return;
    const fromCampus = campusTimeTable
      ? normalizeRows(buildPeriodsFromCampus(campusTimeTable, classColumn, classSectionValue))
      : [];
    setPeriods(fromCampus.length ? fromCampus : remapRowsForClass(TIMETABLE_ROWS, classSectionValue));
    setEditMode(false);
    setManageLecturesMode(false);
  };

  const addLecture = () => {
    setPeriods((prev) => [
      ...prev.slice(0, prev.length - 1),
        {
        number: prev.filter((row) => row.number !== "break").length,
        time: "02:30 - 03:15",
        cells: WEEK_DAYS.map(() => ["", "", classSectionValue, "blue"]),
      },
      prev[prev.length - 1],
    ]);
  };

  const toggleEditMode = () => {
    setEditMode((prev) => !prev);
  };

  const toggleManageLecturesMode = () => {
    setManageLecturesMode((prev) => !prev);
  };

  const openOffModal = () => {
    setOffDraft((prev) => ({
      ...prev,
      day: prev.date ? getDayForDate(prev.date) : prev.day || WEEK_DAYS[0].day,
      month: prev.month || month,
      year: prev.year || year,
    }));
    setOffModalOpen(true);
  };

  const addOffEntry = () => {
    const entry = {
      day: offDraft.day,
      date: offDraft.date,
      month: offDraft.month,
      year: offDraft.year,
    };

    if (!entry.day || !entry.date || !entry.month || !entry.year) return;

    setOffEntries((prev) => {
      const exists = prev.some(
        (item) => item.day === entry.day && item.date === entry.date && item.month === entry.month && item.year === entry.year
      );
      if (exists) return prev;
      return [...prev, entry];
    });
  };

  const removeOffEntry = (index) => {
    setOffEntries((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const closeOffModal = () => {
    setOffModalOpen(false);
  };

  const buttonBase =
    "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition [font-family:'Montserrat',sans-serif]";
  const buttonOutline = dark
    ? "border-white/[0.08] bg-[#1a1b26] text-white hover:bg-white/[0.04]"
    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
  const purpleOutline = dark
    ? "border-[#8b78ff]/35 bg-[#7c4dff]/10 text-[#8b78ff] hover:bg-[#7c4dff]/15"
    : "border-[#a792ff] bg-white text-[#6f58ff] hover:bg-[#f5f1ff]";
  const purplePrimary =
    "border-transparent bg-gradient-to-r from-[#6f58ff] to-[#4b36d2] text-white shadow-[0_10px_24px_rgba(91,70,220,0.22)]";

  const shellCard = dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white";

  return (
    <section className="w-full space-y-5 [font-family:'Inter','Segoe_UI',Arial,sans-serif]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className={`text-xs font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
            Students <span className="mx-2">›</span> <span className={dark ? "text-white" : "text-slate-700"}>Time Table</span>
          </div>
          <h2 className={`mt-3 text-[30px] font-bold tracking-tight [font-family:'Montserrat','Inter',sans-serif] ${dark ? "text-white" : "text-slate-900"}`}>
            Time Table
          </h2>
          <p className={`mt-1 text-sm font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
            Synced from the campus Time Table for the selected class.
          </p>
          {loadError ? <p className="mt-2 text-sm font-semibold text-rose-600">{loadError}</p> : null}
          {loading ? <p className={`mt-2 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Loading campus timetable...</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={handleCreateTimeTable} className={`${buttonBase} ${buttonOutline}`}>
            <IconSend />
            Send to Teachers
          </button>
          <button type="button" onClick={handleCreateTimeTable} className={`${buttonBase} ${buttonOutline}`}>
            <IconSend />
            Send to Students
          </button>
          <button type="button" onClick={() => window.print()} className={`${buttonBase} ${buttonOutline}`}>
            <IconDocument />
            Export PDF
          </button>
          <button type="button" onClick={() => window.print()} className={`${buttonBase} ${buttonOutline}`}>
            <IconPrinter />
            Print
          </button>
          <button type="button" onClick={handleCreateTimeTable} className={`${buttonBase} ${purplePrimary}`}>
            <IconPlus />
            Create Time Table
          </button>
        </div>
      </div>

      <div className={`w-full rounded-[16px] border p-4 sm:p-5 ${shellCard}`}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
          <div className="w-full xl:min-w-0 xl:flex-1">
            <ScrollableSelect label="View Type" placeholder="Weekly" value={viewType} options={VIEW_TYPE_OPTIONS} onChange={setViewType} dark={dark} />
          </div>
          <div className="w-full xl:min-w-0 xl:flex-[1.15]">
            <ScrollableSelect
              label="Class+Section"
              placeholder="Select class+section"
              value={classSectionValue}
              options={CLASS_SECTION_OPTIONS}
              onChange={(value) => {
                const [nextClass = DEFAULT_CLASS, nextSection = DEFAULT_SECTION] = String(value).split(" - ");
                setClassName(nextClass);
                setSection(nextSection);
              }}
              dark={dark}
            />
          </div>
          <div className="w-full xl:min-w-0 xl:flex-1">
            <ScrollableSelect label="Week" placeholder="Select week" value={week} options={weekOptions} onChange={setWeek} dark={dark} portal />
          </div>
          <div className="w-full xl:min-w-0 xl:flex-1">
            <ScrollableSelect label="Month" placeholder="Select month" value={month} options={MONTH_OPTIONS} onChange={setMonth} dark={dark} />
          </div>
          <div className="w-full xl:min-w-0 xl:flex-1">
            <ScrollableSelect label="Year" placeholder="Select year" value={year} options={YEAR_OPTIONS} onChange={setYear} dark={dark} portal />
          </div>
        </div>
        <p className={`mt-3 text-xs font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
          {weekSummary} - {campusLabel} Campus
        </p>
      </div>

      <div className={`w-full rounded-[16px] border p-4 sm:p-5 ${shellCard}`}>
        <div className="mb-3 flex w-full flex-wrap items-center justify-between gap-3">
          <h3 className={`text-[18px] font-semibold tracking-tight [font-family:'Montserrat','Inter',sans-serif] ${dark ? "text-white" : "text-slate-900"}`}>
            Weekly Time Table
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={toggleManageLecturesMode} className={`${buttonBase} ${buttonOutline}`}>
              <IconManage />
              {manageLecturesMode ? "Done Lectures" : "Manage Lectures"}
            </button>
            <button type="button" onClick={toggleEditMode} className={`${buttonBase} ${purpleOutline}`}>
              <IconEdit />
              {editMode ? "Done Editing" : "Edit Time Table"}
            </button>
            <button type="button" onClick={handleResetToDefault} className={`${buttonBase} ${buttonOutline}`}>
              Reset
            </button>
            <button type="button" onClick={openOffModal} className={`${buttonBase} ${purpleOutline}`}>
              OFF
            </button>
          </div>
        </div>

        <div className={`w-full overflow-x-auto rounded-2xl border ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
          <table className={`w-full min-w-[1280px] border-collapse text-left text-sm ${dark ? "bg-[#161722] text-white" : "bg-white text-slate-700"}`}>
            <thead>
              <tr>
                <th className={`min-w-[120px] border-b border-r px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.12em] ${dark ? "border-white/[0.06] text-[#9e9e9e]" : "border-slate-100 text-slate-500"}`}>
                  &nbsp;
                </th>
                {WEEK_DAYS.map((item) => (
                  <th key={item.day} className={`border-b border-r px-4 py-3 text-center ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
                    <div className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{item.day}</div>
                    <div className={`mt-1 text-[13px] font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{item.date}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((row, rowIndex) => {
                if (row.number === "break") {
                  return (
                    <tr key="lunch" className={dark ? "bg-[#241625]" : "bg-[#fff3f8]"}>
                      <td className={`border-b border-r px-4 py-3 text-center ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
                        {editMode || manageLecturesMode ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={row.time}
                              onChange={(event) => updatePeriodRow(rowIndex, { time: event.target.value })}
                              className={`w-full rounded-lg border px-2 py-1 text-center text-[13px] font-semibold outline-none ${
                                dark ? "border-white/[0.08] bg-[#1a1b26] text-[#ff8fb1]" : "border-slate-200 bg-white text-rose-500"
                              }`}
                            />
                            {manageLecturesMode ? (
                              <input
                                type="text"
                                value={row.label || "Lunch Time"}
                                onChange={(event) => updatePeriodRow(rowIndex, { label: event.target.value })}
                                className={`w-full rounded-lg border px-2 py-1 text-center text-[13px] font-semibold outline-none ${
                                  dark ? "border-white/[0.08] bg-[#1a1b26] text-[#ff8fb1]" : "border-slate-200 bg-white text-rose-500"
                                }`}
                              />
                            ) : (
                              <div className={`flex items-center justify-center gap-1 text-[13px] ${dark ? "text-[#ff8fb1]" : "text-rose-500"}`}>
                                <IconCup className="h-4 w-4" />
                                <span>{row.label || "Lunch Time"}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className={`text-[14px] font-semibold ${dark ? "text-[#ff8fb1]" : "text-rose-500"}`}>{row.time}</div>
                            <div className={`mt-1 flex items-center justify-center gap-1 text-[13px] ${dark ? "text-[#ff8fb1]" : "text-rose-500"}`}>
                              <IconCup className="h-4 w-4" />
                              <span>{row.label || "Lunch Time"}</span>
                            </div>
                          </>
                        )}
                      </td>
                      {WEEK_DAYS.map((day) => (
                        <td key={`lunch-${day.day}`} className={`border-b border-r px-4 py-4 text-center ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
                          <div className={`inline-flex items-center gap-2 text-sm font-medium ${dark ? "text-[#ff8fb1]" : "text-rose-500"}`}>
                            <IconCup className="h-4 w-4" />
                            {row.label || "Lunch Time"}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                }

                return (
                  <tr key={row.number} className={dark ? "bg-[#161722]" : "bg-white"}>
                    <td className={`border-b border-r px-4 py-4 text-center ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
                      {editMode ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={row.number}
                            onChange={(event) => updatePeriodRow(rowIndex, { number: event.target.value })}
                            className={`w-full rounded-lg border px-2 py-1 text-center text-[14px] font-semibold outline-none ${
                              dark ? "border-white/[0.08] bg-[#1a1b26] text-white" : "border-slate-200 bg-white text-slate-900"
                            }`}
                          />
                          <input
                            type="text"
                            value={row.time}
                            onChange={(event) => updatePeriodRow(rowIndex, { time: event.target.value })}
                            className={`w-full rounded-lg border px-2 py-1 text-center text-[12px] font-medium outline-none ${
                              dark ? "border-white/[0.08] bg-[#1a1b26] text-[#9e9e9e]" : "border-slate-200 bg-white text-slate-500"
                            }`}
                          />
                        </div>
                      ) : (
                        <>
                          <div className={`text-[15px] font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{row.number}</div>
                          <div className={`mt-1 text-[13px] font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{row.time}</div>
                        </>
                      )}
                    </td>
                    {row.number === 1 ? (
                      WEEK_DAYS.map((day) => (
                        <td key={`${row.number}-${day.day}`} className={`border-b border-r px-4 py-4 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
                          {offDaySet.has(day.day) ? (
                            <div className="flex min-h-[96px] items-center justify-center text-center">
                              <div className={`text-[18px] font-bold tracking-[0.18em] ${dark ? "text-rose-400" : "text-rose-500"}`}>OFF</div>
                            </div>
                          ) : manageLecturesMode ? (
                            <div className="flex min-h-[96px] flex-col items-center justify-center gap-2 text-center">
                              <input
                                type="text"
                                value={row.label || "Assembly"}
                                onChange={(event) => updatePeriodRow(rowIndex, { label: event.target.value })}
                                className={`w-full rounded-lg border px-2 py-1 text-center text-[14px] font-semibold outline-none ${
                                  dark ? "border-white/[0.08] bg-[#1a1b26] text-[#6f58ff]" : "border-slate-200 bg-white text-[#6f58ff]"
                                }`}
                                placeholder="Assembly"
                              />
                              <input
                                type="text"
                                value={row.allStudents ? "All Students" : row.allStudents || "All Students"}
                                onChange={(event) => updatePeriodRow(rowIndex, { allStudents: event.target.value })}
                                className={`w-full rounded-lg border px-2 py-1 text-center text-[13px] font-medium outline-none ${
                                  dark ? "border-white/[0.08] bg-[#1a1b26] text-[#8c76ff]" : "border-slate-200 bg-white text-[#8c76ff]"
                                }`}
                                placeholder="All Students"
                              />
                            </div>
                          ) : (
                            <div className="flex min-h-[96px] items-center justify-center text-center">
                              <div className="text-center">
                                <p className="text-[16px] font-semibold text-[#6f58ff]">Assembly</p>
                                <p className="mt-1 text-[13px] font-medium text-[#8c76ff]">All Students</p>
                              </div>
                            </div>
                          )}
                        </td>
                      ))
                    ) : (
                      row.cells.map(([subject, teacher, classSection, tone], cellIndex) => (
                        <td key={`${row.number}-${WEEK_DAYS[cellIndex].day}`} className={`border-b border-r px-4 py-4 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
                          {offDaySet.has(WEEK_DAYS[cellIndex].day) ? (
                            <div className="flex min-h-[96px] items-center justify-center text-center">
                              <div className={`text-[18px] font-bold tracking-[0.18em] ${dark ? "text-rose-400" : "text-rose-500"}`}>OFF</div>
                            </div>
                          ) : manageLecturesMode ? (
                            <div className="flex min-h-[96px] flex-col items-center justify-center gap-2 text-center">
                              <input
                                type="text"
                                value={subject}
                                onChange={(event) => updateCell(rowIndex, cellIndex, 0, event.target.value)}
                                className={`w-full rounded-lg border px-2 py-1 text-center text-[14px] font-semibold outline-none ${
                                  dark ? "border-white/[0.08] bg-[#1a1b26] text-white" : "border-slate-200 bg-white text-slate-900"
                                }`}
                                placeholder="Subject"
                              />
                              <input
                                type="text"
                                value={teacher}
                                onChange={(event) => updateCell(rowIndex, cellIndex, 1, event.target.value)}
                                className={`w-full rounded-lg border px-2 py-1 text-center text-[13px] font-medium outline-none ${
                                  dark ? "border-white/[0.08] bg-[#1a1b26] text-slate-400" : "border-slate-200 bg-white text-slate-500"
                                }`}
                                placeholder="Teacher"
                              />
                              <input
                                type="text"
                                value={classSection}
                                onChange={(event) => updateCell(rowIndex, cellIndex, 2, event.target.value)}
                                className={`w-full rounded-lg border px-2 py-1 text-center text-[13px] font-medium outline-none ${
                                  dark ? "border-white/[0.08] bg-[#1a1b26] text-[#9e9e9e]" : "border-slate-200 bg-white text-slate-400"
                                }`}
                                placeholder="Class + Section"
                              />
                            </div>
                          ) : (
                            <PeriodCell subject={subject} teacher={teacher} classSection={classSection} tone={tone} dark={dark} />
                          )}
                        </td>
                      ))
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className={`text-xs font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
            {editMode || manageLecturesMode ? "Editing enabled. Changes are saved automatically when you finish." : "Tip: enable editing to modify lectures and subjects."}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {manageLecturesMode ? (
              <button type="button" onClick={addLecture} className={`${buttonBase} ${buttonOutline}`}>
                <IconPlus />
                Add Lecture
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {offModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <div className={`w-full max-w-4xl rounded-3xl border shadow-2xl ${dark ? "border-white/[0.08] bg-[#11131d]" : "border-slate-200 bg-white"}`}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 px-5 py-4 dark:border-white/[0.08]">
              <div>
                <h4 className={`text-[20px] font-semibold ${dark ? "text-white" : "text-slate-900"}`}>Mark OFF Days</h4>
                <p className={`mt-1 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                  Add one or more days that should show as OFF in the weekly timetable.
                </p>
              </div>
              <button
                type="button"
                onClick={closeOffModal}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${dark ? "border-white/[0.08] text-white" : "border-slate-200 text-slate-700"}`}
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
              <ScrollableSelect
                label="Date"
                placeholder="Select date"
                value={offDraft.date}
                options={DATE_OPTIONS}
                onChange={(value) => setOffDraft((prev) => ({ ...prev, date: value, day: getDayForDate(value) }))}
                dark={dark}
              />
              <ScrollableSelect
                label="Day"
                placeholder="Select day"
                value={offDraft.day}
                options={WEEK_DAYS.map((item) => ({ value: item.day, label: item.day }))}
                onChange={(value) => setOffDraft((prev) => ({ ...prev, day: value }))}
                dark={dark}
              />
              <ScrollableSelect
                label="Month"
                placeholder="Select month"
                value={offDraft.month}
                options={MONTH_OPTIONS}
                onChange={(value) => setOffDraft((prev) => ({ ...prev, month: value }))}
                dark={dark}
              />
              <ScrollableSelect
                label="Year"
                placeholder="Select year"
                value={offDraft.year}
                options={YEAR_OPTIONS}
                onChange={(value) => setOffDraft((prev) => ({ ...prev, year: value }))}
                dark={dark}
              />
              <div className="flex items-end">
                <button type="button" onClick={addOffEntry} className={`${buttonBase} ${purplePrimary} w-full justify-center`}>
                  Add
                </button>
              </div>
            </div>

            <div className="px-5 pb-5">
              <div className={`rounded-2xl border p-4 ${dark ? "border-white/[0.08] bg-white/[0.02]" : "border-slate-200 bg-slate-50"}`}>
                <div className={`mb-3 text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>Selected OFF Days</div>
                {offEntries.length ? (
                  <div className="space-y-2">
                    {offEntries.map((entry, index) => (
                      <div
                        key={`${entry.day}-${entry.date}-${entry.month}-${entry.year}-${index}`}
                        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                          dark ? "border-white/[0.08] bg-[#171a26]" : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className={`text-sm ${dark ? "text-white" : "text-slate-700"}`}>
                          {entry.day}, {entry.date} {entry.month} {entry.year}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeOffEntry(index)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                            dark ? "border-white/[0.08] text-white" : "border-slate-200 text-slate-700"
                          }`}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>No OFF days added yet.</p>
                )}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeOffModal}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${dark ? "border-white/[0.08] text-white" : "border-slate-200 text-slate-700"}`}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
