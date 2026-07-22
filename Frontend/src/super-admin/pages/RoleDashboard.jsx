import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import api from "../services/api/client";

import StatCard from "../components/dashboard/StatCard";
import { StatsColumnBoard } from "../components/dashboard/StatsColumnBoard";
import ModernDatePicker from "../components/ui/ModernDatePicker";
import ScrollableSelect from "../components/ui/ScrollableSelect";
import FormModal from "../components/ui/FormModal";
import { CLASS_OPTIONS, SECTION_OPTIONS } from "../constants/classes";
import { notifySyllabusUpdated, subscribeSyllabusUpdated } from "../../utils/syllabusSync";

import {
  IconAbsent,
  IconAttendance,
  IconClasses,
  IconClock,
  IconFee,
  IconLeave,
  IconPresent,
  IconStudents,
  IconTasks,
  IconTeachers,
} from "../components/icons/DashboardIcons";

const darkCard = "rounded-xl border border-white/[0.06] bg-[#161722]";
const lightCard = "rounded-xl border border-white/80 bg-white/90 shadow-[0_16px_38px_rgba(79,70,229,0.1)]";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCount = (value) => String(Number(value ?? 0)).padStart(2, "0");

const branchKey = (branchSection) => (branchSection === "Boys" ? "Boys" : "Girls");

const allClassOptions = [
  { value: "", label: "Select All Classes" },
  ...CLASS_OPTIONS.map((className) => ({ value: className, label: className })),
];

const allSectionOptions = [
  { value: "", label: "Select All Sections" },
  ...SECTION_OPTIONS.map((section) => ({ value: section, label: `Section ${section}` })),
];

const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const SYLLABUS_SUBJECTS = ["ENGLISH", "URDU", "MATHEMATICS", "ISLAMIC STUDIES", "GENERAL SCIENCE", "SOCIAL STUDIES", "COMPUTER", "NAZRA"];
const schoolLogo = "/Logo%20Insaf%20Grammar%20High%20School.png";

const YEAR_OPTIONS = Array.from({ length: 1001 }, (_, index) => {
  const year = 3000 - index;
  return { value: String(year), label: String(year) };
});

const ALL_CLASS_SECTION_OPTIONS = [
  { value: "", label: "Select All Classes & Sections" },
  ...CLASS_OPTIONS.flatMap((className) =>
    SECTION_OPTIONS.map((section) => ({
      className,
      section,
      label: `${className} ${section}`,
      value: `${className}|${section}`,
    }))
  ),
];

const parseDateKey = (value) => {
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
};

const monthYearMatchesRange = (from, to, monthValue, yearValue) => {
  if (!monthValue && !yearValue) return true;

  const start = parseDateKey(from);
  const end = parseDateKey(to);
  if (!start || !end) return false;

  if (monthValue && yearValue) {
    const year = Number(yearValue);
    const monthIndex = Number(monthValue) - 1;
    const rangeStart = new Date(year, monthIndex, 1);
    const rangeEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
    return end >= rangeStart && start <= rangeEnd;
  }

  if (yearValue) {
    const year = Number(yearValue);
    const rangeStart = new Date(year, 0, 1);
    const rangeEnd = new Date(year, 11, 31, 23, 59, 59, 999);
    return end >= rangeStart && start <= rangeEnd;
  }

  const monthIndex = Number(monthValue) - 1;
  return start.getMonth() === monthIndex || end.getMonth() === monthIndex;
};

const formatMonthAndYear = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { month: "-", year: "-" };
  return {
    month: date.toLocaleDateString("en-US", { month: "long" }),
    year: String(date.getFullYear()),
  };
};

const getSyllabusPeriodLabel = (item, mode) => {
  const monthYear = formatMonthAndYear(item?.from);
  const year = item?.year || monthYear.year;
  if (mode === "annually") {
    return `Annually: ${year}`;
  }
  const monthName = item?.monthTitle || (item?.month != null ? MONTH_OPTIONS.find((entry) => Number(entry.value) === Number(item.month) + 1)?.label : null) || monthYear.month;
  return `Monthly: ${monthName}${year ? ` ${year}` : ""}`;
};

const getSyllabusDesignTitle = (item, mode = "monthly") => {
  const monthYear = formatMonthAndYear(item?.from);
  const year = item?.year || monthYear.year || new Date().getFullYear();
  if (mode === "annually") {
    return `ANNUALLY ${year}`;
  }
  const monthName = String(
    item?.monthTitle ||
      (item?.month != null
        ? MONTH_OPTIONS.find((entry) => Number(entry.value) === Number(item.month) + 1)?.label
        : null) ||
      monthYear.month ||
      "MONTH"
  ).toUpperCase();
  return `${monthName} ${year}`;
};

function SectionCard({ title, subtitle, badge, dark, children }) {
  return (
    <div className={`overflow-hidden ${dark ? darkCard : lightCard}`}>
      <div className={`flex items-center justify-between border-b px-5 py-4 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
        <div>
          <h3 className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-800"}`}>{title}</h3>
          {subtitle ? <p className={`mt-1 text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{subtitle}</p> : null}
        </div>
        {badge ? <div className="rounded-full bg-[#7c4dff]/10 px-3 py-1 text-xs font-semibold text-[#7c4dff]">{badge}</div> : null}
      </div>
      {children}
    </div>
  );
}

function DetailGrid({ dark, items }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-xl border px-4 py-3 ${dark ? "border-white/[0.06] bg-[#1a1b26]" : "border-slate-100 bg-slate-50"}`}
        >
          <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
            {item.label}
          </p>
          <p className={`mt-2 text-sm font-medium ${dark ? "text-white" : "text-slate-800"}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function CornerSeal({ side = "left" }) {
  const alignClass = side === "left" ? "left-0" : "right-0";
  const curveClass = side === "left" ? "-left-1 rounded-br-[120px]" : "-right-1 rounded-bl-[120px]";
  const dotClass = side === "left" ? "left-[200px]" : "right-[200px]";

  return (
    <>
      <div className={`absolute top-0 h-[95px] w-[205px] bg-[#2f63e6] ${curveClass}`} />
      <div className={`absolute top-2 h-px w-[184px] bg-white ${side === "left" ? "left-5" : "right-5"}`} />
      <div
        className={`absolute top-0 h-[42px] w-[92px] opacity-60 ${dotClass}`}
        style={{ backgroundImage: "radial-gradient(#8dc1ff 1.4px, transparent 1.4px)", backgroundSize: "8px 8px" }}
      />
      <div className={`absolute top-[14px] ${alignClass} flex w-[176px] justify-center`}>
        <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#dcebff]">
          <img src={schoolLogo} alt="" className="h-11 w-11 object-contain" />
        </div>
      </div>
    </>
  );
}

const normalizeSubjectName = (value = "") => {
  const upper = String(value).trim().toUpperCase();
  if (upper.includes("MATH")) return "MATHEMATICS";
  if (upper.includes("SCIENCE")) return "GENERAL SCIENCE";
  if (upper.includes("SOCIAL") || upper.includes("GENERAL KNOWLEDGE")) return "SOCIAL STUDIES";
  if (upper.includes("ISLAMI")) return "ISLAMIC STUDIES";
  if (upper.includes("COMPUTER")) return "COMPUTER";
  if (upper.includes("URDU")) return "URDU";
  if (upper.includes("ENGLISH") || upper.includes("GRAMMAR")) return "ENGLISH";
  if (upper.includes("NAZRA") || upper.includes("QURAN") || upper.includes("QAIDA")) return "NAZRA";
  return upper;
};

const getMonthValueFromDate = (value) => {
  const date = parseDateKey(value) || new Date(value);
  if (!date || Number.isNaN(date.getTime())) return "01";
  return String(date.getMonth() + 1).padStart(2, "0");
};

const buildSyllabusSheetRows = (item) => {
  const sourceRows = Array.isArray(item?.rows) && item.rows.length
    ? item.rows
    : Array.isArray(item?.books)
      ? item.books.map((book) => ({
          subject: book.bookName,
          syllabus: book.syllabus,
          covered: book.coveredPercent,
        }))
      : [];

  if (sourceRows.length) {
    return sourceRows.map((row) => {
      const coveredRaw = row.covered ?? row.coveredPercent ?? "";
      const coveredText =
        coveredRaw === "" || coveredRaw == null
          ? ""
          : String(coveredRaw).includes("%")
            ? String(coveredRaw)
            : `${coveredRaw}%`;
      return {
        subject: normalizeSubjectName(row.subject || row.bookName || ""),
        syllabus: row.syllabus || "",
        covered: coveredText,
      };
    });
  }

  return SYLLABUS_SUBJECTS.map((subject) => ({
    subject,
    syllabus: "",
    covered: "",
  }));
};

function SyllabusModalBody({
  item,
  mode = "monthly",
  editing = false,
  rows = [],
  onRowChange,
  exportRef = null,
}) {
  const className = item.className || item.classSection?.split(" - ")?.[0] || "-";
  const section = item.section || item.classSection?.split(" - ")?.[1] || "-";
  const designTitle = getSyllabusDesignTitle(item, mode);

  return (
    <div className="space-y-4 [font-family:'Montserrat','Inter',sans-serif]">
      <div ref={exportRef} className="overflow-x-auto rounded-xl border-4 border-blue-600 bg-white">
        <div className="relative overflow-hidden border-2 border-white bg-white px-4 py-4 text-center">
          <CornerSeal side="left" />
          <CornerSeal side="right" />
          <div className="text-3xl font-black uppercase tracking-wide text-blue-950">
            {designTitle}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-bold uppercase tracking-wide text-blue-950">
            <span>Teacher: {item.teacherName || "-"}</span>
            <span className="text-blue-300" aria-hidden="true">
              |
            </span>
            <span>
              Class: {className} {section}
            </span>
          </div>
        </div>

        <table className="w-full table-auto border-collapse text-center">
          <thead>
            <tr className="bg-blue-700 text-white">
              <th className="w-[160px] min-w-[160px] whitespace-nowrap border border-blue-500 px-3 py-3 text-xs font-extrabold uppercase tracking-wide">Books/Subjects</th>
              <th className="border border-blue-500 px-3 py-3 text-xs font-extrabold uppercase tracking-wide">Syllabus</th>
              <th className="w-[120px] max-w-[120px] min-w-[120px] border border-blue-500 px-3 py-3 text-xs font-extrabold uppercase tracking-wide">Covered%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.subject}>
                <td className="w-[160px] min-w-[160px] whitespace-nowrap border border-blue-500 px-2 py-6 text-sm font-extrabold uppercase tracking-wide text-blue-950">
                  {row.subject}
                </td>
                <td className="border border-blue-500 px-4 py-4 text-left text-sm font-semibold leading-6 text-blue-950">
                  {editing ? (
                    <textarea
                      value={row.syllabus}
                      onChange={(event) => onRowChange?.(row.subject, "syllabus", event.target.value)}
                      rows={2}
                      className="min-h-[52px] w-full resize-none rounded-lg border border-blue-200 bg-blue-50/60 px-2 py-1.5 text-left text-sm font-semibold leading-6 text-blue-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 [font-family:'Montserrat','Inter',sans-serif]"
                    />
                  ) : (
                    row.syllabus
                  )}
                </td>
                <td className="w-[120px] max-w-[120px] min-w-[120px] border border-blue-500 px-2 py-4 text-sm font-extrabold text-blue-950">
                  {row.covered}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FurnitureModalBody({ item, dark }) {
  const desks = Number(item.desks ?? 0);
  const benches = Number(item.benches ?? 0);
  const chairs = Number(item.chairs ?? 0);
  const bulbs = Number(item.bulbs ?? 0);
  const fans = Number(item.fans ?? 0);
  const windows = Number(item.windows ?? 0);
  const mirrors = Number(item.mirrors ?? 0);
  const brokenTotal = desks + benches + chairs + bulbs + fans + windows + mirrors;
  const inventoryTotal =
    Number(item.desksTotal ?? 0) +
    Number(item.benchesTotal ?? 0) +
    Number(item.chairsTotal ?? 0) +
    Number(item.bulbsTotal ?? 0) +
    Number(item.fansTotal ?? 0) +
    Number(item.windowsTotal ?? 0) +
    Number(item.mirrorsTotal ?? 0);
  const total = Number(item.total ?? inventoryTotal);
  const availableFromFields =
    Number(item.desksAvailable ?? 0) +
    Number(item.benchesAvailable ?? 0) +
    Number(item.chairsAvailable ?? 0) +
    Number(item.bulbsAvailable ?? 0) +
    Number(item.fansAvailable ?? 0) +
    Number(item.windowsAvailable ?? 0) +
    Number(item.mirrorsAvailable ?? 0);
  const availableTotal =
    item.desksAvailable != null || item.benchesAvailable != null
      ? Math.max(0, availableFromFields)
      : Math.max(0, total - brokenTotal);
  const dateRange = item.dateRange || `${formatDate(item.from)} to ${formatDate(item.to)}`;
  const classSection = item.classSection || "-";
  const lastPurchase = item.lastPurchase || {};
  const lastPurchaseItems = [
    { key: "desks", label: "Desks", qty: lastPurchase.desks?.qty ?? 0 },
    { key: "benches", label: "Benches", qty: lastPurchase.benches?.qty ?? 0 },
    { key: "chairs", label: "Chairs", qty: lastPurchase.chairs?.qty ?? 0 },
    { key: "bulbs", label: "Bulbs", qty: lastPurchase.bulbs?.qty ?? 0 },
    { key: "fans", label: "Fans", qty: lastPurchase.fans?.qty ?? 0 },
    { key: "windows", label: "Windows", qty: lastPurchase.windows?.qty ?? 0 },
    { key: "mirrors", label: "Mirrors", qty: lastPurchase.mirrors?.qty ?? 0 },
  ];
  const lastPurchaseTotal = lastPurchaseItems.reduce((sum, entry) => sum + Number(entry.qty || 0), 0);
  const availableOf = (broken, fullTotal, availableOverride) => {
    if (availableOverride != null) return Math.max(0, Number(availableOverride));
    return Math.max(0, Number(fullTotal || 0) - Number(broken || 0));
  };
  const renderRatio = (broken, fullTotal, availableOverride, compact = false) => (
    <div className="flex flex-col items-center justify-center">
      <span className={`${compact ? "text-[28px]" : "text-[30px]"} font-semibold leading-none text-rose-600`}>
        {formatCount(broken)}
      </span>
      <span className={`my-2 block h-px w-10 bg-slate-200 ${dark ? "bg-white/[0.08]" : ""}`} />
      <span className={`${compact ? "text-[22px]" : "text-[24px]"} font-semibold leading-none text-emerald-500`}>
        {formatCount(availableOf(broken, fullTotal, availableOverride))}
      </span>
    </div>
  );

  const wrapperClass = dark
    ? "border-white/[0.06] bg-[#161722]"
    : "border-[#e7edf7] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]";

  return (
    <div className={`overflow-hidden rounded-[24px] border ${wrapperClass}`}>
      <div className={`flex items-center justify-between border-b px-5 py-4 ${dark ? "border-white/[0.06]" : "border-[#edf2fa]"}`}>
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={`flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full border ${
              dark ? "border-white/[0.08] bg-white/[0.03]" : "border-[#e4e9f7] bg-[#fbfcff]"
            }`}
          >
            <svg viewBox="0 0 24 24" className={`h-8 w-8 ${dark ? "text-[#6f57ff]" : "text-[#5d4df0]"}`} fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M7 9h10a2 2 0 0 1 2 2v3H5v-3a2 2 0 0 1 2-2Z" />
              <path d="M8 14v4M16 14v4M9 6h6a2 2 0 0 1 2 2v1H7V8a2 2 0 0 1 2-2Z" />
              <path d="M7 18h10" strokeLinecap="round" />
            </svg>
          </div>

          <div className="min-w-0">
            <p className={`text-[12px] font-semibold uppercase tracking-[0.08em] ${dark ? "text-[#6f57ff]" : "text-[#5d4df0]"}`}>
              Furniture Status
            </p>
            <h4 className={`mt-1 text-[28px] font-semibold leading-tight ${dark ? "text-white" : "text-[#17223b]"}`}>
              {item.teacherName || "-"}
            </h4>
            <p className={`mt-1 text-[15px] leading-6 ${dark ? "text-[#9e9e9e]" : "text-[#6e758a]"}`}>{classSection}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`min-w-[200px] border-l pl-5 ${dark ? "border-white/[0.08]" : "border-[#e4e9f7]"}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center ${dark ? "text-[#5d4df0]" : "text-[#5d4df0]"}`}>
                <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M8 3v4M16 3v4M3 9h18" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className={`text-[12px] font-semibold uppercase tracking-[0.08em] ${dark ? "text-[#9e9e9e]" : "text-[#7d8499]"}`}>
                  Date
                </p>
                <p className={`mt-1 whitespace-nowrap text-[16px] leading-6 ${dark ? "text-white" : "text-[#17223b]"}`}>{dateRange}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`min-w-[120px] rounded-[16px] border px-4 py-4 text-center ${
                dark ? "border-[#ff7b8b]/20 bg-[#ff4d6d]/10" : "border-rose-200 bg-rose-50"
              }`}
            >
              <p className={`text-[12px] font-semibold uppercase tracking-[0.08em] ${dark ? "text-[#ff6f86]" : "text-[#ef4a5f]"}`}>
                Broken
              </p>
              <p className={`mt-2 text-[36px] font-semibold leading-none ${dark ? "text-white" : "text-[#eb3349]"}`}>
                {formatCount(brokenTotal)}
              </p>
            </div>
            <div
              className={`min-w-[120px] rounded-[16px] border px-4 py-4 text-center ${
                dark ? "border-[#4fd9b3]/20 bg-[#1a2a26]" : "border-emerald-200 bg-emerald-50"
              }`}
            >
              <p className={`text-[12px] font-semibold uppercase tracking-[0.08em] ${dark ? "text-[#3ad0a3]" : "text-[#1aa974]"}`}>
                Available
              </p>
              <p className={`mt-2 text-[36px] font-semibold leading-none ${dark ? "text-[#3ad0a3]" : "text-[#1aa974]"}`}>
                {formatCount(availableTotal)}
              </p>
            </div>
            <div
              className={`min-w-[120px] rounded-[16px] border px-4 py-4 text-center ${
                dark ? "border-white/[0.08] bg-white/[0.03]" : "border-slate-200 bg-slate-50"
              }`}
            >
              <p className={`text-[12px] font-semibold uppercase tracking-[0.08em] ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                Total
              </p>
              <p className={`mt-2 text-[36px] font-semibold leading-none ${dark ? "text-white" : "text-[#17223b]"}`}>
                {formatCount(total)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={`px-6 py-4 ${dark ? "bg-[#161722]" : "bg-white"}`}>
        <div className={`overflow-hidden rounded-[18px] border ${dark ? "border-white/[0.06]" : "border-[#e7edf7]"}`}>
          <div
            className={`grid grid-cols-[repeat(7,minmax(0,1fr))] border-b px-6 py-4 text-center text-[13px] font-semibold uppercase tracking-[0.08em] ${
              dark ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e]" : "border-[#edf2fa] bg-[#f6f8fc] text-[#49546a]"
            }`}
          >
            <span className="text-center">Desks</span>
            <span className="text-center">Benches</span>
            <span className="text-center">Chairs</span>
            <span className="text-center">Bulbs</span>
            <span className="text-center">Fans</span>
            <span className="text-center">Windows</span>
            <span className="text-center">Mirrors</span>
          </div>

          <div
            className={`grid grid-cols-[repeat(7,minmax(0,1fr))] items-center px-6 py-6 ${
              dark ? "bg-[#161722] text-white" : "bg-white text-[#17223b]"
            }`}
          >
            <div className="flex justify-center">{renderRatio(desks, item.desksTotal, item.desksAvailable, true)}</div>
            <div className="flex justify-center">{renderRatio(benches, item.benchesTotal, item.benchesAvailable, true)}</div>
            <div className="flex justify-center">{renderRatio(chairs, item.chairsTotal, item.chairsAvailable, true)}</div>
            <div className="flex justify-center">{renderRatio(bulbs, item.bulbsTotal, item.bulbsAvailable, true)}</div>
            <div className="flex justify-center">{renderRatio(fans, item.fansTotal, item.fansAvailable, true)}</div>
            <div className="flex justify-center">{renderRatio(windows, item.windowsTotal, item.windowsAvailable, true)}</div>
            <div className="flex justify-center">{renderRatio(mirrors, item.mirrorsTotal, item.mirrorsAvailable, true)}</div>
          </div>
        </div>

        <div className={`mt-4 overflow-hidden rounded-[18px] border ${dark ? "border-white/[0.06]" : "border-[#e7edf7]"}`}>
          <div
            className={`border-b px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] ${
              dark ? "border-white/[0.06] bg-[#1a1b26] text-[#6f57ff]" : "border-[#edf2fa] bg-[#f6f8fc] text-[#5d4df0]"
            }`}
          >
            Last purchase
          </div>
          <div
            className={`grid grid-cols-[1.15fr_repeat(8,minmax(0,1fr))] border-b px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.06em] ${
              dark ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e]" : "border-[#edf2fa] bg-[#fafbfe] text-[#49546a]"
            }`}
          >
            <span>Date</span>
            {lastPurchaseItems.map((entry) => (
              <span key={`lp-h-${entry.key}`}>{entry.label}</span>
            ))}
            <span>Total</span>
          </div>
          <div
            className={`grid grid-cols-[1.15fr_repeat(8,minmax(0,1fr))] items-center px-4 py-4 ${
              dark ? "bg-[#161722] text-white" : "bg-white text-[#17223b]"
            }`}
          >
            <div className="flex items-center justify-center text-center">
              <span className="text-[15px] font-semibold leading-tight whitespace-nowrap">{formatDate(lastPurchase.date)}</span>
            </div>
            {lastPurchaseItems.map((entry) => (
              <div key={`lp-v-${entry.key}`} className="flex items-center justify-center text-center">
                <span className="text-[18px] font-semibold leading-none">{formatCount(entry.qty)}</span>
              </div>
            ))}
            <div className="flex items-center justify-center text-center">
              <span className={`text-[18px] font-semibold leading-none ${dark ? "text-[#3ad0a3]" : "text-[#1aa974]"}`}>
                {formatCount(lastPurchaseTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getInitials(name = "") {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function SectionTable({ dark, rows, onOpen, variant = "default" }) {
  if (!rows.length) {
    return (
      <div className={`px-5 py-10 text-center text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
        No records found for the selected filters.
      </div>
    );
  }

  const isFurniture = variant === "furniture";
  const gridTemplate = isFurniture ? "1.2fr 1.25fr 0.95fr 0.35fr" : "1.15fr 0.72fr 0.9fr 0.35fr";
  const headerLabels = isFurniture ? ["Teacher", "Date Range", "Items", ""] : ["Teacher", "Month", "Progress", ""];

  return (
    <div className="px-4 pb-4">
      <div
        className={`overflow-hidden rounded-[20px] border ${
          dark ? "border-white/[0.06] bg-[#161722]" : "border-[#edf2fa] bg-white"
        }`}
      >
        <div
          className={`grid gap-3 border-b px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] ${
            dark ? "border-white/[0.06] bg-white/[0.03] text-[#9e9e9e]" : "border-[#edf2fa] bg-[#f6f8fc] text-[#6f7b95]"
          }`}
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {headerLabels.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>

        <div className="divide-y" style={{ divideColor: dark ? "rgba(255,255,255,0.06)" : "rgb(234 240 248)" }}>
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => onOpen(row)}
              className={`grid w-full gap-3 px-5 py-4 text-left transition ${
                dark ? "hover:bg-white/[0.03]" : "hover:bg-[#f7faff]"
              }`}
              style={{ gridTemplateColumns: gridTemplate }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${
                    dark ? "bg-[#7c4dff]/18 text-[#d4c8ff]" : "bg-[#eff3ff] text-[#6b66f3]"
                  }`}
                >
                  {getInitials(row.teacherName)}
                </div>
                <div className="min-w-0">
                  <p className={`truncate text-[16px] font-semibold ${dark ? "text-white" : "text-[#24324f]"}`}>
                    {row.teacherName}
                  </p>
                  <p className={`mt-1 truncate text-[13px] ${dark ? "text-[#9e9e9e]" : "text-[#6f7b95]"}`}>{row.classSection}</p>
                </div>
              </div>

              {isFurniture ? (
                <div className={`self-center text-[15px] ${dark ? "text-[#9e9e9e]" : "text-[#55627d]"}`}>{row.dateRange}</div>
              ) : (
                <div className={`self-center text-[15px] ${dark ? "text-[#9e9e9e]" : "text-[#55627d]"}`}>{row.subtitle}</div>
              )}

              {isFurniture ? (
                <div className={`self-center text-[15px] ${dark ? "text-white" : "text-[#55627d]"}`}>{row.metric}</div>
              ) : row.covered && row.remaining ? (
                <div className="flex items-center justify-start gap-3 self-center text-[15px]">
                  <span className="font-semibold text-[#17a55b]">{row.covered}</span>
                  <span className={dark ? "text-[#9e9e9e]" : "text-[#c6cedb]"}>/</span>
                  <span className="font-semibold text-[#ea3e4f]">{row.remaining}</span>
                </div>
              ) : (
                <div className={`self-center text-[15px] ${dark ? "text-[#9e9e9e]" : "text-[#55627d]"}`}>{row.metric}</div>
              )}

              <div className="flex items-center justify-end">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                    dark
                      ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e] hover:bg-white/[0.06] hover:text-white"
                      : "border-[#e5ebf5] bg-white text-[#7f8aa8] hover:bg-[#f6f8fc] hover:text-[#24324f]"
                  }`}
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
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

function IconDownload() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3v10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 9l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 15.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getSyllabusExportFileBase(item = {}) {
  return `syllabus-${String(item.teacherName || "teacher").toLowerCase().replace(/\s+/g, "-")}-${String(
    item.classSection || "class-section"
  )
    .toLowerCase()
    .replace(/\s+/g, "-")}`;
}

async function captureSyllabusNode(node) {
  if (!node) throw new Error("Syllabus preview not ready");
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));

  const previousOverflow = node.style.overflow;
  const previousOverflowX = node.style.overflowX;
  node.style.overflow = "visible";
  node.style.overflowX = "visible";

  try {
    return await html2canvas(node, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: Math.max(node.scrollWidth, node.clientWidth),
      windowHeight: Math.max(node.scrollHeight, node.clientHeight),
    });
  } finally {
    node.style.overflow = previousOverflow;
    node.style.overflowX = previousOverflowX;
  }
}

async function exportSyllabusAsPng(node, filename) {
  const canvas = await captureSyllabusNode(node);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function exportSyllabusAsPdf(node, filename) {
  const canvas = await captureSyllabusNode(node);
  const imgData = canvas.toDataURL("image/png");
  // Use design pixel size so PDF page matches the syllabus layout
  const pdf = new jsPDF({
    orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
    unit: "pt",
    format: [canvas.width, canvas.height],
  });
  pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save(`${filename}.pdf`);
}

async function printSyllabusDesign(node) {
  const canvas = await captureSyllabusNode(node);
  const imgData = canvas.toDataURL("image/png");
  // html2canvas uses scale:2 — preview/print at CSS pixel size for correct layout
  const cssWidth = Math.max(1, Math.round(canvas.width / 2));
  const cssHeight = Math.max(1, Math.round(canvas.height / 2));
  const widthIn = cssWidth / 96;
  const heightIn = cssHeight / 96;

  const printWindow = window.open("", "_blank", "width=1100,height=900");
  if (!printWindow) {
    throw new Error("Popup blocked. Allow popups to print the syllabus.");
  }

  printWindow.document.open();
  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Syllabus Print Preview</title>
    <style>
      @page { size: ${widthIn}in ${heightIn}in; margin: 0; }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        background: #eef2ff;
        font-family: Montserrat, Inter, Arial, sans-serif;
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
        .preview-card img {
          width: 100%;
          max-width: none;
        }
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
        <img id="syllabus-print-image" src="${imgData}" alt="Syllabus design preview" />
      </div>
    </div>
  </body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
}

function buildSyllabusExportRows(item) {
  const className = item.className || item.classSection?.split(" - ")?.[0] || "-";
  const section = item.section || item.classSection?.split(" - ")?.[1] || "-";
  const fromDate = formatDate(item.from);
  const toDate = formatDate(item.to);

  return [
    ["Teacher Name", "Class", "Section", "From Date", "To Date", "Subject", "Syllabus", "Chapters", "Topics", "Covered %", "Remaining %"],
    ...item.books.map((book) => [
      item.teacherName || "-",
      className,
      section,
      fromDate,
      toDate,
      book.bookName,
      book.syllabus,
      book.chapters || book.syllabus,
      book.topics || book.more || "-",
      `${book.coveredPercent}%`,
      `${100 - Number(book.coveredPercent || 0)}%`,
    ]),
  ];
}

function buildFurnitureExportRows(item) {
  const className = item.className || item.classSection?.split(" - ")?.[0] || "-";
  const section = item.section || item.classSection?.split(" - ")?.[1] || "-";

  return [
    ["Teacher Name", "Class", "Section", "From Date", "To Date", "Furniture Status", "Bulbs", "Fans", "Windows", "Mirrors", "More"],
    [
      item.teacherName || "-",
      className,
      section,
      formatDate(item.from),
      formatDate(item.to),
      item.brokenDeskBenchChairs || "-",
      item.bulbs ?? 0,
      item.fans ?? 0,
      item.windows ?? 0,
      item.mirrors ?? 0,
      item.more || "-",
    ],
  ];
}

const toDateKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const parseCoveredPercent = (value) => {
  const num = Number(String(value ?? "0").replace("%", "").trim());
  return Number.isFinite(num) ? num : 0;
};

const mapSyllabusApiRecord = (doc = {}) => {
  const teacher = doc.teacherId && typeof doc.teacherId === "object" ? doc.teacherId : null;
  const teacherName = teacher?.fullName || teacher?.name || teacher?.email || "Teacher";
  const rows = Array.isArray(doc.rows) ? doc.rows : [];
  const coveredValues = rows.map((row) => parseCoveredPercent(row.covered));
  const overallCoverage = coveredValues.length
    ? Math.round(coveredValues.reduce((sum, value) => sum + value, 0) / coveredValues.length)
    : 0;
  const isAnnual = doc.mode === "ANNUALLY" || doc.month == null || doc.month === "";
  const monthIndex = isAnnual ? 0 : Number(doc.month);
  const year = Number(doc.year) || new Date().getFullYear();
  const from = new Date(year, Number.isFinite(monthIndex) ? monthIndex : 0, 1);
  const to = isAnnual
    ? new Date(year, 11, 31)
    : new Date(year, (Number.isFinite(monthIndex) ? monthIndex : 0) + 1, 0);
  const fallbackMonthTitle = isAnnual
    ? "ANNUALLY"
    : MONTH_OPTIONS.find((entry) => Number(entry.value) === monthIndex + 1)?.label?.toUpperCase() || "";
  return {
    id: doc._id,
    teacherId: teacher?._id || doc.teacherId,
    teacherName,
    className: doc.className || "",
    section: doc.section || "A",
    classSection: `${doc.className || "-"} - ${doc.section || "A"}`,
    from: toDateKey(from),
    to: toDateKey(to),
    mode: doc.mode || (isAnnual ? "ANNUALLY" : "MONTHLY"),
    month: isAnnual ? null : doc.month,
    year,
    overallCoverage,
    bookTitle: doc.bookTitle || "BOOKS NAME",
    monthTitle: doc.monthTitle || fallbackMonthTitle,
    books: rows.map((row) => ({
      bookName: row.subject,
      syllabus: row.syllabus,
      coveredPercent: parseCoveredPercent(row.covered),
      more: "",
    })),
    rows,
  };
};

const categoryBrokenTotal = (items, categories) =>
  items
    .filter((item) => categories.includes(item.category))
    .reduce((sum, item) => sum + Number(item.broken || 0), 0);

const categoryUnitTotal = (items, categories) =>
  items
    .filter((item) => categories.includes(item.category))
    .reduce(
      (sum, item) =>
        sum +
        Number(item.working || 0) +
        Number(item.broken || 0) +
        Number(item.underMaintenance || 0) +
        Number(item.missing || 0) +
        Number(item.replaced || 0),
      0
    );

const categoryWorkingTotal = (items, categories) =>
  items
    .filter((item) => categories.includes(item.category))
    .reduce((sum, item) => sum + Number(item.working || 0), 0);

/** Same Available/Broken rules as Finance Manager `/assets/summary` (Available = working). */
const summarizeFurnitureInventory = (assets = []) => {
  const categoryCount = (categories, field) =>
    assets
      .filter((item) => categories.includes(item.category))
      .reduce((sum, item) => sum + Number(item[field] || 0), 0);

  const desksCategories = ["DESKS"];
  const benchesChairsCategories = ["BENCHES", "CHAIRS", "BENCHES_CHAIRS", "TEACHER_CHAIRS"];
  const bulbsCategories = ["BULBS"];
  const fansCategories = ["FANS"];

  return {
    totalDesks: categoryCount(desksCategories, "working"),
    brokenDesks: categoryCount(desksCategories, "broken"),
    totalBenchesChairs: categoryCount(benchesChairsCategories, "working"),
    brokenBenchesChairs: categoryCount(benchesChairsCategories, "broken"),
    totalBulbs: categoryCount(bulbsCategories, "working"),
    brokenBulbs: categoryCount(bulbsCategories, "broken"),
    totalFans: categoryCount(fansCategories, "working"),
    brokenFans: categoryCount(fansCategories, "broken"),
  };
};

const mapFurnitureFromAssets = (assets = [], branch) => {
  const groups = new Map();
  assets.forEach((item) => {
    if (!item?.className) return;
    const section = item.section || "A";
    const key = `${item.className}|${section}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });

  return Array.from(groups.entries()).map(([key, items]) => {
    const [className, section] = key.split("|");
    const desks = categoryBrokenTotal(items, ["DESKS"]);
    const benches = categoryBrokenTotal(items, ["BENCHES", "BENCHES_CHAIRS"]);
    const chairs = categoryBrokenTotal(items, ["CHAIRS", "BENCHES_CHAIRS", "TEACHER_CHAIRS"]);
    const bulbs = categoryBrokenTotal(items, ["BULBS", "TUBE_LIGHTS"]);
    const fans = categoryBrokenTotal(items, ["FANS"]);
    const windows = categoryBrokenTotal(items, ["WINDOWS"]);
    const mirrors = categoryBrokenTotal(items, ["MIRRORS"]);
    const desksTotal = categoryUnitTotal(items, ["DESKS"]);
    const benchesTotal = categoryUnitTotal(items, ["BENCHES", "BENCHES_CHAIRS"]);
    const chairsTotal = categoryUnitTotal(items, ["CHAIRS", "BENCHES_CHAIRS", "TEACHER_CHAIRS"]);
    const bulbsTotal = categoryUnitTotal(items, ["BULBS", "TUBE_LIGHTS"]);
    const fansTotal = categoryUnitTotal(items, ["FANS"]);
    const windowsTotal = categoryUnitTotal(items, ["WINDOWS"]);
    const mirrorsTotal = categoryUnitTotal(items, ["MIRRORS"]);
    const desksAvailable = categoryWorkingTotal(items, ["DESKS"]);
    const benchesAvailable = categoryWorkingTotal(items, ["BENCHES", "BENCHES_CHAIRS"]);
    const chairsAvailable = categoryWorkingTotal(items, ["CHAIRS", "BENCHES_CHAIRS", "TEACHER_CHAIRS"]);
    const bulbsAvailable = categoryWorkingTotal(items, ["BULBS", "TUBE_LIGHTS"]);
    const fansAvailable = categoryWorkingTotal(items, ["FANS"]);
    const windowsAvailable = categoryWorkingTotal(items, ["WINDOWS"]);
    const mirrorsAvailable = categoryWorkingTotal(items, ["MIRRORS"]);
    const updatedAt = items
      .map((row) => row.updatedAt || row.createdAt)
      .filter(Boolean)
      .sort()
      .at(-1);
    const dateKey = updatedAt ? toDateKey(new Date(updatedAt)) : toDateKey(new Date());
    return {
      id: `${branch}-${key}`,
      teacherName: `${className} Assets`,
      className,
      section,
      classSection: `${className} - ${section}`,
      from: dateKey,
      to: dateKey,
      desks,
      benches,
      chairs,
      bulbs,
      fans,
      windows,
      mirrors,
      desksTotal,
      benchesTotal,
      chairsTotal,
      bulbsTotal,
      fansTotal,
      windowsTotal,
      mirrorsTotal,
      desksAvailable,
      benchesAvailable,
      chairsAvailable,
      bulbsAvailable,
      fansAvailable,
      windowsAvailable,
      mirrorsAvailable,
      brokenDeskBenchChairs: `${desks} desks / ${benches} benches / ${chairs} chairs`,
      more: `${items.length} asset records synced from Finance Manager inventory`,
      lastPurchase: {
        date: dateKey,
        desks: { qty: desksTotal, quality: "Live" },
        benches: { qty: benchesTotal, quality: "Live" },
        chairs: { qty: chairsTotal, quality: "Live" },
        bulbs: { qty: bulbsTotal, quality: "Live" },
        fans: { qty: fansTotal, quality: "Live" },
        windows: { qty: windowsTotal, quality: "Live" },
        mirrors: { qty: mirrorsTotal, quality: "Live" },
      },
    };
  });
};

export default function RoleDashboard({ role, onNavigate, dark = false, branchSection = "Boys" }) {
  const isSuperAdmin = role === "SUPER_ADMIN";
  const now = new Date();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeModal, setActiveModal] = useState(null);
  const [syllabusViewMode, setSyllabusViewMode] = useState("monthly");
  const [selectedSyllabusMonth, setSelectedSyllabusMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [selectedSyllabusYear, setSelectedSyllabusYear] = useState(String(now.getFullYear()));
  const [selectedClassSection, setSelectedClassSection] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [syllabusModalMonth, setSyllabusModalMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [syllabusEditing, setSyllabusEditing] = useState(false);
  const [syllabusDraftRows, setSyllabusDraftRows] = useState([]);
  const [syllabusRowOverrides, setSyllabusRowOverrides] = useState({});
  const [selectedFurnitureClass, setSelectedFurnitureClass] = useState("");
  const [selectedFurnitureSection, setSelectedFurnitureSection] = useState("");
  const [liveSyllabus, setLiveSyllabus] = useState([]);
  const [liveFurniture, setLiveFurniture] = useState([]);
  const [liveAssets, setLiveAssets] = useState([]);
  const [furnitureInventory, setFurnitureInventory] = useState({
    totalDesks: 0,
    brokenDesks: 0,
    totalBenchesChairs: 0,
    brokenBenchesChairs: 0,
    totalBulbs: 0,
    brokenBulbs: 0,
    totalFans: 0,
    brokenFans: 0,
  });
  const [syllabusTeacherOptions, setSyllabusTeacherOptions] = useState([{ value: "", label: "Select All Teachers" }]);
  const [classSectionOptions, setClassSectionOptions] = useState([{ value: "", label: "Select All Classes & Sections" }]);
  const [furnitureClassOptions, setFurnitureClassOptions] = useState(allClassOptions);
  const [furnitureSectionOptions, setFurnitureSectionOptions] = useState(allSectionOptions);
  const [panelError, setPanelError] = useState("");
  const [savingSyllabus, setSavingSyllabus] = useState(false);
  const [syllabusExportOpen, setSyllabusExportOpen] = useState(false);
  const [syllabusExporting, setSyllabusExporting] = useState(false);
  const syllabusExportRef = useRef(null);

  const selectedBranch = branchKey(branchSection);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const endpoint = isSuperAdmin ? "/dashboard/super-admin" : "/dashboard/teacher";
        const response = await api.get(endpoint, {
          params: isSuperAdmin ? { branch: branchSection } : undefined,
        });
        setData(response.data?.data || {});
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isSuperAdmin, branchSection]);

  useEffect(() => {
    if (!isSuperAdmin) return undefined;
    let cancelled = false;

    const loadPanels = async () => {
      setPanelError("");
      const mode = syllabusViewMode === "annually" ? "ANNUALLY" : "MONTHLY";
      const syllabusParams = {
        branch: selectedBranch,
        mode,
        year: Number(selectedSyllabusYear) || new Date().getFullYear(),
      };
      if (mode === "MONTHLY") syllabusParams.month = Math.max(0, Number(selectedSyllabusMonth) - 1);

      try {
        const syllabusRes = await api.get("/teacher-panel/principal/syllabi", { params: syllabusParams });
        if (cancelled) return;
        const syllabusItems = (syllabusRes.data?.data || []).map(mapSyllabusApiRecord);
        setSyllabusRowOverrides({});
        setLiveSyllabus(syllabusItems);
        setActiveModal((current) => {
          if (!current || current.type !== "syllabus" || !current.item) return current;
          const match =
            syllabusItems.find((row) => String(row.id) === String(current.item.id)) ||
            syllabusItems.find(
              (row) =>
                String(row.teacherId) === String(current.item.teacherId) &&
                row.className === current.item.className &&
                (row.section || "A") === (current.item.section || "A")
            );
          return match ? { ...current, item: match } : current;
        });
      } catch (err) {
        if (!cancelled) {
          setPanelError(err.response?.data?.message || "Failed to sync syllabus panel");
          setLiveSyllabus([]);
        }
      }

      try {
        const [teachersRes, classRes, assetsSummaryRes] = await Promise.all([
          api.get("/teachers", { params: { page: 1, limit: 500, branch: selectedBranch } }),
          api.get("/teacher-panel/class-options", { params: { branch: selectedBranch } }),
          api.get("/assets/summary", { params: { branch: selectedBranch } }),
        ]);
        if (cancelled) return;

        const teachers = teachersRes.data?.data?.items || [];
        setSyllabusTeacherOptions([
          { value: "", label: "Select All Teachers" },
          ...teachers.map((teacher) => ({
            value: String(teacher._id),
            label: teacher.fullName || teacher.name || teacher.email || "Teacher",
          })),
        ]);

        const classes = classRes.data?.data || [];
        const classOptions = [
          { value: "", label: "Select All Classes & Sections" },
          ...classes.map((item) => ({
            value: `${item.className}|${item.section || "A"}`,
            label: `${item.className} - ${item.section || "A"}`,
          })),
        ];
        const uniqueClassOptions = [];
        const seen = new Set();
        classOptions.forEach((option) => {
          if (seen.has(option.value)) return;
          seen.add(option.value);
          uniqueClassOptions.push(option);
        });
        setClassSectionOptions(uniqueClassOptions);

        // Load every inventory page so SA furniture cards/details match Finance Manager totals.
        const assets = [];
        let page = 1;
        let totalPages = 1;
        do {
          const assetsRes = await api.get("/assets", {
            params: { branch: selectedBranch, page, limit: 500 },
          });
          if (cancelled) return;
          const payload = assetsRes.data?.data || {};
          assets.push(...(payload.items || []));
          totalPages = Math.max(Number(payload.totalPages || 1), 1);
          page += 1;
        } while (page <= totalPages);

        const furnitureRows = mapFurnitureFromAssets(assets, selectedBranch);
        setLiveAssets(assets);
        setLiveFurniture(furnitureRows);
        const summary = assetsSummaryRes.data?.data || {};
        const fromRows = summarizeFurnitureInventory(assets);
        // Prefer live row math (Available = working) so cards stay in sync with details after status updates.
        setFurnitureInventory({
          totalDesks: Number(fromRows.totalDesks ?? summary.totalDesks ?? 0),
          brokenDesks: Number(fromRows.brokenDesks ?? summary.brokenDesks ?? 0),
          totalBenchesChairs: Number(fromRows.totalBenchesChairs ?? summary.totalBenchesChairs ?? 0),
          brokenBenchesChairs: Number(fromRows.brokenBenchesChairs ?? summary.brokenBenchesChairs ?? 0),
          totalBulbs: Number(fromRows.totalBulbs ?? summary.totalBulbs ?? 0),
          brokenBulbs: Number(fromRows.brokenBulbs ?? summary.brokenBulbs ?? 0),
          totalFans: Number(fromRows.totalFans ?? summary.totalFans ?? 0),
          brokenFans: Number(fromRows.brokenFans ?? summary.brokenFans ?? 0),
        });

        const classNames = [...new Set(furnitureRows.map((row) => row.className).filter(Boolean))].sort();
        const sections = [...new Set(furnitureRows.map((row) => row.section).filter(Boolean))].sort();
        setFurnitureClassOptions([
          { value: "", label: "Select All Classes" },
          ...classNames.map((className) => ({ value: className, label: className })),
        ]);
        setFurnitureSectionOptions([
          { value: "", label: "Select All Sections" },
          ...sections.map((section) => ({ value: section, label: `Section ${section}` })),
        ]);
      } catch (err) {
        if (cancelled) return;
        setPanelError((prev) => prev || err.response?.data?.message || "Failed to sync furniture panel");
      }
    };

    loadPanels();
    const timer = window.setInterval(loadPanels, 3000);
    const onFocus = () => loadPanels();
    const onVisibility = () => {
      if (document.visibilityState === "visible") loadPanels();
    };
    const unsubscribe = subscribeSyllabusUpdated(() => {
      setSyllabusRowOverrides({});
      loadPanels();
    });
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribe();
    };
  }, [isSuperAdmin, selectedBranch, syllabusViewMode, selectedSyllabusMonth, selectedSyllabusYear]);

  const branchSyllabus = useMemo(() => {
    return liveSyllabus.filter((item) => {
      const [className = "", section = ""] = selectedClassSection ? selectedClassSection.split("|") : [];
      const matchesClassSection = !selectedClassSection || (item.className === className && item.section === section);
      const matchesTeacher = !selectedTeacher || String(item.teacherId) === String(selectedTeacher);
      return matchesClassSection && matchesTeacher;
    });
  }, [liveSyllabus, selectedClassSection, selectedTeacher]);

  const getSyllabusOverrideKey = (item, mode, monthValue) =>
    `${item?.id || "syllabus"}|${mode}|${mode === "annually" ? monthValue || "00" : getMonthValueFromDate(item?.from)}`;

  const getSyllabusModalRows = (item, mode, monthValue) => {
    if (!item) return [];
    const key = getSyllabusOverrideKey(item, mode, monthValue);
    if (syllabusRowOverrides[key]) return syllabusRowOverrides[key];
    return buildSyllabusSheetRows(item);
  };

  const openSyllabusModal = (item) => {
    const monthValue = getMonthValueFromDate(item?.from);
    setSyllabusModalMonth(monthValue);
    setSyllabusEditing(false);
    setSyllabusDraftRows(getSyllabusModalRows(item, syllabusViewMode, monthValue));
    setActiveModal({ type: "syllabus", item });
  };

  const closeActiveModal = () => {
    setActiveModal(null);
    setSyllabusEditing(false);
    setSyllabusDraftRows([]);
    setSyllabusExportOpen(false);
  };

  const handleSyllabusDesignExport = async (format) => {
    if (!syllabusExportRef.current || syllabusExporting) return;
    setSyllabusExporting(true);
    setSyllabusExportOpen(false);
    setPanelError("");
    try {
      const filename = getSyllabusExportFileBase(activeModal?.item || {});
      if (format === "png") {
        await exportSyllabusAsPng(syllabusExportRef.current, filename);
      } else if (format === "pdf") {
        await exportSyllabusAsPdf(syllabusExportRef.current, filename);
      } else if (format === "print") {
        await printSyllabusDesign(syllabusExportRef.current);
      }
    } catch (err) {
      setPanelError(err?.message || "Failed to export syllabus");
    } finally {
      setSyllabusExporting(false);
    }
  };

  const beginSyllabusEdit = () => {
    if (!activeModal?.item) return;
    setSyllabusDraftRows(getSyllabusModalRows(activeModal.item, syllabusViewMode, syllabusModalMonth));
    setSyllabusEditing(true);
  };

  const cancelSyllabusEdit = () => {
    if (!activeModal?.item) return;
    setSyllabusDraftRows(getSyllabusModalRows(activeModal.item, syllabusViewMode, syllabusModalMonth));
    setSyllabusEditing(false);
  };

  const saveSyllabusEdit = async () => {
    if (!activeModal?.item?.teacherId) {
      setPanelError("Teacher is required to save syllabus.");
      return;
    }
    setSavingSyllabus(true);
    setPanelError("");
    try {
      const item = activeModal.item;
      const mode = syllabusViewMode === "annually" ? "ANNUALLY" : "MONTHLY";
      const monthIndex = Math.max(0, Number(syllabusModalMonth || selectedSyllabusMonth) - 1);
      const yearValue = Number(item.year || selectedSyllabusYear);
      const monthTitle =
        mode === "ANNUALLY"
          ? "ANNUALLY"
          : MONTH_OPTIONS.find((entry) => entry.value === syllabusModalMonth)?.label?.toUpperCase() ||
            item.monthTitle ||
            "";
      await api.post("/teacher-panel/syllabi", {
        teacherId: item.teacherId,
        className: item.className,
        section: item.section || "A",
        branch: selectedBranch,
        mode,
        month: mode === "MONTHLY" ? monthIndex : null,
        year: yearValue,
        monthTitle,
        bookTitle: item.bookTitle || "BOOKS NAME",
        rows: syllabusDraftRows.map((row) => ({
          subject: row.subject,
          syllabus: row.syllabus,
          covered: String(row.covered || "").replace("%", ""),
        })),
      });
      const key = getSyllabusOverrideKey(item, syllabusViewMode, syllabusModalMonth);
      setSyllabusRowOverrides((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      setSyllabusEditing(false);
      const refreshed = await api.get("/teacher-panel/principal/syllabi", {
        params: {
          branch: selectedBranch,
          mode,
          year: yearValue,
          ...(mode === "MONTHLY" ? { month: monthIndex } : {}),
          teacherId: item.teacherId,
          className: item.className,
          section: item.section || "A",
        },
      });
      const mapped = (refreshed.data?.data || []).map(mapSyllabusApiRecord);
      setLiveSyllabus((current) => {
        if (!mapped.length) return current;
        const byId = new Map(current.map((row) => [String(row.id), row]));
        mapped.forEach((row) => byId.set(String(row.id), row));
        return Array.from(byId.values());
      });
      const nextItem =
        mapped.find((row) => String(row.id) === String(item.id)) ||
        mapped.find(
          (row) =>
            String(row.teacherId) === String(item.teacherId) &&
            row.className === item.className &&
            (row.section || "A") === (item.section || "A") &&
            (mode === "ANNUALLY" ? row.mode === "ANNUALLY" || row.month == null : Number(row.month) === monthIndex)
        ) ||
        mapped[0];
      if (nextItem) setActiveModal({ type: "syllabus", item: nextItem });
      notifySyllabusUpdated({
        teacherId: item.teacherId,
        className: item.className,
        section: item.section || "A",
        mode,
        year: yearValue,
        month: mode === "MONTHLY" ? monthIndex : null,
      });
    } catch (err) {
      setPanelError(err.response?.data?.message || "Failed to save syllabus");
    } finally {
      setSavingSyllabus(false);
    }
  };

  const updateSyllabusDraftRow = (subject, field, value) => {
    setSyllabusDraftRows((current) =>
      current.map((row) => (row.subject === subject ? { ...row, [field]: value } : row))
    );
  };
  const branchFurniture = useMemo(() => {
    return liveFurniture.filter((item) => {
      const matchesClass = !selectedFurnitureClass || item.className === selectedFurnitureClass;
      const matchesSection = !selectedFurnitureSection || item.section === selectedFurnitureSection;
      return matchesClass && matchesSection;
    });
  }, [liveFurniture, selectedFurnitureClass, selectedFurnitureSection]);
  const syllabusExportRows = useMemo(() => {
    const rows = [
      ["Teacher Name", "Class", "Section", "From Date", "To Date", "Subjects", "Syllabus", "Covered %", "Remaining %"],
    ];
    branchSyllabus.forEach((item) => {
      item.books.forEach((book) => {
        rows.push([
          item.teacherName,
          item.className,
          item.section,
          formatDate(item.from),
          formatDate(item.to),
          book.bookName,
          book.syllabus,
          `${book.coveredPercent}%`,
          `${100 - Number(book.coveredPercent || 0)}%`,
        ]);
      });
    });
    return rows;
  }, [branchSyllabus]);
  const selectedClassSectionLabel =
    classSectionOptions.find((item) => item.value === selectedClassSection)?.label || "All Classes & Sections";
  const selectedTeacherLabel =
    syllabusTeacherOptions.find((item) => item.value === selectedTeacher)?.label || "All Teachers";
  const selectedPeriodLabel =
    syllabusViewMode === "annually"
      ? `Annually: ${selectedSyllabusYear || "All Years"}`
      : `Monthly: ${MONTH_OPTIONS.find((item) => item.value === selectedSyllabusMonth)?.label || "All Months"}`;

  if (loading) return <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Loading dashboard...</p>;
  if (error) return <p className="text-sm text-rose-500">{error}</p>;

  if (!isSuperAdmin) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Teacher Dashboard</h2>
          <p className="text-sm text-slate-500">Your classroom overview.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Assigned Classes" value={data.cards?.assignedClasses ?? 0} tone="blue" icon={IconClasses} />
          <StatCard title="Today's Attendance" value={data.cards?.todaysAttendance ?? 0} tone="green" icon={IconClock} />
          <StatCard title="Total Students" value={data.cards?.totalStudents ?? 0} tone="purple" icon={IconStudents} />
          <StatCard title="Pending Tasks" value={data.cards?.pendingTasks ?? 0} tone="orange" icon={IconTasks} />
        </div>
      </section>
    );
  }

  const cards = data.cards || {};

  const teacherStats = [
    { label: "Total Teachers", value: cards.totalTeachers ?? 0, tone: "purple", icon: IconTeachers },
    { label: "Present Teachers", value: cards.presentTeachers ?? 0, tone: "green", icon: IconPresent },
    { label: "Absent Teachers", value: cards.absentTeachers ?? 0, tone: "rose", icon: IconAbsent },
  ];

  const studentStats = [
    { label: "Total Students", value: cards.totalStudents ?? 0, tone: "green", icon: IconStudents },
    { label: "Present Students", value: cards.presentStudents ?? 0, tone: "green", icon: IconPresent },
    { label: "Absent Students", value: cards.absentStudents ?? 0, tone: "rose", icon: IconAbsent },
  ];

  const otherStats = [
    { label: "Pending Fees", value: (cards.pendingFees ?? 0).toLocaleString(), tone: "orange", icon: IconFee },
    { label: "Attendance %", value: `${cards.attendancePercentage ?? 0}%`, tone: "purple", icon: IconAttendance },
    { label: "Total On Leave", value: cards.totalOnLeave ?? 0, tone: "orange", icon: IconLeave },
  ];

  function SyllabusPanelIcon() {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf3ff] text-[#1677ff] shadow-[0_12px_22px_rgba(22,119,255,0.08)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
          <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h4A2.5 2.5 0 0 1 12 6.5V20a.5.5 0 0 1-.8.4L9 18.8l-2.2 1.6A.5.5 0 0 1 6 20V7a2 2 0 0 0-2-2Z" />
          <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4h-4A2.5 2.5 0 0 0 12 6.5V20a.5.5 0 0 0 .8.4l2.2-1.6 2.2 1.6A.5.5 0 0 0 18 20V7a2 2 0 0 1 2-2Z" />
        </svg>
      </div>
    );
  }

  function FurniturePanelIcon() {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#efeaff] text-[#7b56e8] shadow-[0_12px_22px_rgba(123,86,232,0.08)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
          <path d="M7 10h10a2 2 0 0 1 2 2v2H5v-2a2 2 0 0 1 2-2Z" />
          <path d="M6 14v4M18 14v4M8 6h8a2 2 0 0 1 2 2v2H6V8a2 2 0 0 1 2-2Z" />
        </svg>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      {panelError ? <p className="text-sm text-rose-500">{panelError}</p> : null}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <StatsColumnBoard title="Teacher Stats" items={teacherStats} dark={dark} />
        <StatsColumnBoard title="Student Stats" items={studentStats} dark={dark} />
        <StatsColumnBoard title="Other Stats" items={otherStats} dark={dark} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div
          className={`overflow-hidden rounded-[26px] border ${
            dark ? "border-white/[0.06] bg-[#161722]" : "border-[#e7edf7] bg-white"
          } shadow-[0_18px_48px_rgba(15,23,42,0.06)]`}
        >
        <div className={`flex items-start justify-between gap-4 border-b px-5 py-4 ${dark ? "border-white/[0.06]" : "border-[#edf2fa]"}`}>
          <div className="flex min-w-0 items-start gap-4">
              <SyllabusPanelIcon />
              <div className="min-w-0">
                <h3 className={`whitespace-nowrap text-[18px] font-semibold ${dark ? "text-white" : "text-[#24324f]"}`}>Teachers Assign Syllabus</h3>
                <p className={`mt-1 whitespace-nowrap text-[13px] ${dark ? "text-[#9e9e9e]" : "text-[#7d89a3]"}`}>
                  Choose a month, year, class/section, and teacher to narrow the syllabus list.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`inline-flex rounded-full border p-1 ${dark ? "border-white/[0.06] bg-[#1a1b26]" : "border-[#e5ebf5] bg-[#f8fbff]"}`}>
                <button
                  type="button"
                  onClick={() => setSyllabusViewMode("monthly")}
                  className={`rounded-full px-4 py-2 text-[12px] font-semibold transition ${
                    syllabusViewMode === "monthly"
                      ? "bg-[linear-gradient(135deg,#2f83f7_0%,#0b63d8_100%)] text-white shadow-[0_12px_22px_rgba(11,99,216,0.24)]"
                      : dark
                        ? "text-[#9e9e9e] hover:text-white"
                        : "text-[#6f7b95] hover:text-[#24324f]"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setSyllabusViewMode("annually")}
                  className={`rounded-full px-4 py-2 text-[12px] font-semibold transition ${
                    syllabusViewMode === "annually"
                      ? "bg-[linear-gradient(135deg,#2f83f7_0%,#0b63d8_100%)] text-white shadow-[0_12px_22px_rgba(11,99,216,0.24)]"
                      : dark
                        ? "text-[#9e9e9e] hover:text-white"
                        : "text-[#6f7b95] hover:text-[#24324f]"
                  }`}
                >
                  Annually
                </button>
              </div>
            </div>
          </div>

          <div className={`grid gap-4 border-b px-5 py-4 md:grid-cols-2 xl:grid-cols-4 ${dark ? "border-white/[0.06]" : "border-[#edf2fa]"}`}>
            <ScrollableSelect
              label="Month"
              placeholder="Select month"
              value={selectedSyllabusMonth}
              onChange={setSelectedSyllabusMonth}
              options={MONTH_OPTIONS}
              dark={dark}
              disabled={syllabusViewMode === "annually"}
              openUpward
              portal
              menuMaxHeight={280}
            />
            <ScrollableSelect
              label="Year"
              placeholder="Select year"
              value={selectedSyllabusYear}
              onChange={setSelectedSyllabusYear}
              options={YEAR_OPTIONS}
              dark={dark}
              openUpward
              portal
              menuMaxHeight={280}
            />
            <ScrollableSelect
              label="Class & Section"
              placeholder="All Classes"
              value={selectedClassSection}
              onChange={setSelectedClassSection}
              options={classSectionOptions}
              dark={dark}
              openUpward
              portal
              menuMaxHeight={280}
            />
            <ScrollableSelect
              label="Select Teacher"
              placeholder="All Teachers"
              value={selectedTeacher}
              onChange={setSelectedTeacher}
              options={syllabusTeacherOptions}
              dark={dark}
              openUpward
              portal
              menuMaxHeight={280}
            />
          </div>

          <SectionTable
            dark={dark}
            rows={branchSyllabus.map((item) => ({
              ...item,
              subtitle: getSyllabusPeriodLabel(item, syllabusViewMode),
              covered: `${item.overallCoverage}%`,
              remaining: `${Math.max(0, 100 - Number(item.overallCoverage || 0))}%`,
            }))}
            onOpen={(item) => openSyllabusModal(item)}
          />
        </div>

        <div
          className={`overflow-hidden rounded-[26px] border ${
            dark ? "border-white/[0.06] bg-[#161722]" : "border-[#e7edf7] bg-white"
          } shadow-[0_18px_48px_rgba(15,23,42,0.06)]`}
        >
          <div className={`flex items-center justify-between gap-4 border-b px-5 py-4 ${dark ? "border-white/[0.06]" : "border-[#edf2fa]"}`}>
            <div className="flex min-w-0 items-center gap-4">
              <FurniturePanelIcon />
              <div className="min-w-0">
                <h3 className={`text-[18px] font-semibold ${dark ? "text-white" : "text-[#24324f]"}`}>{selectedBranch} Branch Furniture</h3>
                <p className={`mt-1 text-[13px] ${dark ? "text-[#9e9e9e]" : "text-[#7d89a3]"}`}>
                  Broken desks, benches, chairs, bulbs, fans, windows and mirrors
                </p>
              </div>
            </div>
            <div className="rounded-full bg-[#eef4ff] px-4 py-2 text-[12px] font-semibold text-[#6d5ce7]">{branchFurniture.length} rows</div>
          </div>

          <div className={`grid gap-4 border-b px-5 py-4 md:grid-cols-2 ${dark ? "border-white/[0.06]" : "border-[#edf2fa]"}`}>
            <ScrollableSelect
              label="Class"
              placeholder="All Classes"
              value={selectedFurnitureClass}
              onChange={setSelectedFurnitureClass}
              options={furnitureClassOptions}
              dark={dark}
              openUpward
            />
            <ScrollableSelect
              label="Section"
              placeholder="All Sections"
              value={selectedFurnitureSection}
              onChange={setSelectedFurnitureSection}
              options={furnitureSectionOptions}
              dark={dark}
              openUpward
            />
          </div>

          <div className="px-5 py-3">
            <p className={`text-xs ${dark ? "text-[#9e9e9e]" : "text-[#7d89a3]"}`}>
              Selected: {selectedFurnitureClass || "All Classes"} |{" "}
              {selectedFurnitureSection ? `Section ${selectedFurnitureSection}` : "All Sections"}
            </p>
          </div>

          <SectionTable
            dark={dark}
            rows={branchFurniture.map((item) => ({
              ...item,
              subtitle: item.brokenDeskBenchChairs,
              dateRange: `${formatDate(item.from)} to ${formatDate(item.to)}`,
              metric: item.brokenDeskBenchChairs || "0 desks / 0 benches / 0 chairs",
            }))}
            variant="furniture"
            onOpen={(item) => setActiveModal({ type: "furniture", item })}
          />
        </div>
      </div>

      <FormModal
        open={Boolean(activeModal)}
        title={
          activeModal?.type === "syllabus"
            ? "Teachers Assign Syllabus"
            : activeModal?.type === "furniture"
              ? `${selectedBranch} Branch Furniture`
              : ""
        }
        subtitle={
          activeModal?.type === "syllabus"
            ? getSyllabusPeriodLabel(activeModal.item, syllabusViewMode)
            : ""
        }
        onClose={closeActiveModal}
        maxWidthClass="max-w-[1180px]"
        dark={dark}
        scrollBody
        headerActions={
          activeModal?.type === "syllabus" ? (
            <div className="flex items-center gap-2">
              {syllabusEditing ? (
                <>
                  <button
                    type="button"
                    onClick={cancelSyllabusEdit}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      dark
                        ? "border-white/[0.12] bg-white/[0.04] text-[#d7d9e2] hover:bg-white/[0.08]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveSyllabusEdit}
                    disabled={savingSyllabus}
                    className="rounded-full bg-[linear-gradient(135deg,#2f83f7_0%,#0b63d8_100%)] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_10px_18px_rgba(11,99,216,0.22)] disabled:opacity-60"
                  >
                    {savingSyllabus ? "Saving..." : "Save"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={beginSyllabusEdit}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    dark
                      ? "border-[#7c4dff]/30 bg-[#7c4dff]/10 text-[#7c4dff] hover:bg-[#7c4dff]/15"
                      : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  }`}
                >
                  Edit
                </button>
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSyllabusExportOpen((open) => !open)}
                  disabled={syllabusExporting}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                    dark
                      ? "border-[#7c4dff]/30 bg-[#7c4dff]/10 text-[#7c4dff] hover:bg-[#7c4dff]/15"
                      : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  }`}
                  title="Export syllabus"
                  aria-label="Export syllabus"
                  aria-expanded={syllabusExportOpen}
                >
                  <IconDownload />
                </button>
                {syllabusExportOpen ? (
                  <div
                    className={`absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-xl border shadow-lg ${
                      dark ? "border-white/[0.08] bg-[#1a1b26]" : "border-slate-200 bg-white"
                    }`}
                  >
                    {[
                      { key: "pdf", label: "PDF" },
                      { key: "png", label: "PNG" },
                      { key: "print", label: "Print" },
                    ].map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        disabled={syllabusExporting}
                        onClick={() => handleSyllabusDesignExport(option.key)}
                        className={`block w-full px-4 py-2.5 text-left text-sm font-semibold transition ${
                          dark
                            ? "text-[#e8e8ef] hover:bg-white/[0.05]"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {syllabusExporting ? "Exporting..." : option.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : activeModal?.type === "furniture" ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  downloadCsv(
                    `furniture-${String(activeModal.item?.teacherName || "teacher").toLowerCase().replace(/\s+/g, "-")}-${String(
                      activeModal.item?.classSection || "class-section"
                    )
                      .toLowerCase()
                      .replace(/\s+/g, "-")}-${activeModal.item?.from || "from"}-${activeModal.item?.to || "to"}.csv`,
                    buildFurnitureExportRows(activeModal.item || {})
                  )
                }
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                  dark
                    ? "border-[#7c4dff]/30 bg-[#7c4dff]/10 text-[#7c4dff] hover:bg-[#7c4dff]/15"
                    : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                }`}
                title="Export furniture"
                aria-label="Export furniture"
              >
                <IconDownload />
              </button>
            </div>
          ) : null
        }
      >
        {activeModal?.type === "syllabus" ? (
          <div className="flex-1 overflow-hidden">
            <SyllabusModalBody
              item={activeModal.item}
              mode={syllabusViewMode}
              editing={syllabusEditing}
              rows={syllabusEditing ? syllabusDraftRows : getSyllabusModalRows(activeModal.item, syllabusViewMode, syllabusModalMonth)}
              onRowChange={updateSyllabusDraftRow}
              exportRef={syllabusExportRef}
            />
          </div>
        ) : null}
        {activeModal?.type === "furniture" ? (
          <div className="flex-1 overflow-hidden">
            <FurnitureModalBody item={activeModal.item} dark={dark} />
          </div>
        ) : null}
      </FormModal>
    </section>
  );
}
