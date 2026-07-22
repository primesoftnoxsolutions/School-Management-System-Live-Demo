import { useCallback, useEffect, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import api from "../../services/api/client";
import ScrollableSelect from "../../components/ui/ScrollableSelect";
import { BRANCH_OPTIONS } from "../../constants/classes";
import { withTeacherBranchParams } from "../../utils/branch";
import {
  DEFAULT_BREAK,
  TIME_TABLE_CLASS_COLUMNS,
  buildDefaultTimeTableState,
  createEmptyAssignments,
  extractSubjectFromCell,
  normalizeTimeTablePayload,
  toTimeTableClassColumn,
} from "../../constants/timeTable";

function formatPeriodTime(start, end) {
  return `${start} - ${end}`;
}

function parseTeacherCell(value) {
  const raw = String(value || "").trim();
  const match = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(raw);
  if (match) return { teacherName: match[1].trim(), subject: match[2].trim() };
  return { teacherName: "", subject: raw };
}

function formatTeacherCell(teacherName, subject) {
  if (teacherName && subject) return `${teacherName} (${subject})`;
  return teacherName || subject || "";
}

function namesMatch(a, b) {
  const left = String(a || "").trim().toLowerCase();
  const right = String(b || "").trim().toLowerCase();
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function buildTeacherClassIndex(teachers = []) {
  const inchargeByColumn = {};
  const teachersByColumn = {};

  teachers.forEach((teacher) => {
    const name = teacher.fullName || teacher.name || "";
    const inchargeList = teacher.profile?.classInchargeClasses || teacher.classInchargeClasses || [];
    inchargeList.forEach((className) => {
      const col = toTimeTableClassColumn(className);
      if (col && !inchargeByColumn[col]) {
        inchargeByColumn[col] = { id: teacher._id, name, subjects: [] };
      }
    });

    (teacher.assignedClasses || []).forEach((assignment) => {
      const col = toTimeTableClassColumn(assignment.className);
      if (!col) return;
      if (!teachersByColumn[col]) teachersByColumn[col] = [];
      let entry = teachersByColumn[col].find((item) => item.id === teacher._id);
      if (!entry) {
        entry = { id: teacher._id, name, subjects: [] };
        teachersByColumn[col].push(entry);
      }
      const subject = String(assignment.subject || "").trim();
      if (subject && subject.toLowerCase() !== "class teacher" && !entry.subjects.includes(subject)) {
        entry.subjects.push(subject);
      }
    });
  });

  Object.keys(inchargeByColumn).forEach((col) => {
    const match = teachersByColumn[col]?.find((item) => item.id === inchargeByColumn[col].id);
    if (match) inchargeByColumn[col].subjects = match.subjects;
  });

  return { inchargeByColumn, teachersByColumn };
}

function getInchargeFirstSubject(inchargeOrSubjects) {
  const subjects = Array.isArray(inchargeOrSubjects)
    ? inchargeOrSubjects
    : inchargeOrSubjects?.subjects || [];
  return subjects.find((subject) => String(subject || "").trim()) || "Class Teacher";
}

function applyInchargePrefill(tableState, inchargeByColumn) {
  const next = {
    ...tableState,
    classTeachers: { ...(tableState.classTeachers || createEmptyAssignments()) },
    periods: (tableState.periods || []).map((period) => ({
      ...period,
      assignments: { ...(period.assignments || createEmptyAssignments()) },
    })),
  };

  TIME_TABLE_CLASS_COLUMNS.forEach((col) => {
    const incharge = inchargeByColumn[col];
    if (!incharge) return;

    if (!String(next.classTeachers[col] || "").trim()) {
      next.classTeachers[col] = incharge.name;
    }

    const period1 = next.periods.find((period) => Number(period.number) === 1);
    if (!period1) return;

    const firstSubject = getInchargeFirstSubject(incharge);
    const cell = String(period1.assignments[col] || "").trim();
    const extracted = extractSubjectFromCell(cell);
    const shouldReplace =
      !cell ||
      /^class\s*teacher/i.test(cell) ||
      /^class\s*teacher/i.test(extracted) ||
      incharge.subjects.some((subject) => subject.toLowerCase() === extracted.toLowerCase()) ||
      incharge.subjects.some((subject) => subject.toLowerCase() === cell.toLowerCase());

    // Lecture 1 shows the incharge teacher's first assigned subject for this class.
    if (shouldReplace) {
      period1.assignments[col] = firstSubject;
    }
  });

  return next;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getTeacherNameCell(value) {
  return String(value || "").trim() || "Teacher";
}

function getClassHeaderMeta(className) {
  if (className === "PG") {
    return { title: "PG", subtitle: "Play-Group" };
  }

  return { title: className, subtitle: "" };
}

function IconExportPdf({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v10" />
      <path d="M8 9l4 4 4-4" />
      <path d="M5 15v4h14v-4" />
      <rect x="5" y="19" width="14" height="2" rx="1" />
    </svg>
  );
}

function buildExportPeriodRows({ periods, classColumns, classTeachers, breakAfter, breakLabel, breakStart, breakEnd, includeBreak }) {
  return periods
    .map((period) => {
      const cells = classColumns
        .map((classColumn) => {
          const teacherName = getTeacherNameCell(classTeachers?.[classColumn]);
          const subject = String(period.assignments?.[classColumn] || "").trim() || "Subjects";
          return `
            <td class="period-cell">
              <div class="cell-teacher">${escapeHtml(teacherName)}</div>
              <div class="cell-subject">${escapeHtml(subject)}</div>
            </td>
          `;
        })
        .join("");

      const breakRow =
        includeBreak && period.number === breakAfter
          ? `
            <tr>
              <td class="break-row" colspan="${classColumns.length + 1}">
                ${escapeHtml(breakLabel)} ${escapeHtml(breakStart)} - ${escapeHtml(breakEnd)}
              </td>
            </tr>
          `
          : "";

      return `
        <tr>
          <td class="lecture-cell">
            <div class="lecture-number">${escapeHtml(period.number)}</div>
            <div class="lecture-time">${escapeHtml(formatPeriodTime(period.start, period.end))}</div>
          </td>
          ${cells}
        </tr>
        ${breakRow}
      `;
    })
    .join("");
}

function buildExportSectionMarkup({
  title,
  campusLabel,
  classColumns,
  periods,
  classTeachers,
  breakAfter,
  breakLabel,
  breakStart,
  breakEnd,
  includeBreak,
}) {
  const headerCells = classColumns
    .map((classColumn) => {
      const { title, subtitle } = getClassHeaderMeta(classColumn);
      const teacherName = getTeacherNameCell(classTeachers?.[classColumn]);
      return `
        <th class="class-head">
          <div class="class-name">${escapeHtml(title)}</div>
          ${subtitle ? `<div class="class-subtitle">${escapeHtml(subtitle)}</div>` : ""}
          <div class="teacher-name">${escapeHtml(teacherName)}</div>
        </th>
      `;
    })
    .join("");

  return `
    <section class="sheet">
      <div class="sheet-header">
        <div class="school-name">Naseer Ideal Public School</div>
        <div class="sheet-title">${escapeHtml(title)}</div>
        <div class="campus-name">${escapeHtml(campusLabel)}</div>
      </div>
      <table class="timetable">
        <thead>
          <tr>
            <th class="lecture-head">Lecture No#</th>
            ${headerCells}
          </tr>
        </thead>
        <tbody>
          ${buildExportPeriodRows({
            periods,
            classColumns,
            classTeachers,
            breakAfter,
            breakLabel,
            breakStart,
            breakEnd,
            includeBreak,
          })}
        </tbody>
      </table>
    </section>
  `;
}

export default function TeacherTimeTablePage({ dark = false, branchSection = "Boys", onTimetableUpdated }) {
  const [branch, setBranch] = useState(branchSection === "Girls" ? "Girls" : "Boys");
  const [tableState, setTableState] = useState(() => buildDefaultTimeTableState(branchSection === "Girls" ? "Girls" : "Boys"));
  const [teachersByColumn, setTeachersByColumn] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const branchOptions = BRANCH_OPTIONS.map((value) => ({ value, label: `${value} Campus` }));

  const loadTimeTable = useCallback(async (selectedBranch) => {
    setLoading(true);
    setError("");
    try {
      const [ttRes, teachersRes] = await Promise.all([
        api.get("/timetables", { params: { branch: selectedBranch } }),
        api.get("/teachers", { params: withTeacherBranchParams({ page: 1, limit: 500 }, selectedBranch) }),
      ]);

      const teachers = teachersRes.data?.data?.items || [];
      const { inchargeByColumn, teachersByColumn: byColumn } = buildTeacherClassIndex(teachers);
      setTeachersByColumn(byColumn);

      let normalized = normalizeTimeTablePayload(ttRes.data?.data, selectedBranch);
      // Fill empty class-incharge header / first-lecture subject only — never overwrite saved cells.
      normalized = applyInchargePrefill(normalized, inchargeByColumn);
      setTableState(normalized);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load time table");
      setTableState(buildDefaultTimeTableState(selectedBranch));
      setTeachersByColumn({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const nextBranch = branchSection === "Girls" ? "Girls" : "Boys";
    setBranch(nextBranch);
  }, [branchSection]);

  useEffect(() => {
    loadTimeTable(branch);
  }, [branch, loadTimeTable]);

  const updateCell = (periodIndex, classColumn, value) => {
    setSuccess("");
    setTableState((prev) => ({
      ...prev,
      periods: prev.periods.map((period, index) =>
        index === periodIndex
          ? {
              ...period,
              assignments: {
                ...period.assignments,
                [classColumn]: value,
              },
            }
          : period
      ),
    }));
  };

  const updateClassTeacher = (classColumn, value) => {
    setSuccess("");
    setTableState((prev) => {
      const trimmed = String(value || "").trim();
      const matchedTeacher = (teachersByColumn[classColumn] || []).find((item) =>
        namesMatch(item.name, trimmed)
      );
      const firstSubject = matchedTeacher ? getInchargeFirstSubject(matchedTeacher) : trimmed ? "Class Teacher" : "";

      const nextPeriods = (prev.periods || []).map((period) => {
        if (Number(period.number) !== 1) return period;
        const assignments = { ...(period.assignments || {}) };
        assignments[classColumn] = trimmed ? firstSubject : "";
        return { ...period, assignments };
      });
      return {
        ...prev,
        classTeachers: {
          ...(prev.classTeachers || {}),
          [classColumn]: value,
        },
        periods: nextPeriods,
      };
    });
  };

  const selectLectureTeacher = (periodIndex, classColumn, optionValue) => {
    setSuccess("");
    const periodNumber = Number(tableState.periods?.[periodIndex]?.number || 0);
    if (periodNumber === 1) return;

    if (!optionValue) {
      updateCell(periodIndex, classColumn, "");
      return;
    }

    const [teacherId, ...subjectParts] = String(optionValue).split("::");
    const subjectFromValue = subjectParts.join("::").trim();
    const options = teachersByColumn[classColumn] || [];
    const teacher = options.find((item) => item.id === teacherId);
    if (!teacher) {
      updateCell(periodIndex, classColumn, "");
      return;
    }

    const subject = subjectFromValue || teacher.subjects[0] || "";
    updateCell(periodIndex, classColumn, formatTeacherCell(teacher.name, subject));
  };

  const handleExportPdf = async () => {
    if (loading) return;

    const pageOneColumns = TIME_TABLE_CLASS_COLUMNS.slice(0, 8);
    const pageTwoColumns = TIME_TABLE_CLASS_COLUMNS.slice(8);
    const pageOnePeriods = tableState.periods.filter((period) => period.number <= 5);
    const pageTwoPeriods = tableState.periods.filter((period) => period.number >= 6);

    const exportRoot = document.createElement("div");
    exportRoot.setAttribute("aria-hidden", "true");
    exportRoot.style.position = "fixed";
    exportRoot.style.left = "-10000px";
    exportRoot.style.top = "0";
    exportRoot.style.width = "1600px";
    exportRoot.style.background = "#ffffff";
    exportRoot.innerHTML = `
      <style>
        * { box-sizing: border-box; }
        .export-root {
          width: 1600px;
          padding: 20px;
          background: #fff;
          color: #0f172a;
          font-family: Arial, sans-serif;
        }
        .sheet {
          width: 100%;
          margin-bottom: 24px;
          overflow: hidden;
          border-radius: 18px;
          box-shadow: 0 0 0 1px #d8def0;
          break-after: page;
          page-break-after: always;
        }
        .sheet:last-child {
          margin-bottom: 0;
          break-after: auto;
          page-break-after: auto;
        }
        .sheet-header {
          background: linear-gradient(90deg, #4b36d2 0%, #6f58ff 50%, #4b36d2 100%);
          color: #fff;
          text-align: center;
          padding: 18px 16px 16px;
        }
        .school-name {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .22em;
          text-transform: uppercase;
          opacity: .88;
        }
        .sheet-title {
          margin-top: 6px;
          font-size: 24px;
          font-weight: 800;
          line-height: 1.1;
        }
        .campus-name {
          margin-top: 8px;
          display: inline-block;
          border: 1px solid rgba(255,255,255,.3);
          background: rgba(255,255,255,.12);
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 700;
        }
        .timetable {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .timetable th,
        .timetable td {
          border: 1px solid #d8def0;
          vertical-align: top;
        }
        .lecture-head,
        .class-head {
          background: #4b36d2;
          color: #fff;
          padding: 12px 8px;
          text-align: center;
        }
        .lecture-head {
          width: 120px;
          font-size: 11px;
          letter-spacing: .14em;
          text-transform: uppercase;
          font-weight: 800;
        }
        .class-name {
          font-size: 15px;
          font-weight: 800;
          line-height: 1.1;
        }
        .class-subtitle {
          margin-top: 4px;
          font-size: 10px;
          font-weight: 700;
          line-height: 1.15;
          opacity: .9;
          text-transform: uppercase;
          letter-spacing: .12em;
        }
        .teacher-name {
          margin-top: 8px;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.25;
          letter-spacing: .04em;
          text-transform: uppercase;
        }
        .lecture-cell {
          width: 120px;
          text-align: center;
          padding: 16px 8px;
          background: #fff;
        }
        .lecture-number {
          font-size: 18px;
          font-weight: 800;
          line-height: 1.1;
          color: #111827;
        }
        .lecture-time {
          margin-top: 8px;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.35;
          color: #64748b;
        }
        .period-cell {
          text-align: center;
          padding: 16px 10px;
          background: #fff;
          min-height: 78px;
        }
        .cell-teacher {
          font-size: 13px;
          font-weight: 700;
          line-height: 1.25;
          color: #334155;
        }
        .cell-subject {
          margin-top: 8px;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.35;
          color: #0f172a;
        }
        .break-row {
          background: #eef0ff;
          color: #4b36d2;
          text-align: center;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: .08em;
          padding: 14px 10px;
          text-transform: uppercase;
        }
        .sheet-note {
          padding: 8px 0 0;
          font-size: 11px;
          color: #64748b;
        }
      </style>
      <div class="export-root">
        ${buildExportSectionMarkup({
          title: "PG to 5th",
          campusLabel,
          classColumns: pageOneColumns,
          periods: pageOnePeriods,
          classTeachers: tableState.classTeachers,
          breakAfter,
          breakLabel,
          breakStart,
          breakEnd,
          includeBreak: true,
        })}
        ${buildExportSectionMarkup({
          title: "6th to 10th",
          campusLabel,
          classColumns: pageTwoColumns,
          periods: pageTwoPeriods,
          classTeachers: tableState.classTeachers,
          breakAfter,
          breakLabel,
          breakStart,
          breakEnd,
          includeBreak: false,
        })}
      </div>
    `;

    document.body.appendChild(exportRoot);

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));

      const pdf = new jsPDF("landscape", "pt", "a4");
      const pages = Array.from(exportRoot.querySelectorAll(".sheet"));

      for (let index = 0; index < pages.length; index += 1) {
        const page = pages[index];
        const canvas = await html2canvas(page, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
        });
        const imgData = canvas.toDataURL("image/png");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
        const imgWidth = canvas.width * ratio;
        const imgHeight = canvas.height * ratio;

        if (index > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      }

      pdf.save(`complete_time_table_${tableState.branch.toLowerCase()}.pdf`);
    } catch (err) {
      setError("PDF export failed. Please try again.");
    } finally {
      document.body.removeChild(exportRoot);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const periods = (tableState.periods || []).map((period) => {
        if (Number(period.number) !== 1) return period;
        const assignments = { ...(period.assignments || {}) };
        TIME_TABLE_CLASS_COLUMNS.forEach((col) => {
          const inchargeName = String(tableState.classTeachers?.[col] || "").trim();
          if (!inchargeName) return;
          const matchedTeacher = (teachersByColumn[col] || []).find((item) => namesMatch(item.name, inchargeName));
          const firstSubject = matchedTeacher
            ? getInchargeFirstSubject(matchedTeacher)
            : String(assignments[col] || "").trim() || "Class Teacher";
          assignments[col] = firstSubject;
        });
        return { ...period, assignments };
      });

      const payload = {
        branch: tableState.branch,
        breakTime: tableState.breakTime,
        classTeachers: tableState.classTeachers,
        periods,
      };

      const { data } = await api.put("/timetables", payload);
      setTableState({
        ...normalizeTimeTablePayload(data.data, tableState.branch),
        periods,
        classTeachers: tableState.classTeachers,
        isSaved: true,
      });
      setSuccess(data.message || "Time table saved successfully.");
      onTimetableUpdated?.();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save time table");
    } finally {
      setSaving(false);
    }
  };

  const breakAfter = Number(tableState.breakTime?.afterPeriod || DEFAULT_BREAK.afterPeriod);
  const breakLabel = tableState.breakTime?.label || DEFAULT_BREAK.label;
  const breakStart = tableState.breakTime?.start || DEFAULT_BREAK.start;
  const breakEnd = tableState.breakTime?.end || DEFAULT_BREAK.end;
  const campusLabel = branch === "Girls" ? "Girls Campus" : "Boys Campus";
  const visibleClassColumns =
    currentPage === 1 ? TIME_TABLE_CLASS_COLUMNS.slice(0, 8) : TIME_TABLE_CLASS_COLUMNS.slice(8);
  const visiblePeriods = tableState.periods.filter((period) =>
    currentPage === 1 ? period.number <= 5 : period.number >= 6
  );
  const isFirstPage = currentPage === 1;

  const shellClass = dark
    ? "border-white/[0.08] bg-[#161722] shadow-[0_24px_48px_rgba(0,0,0,0.35)]"
    : "border-slate-200 bg-white shadow-[0_24px_48px_rgba(79,70,229,0.12)]";

  const headerBandClass = dark
    ? "bg-gradient-to-r from-[#4b36d2] via-[#7c4dff] to-[#5b46d8]"
    : "bg-gradient-to-r from-[#4b36d2] via-[#6f58ff] to-[#4b36d2]";

  const tableHeadClass = dark
    ? "bg-[#1a1b26] text-[#ece9ff] border-white/[0.08]"
    : "bg-[#4b36d2] text-white border-[#3d2db8]";

  const lectureHeadClass = dark
    ? "bg-[#131526] text-white border-white/[0.08]"
    : "bg-[#3d2db8] text-white border-[#3527a8]";

  const cellClass = dark
    ? "border-white/[0.06] bg-[#121528]"
    : "border-slate-200 bg-white";

  const inputClass = dark
    ? "w-full min-h-[52px] resize-none border-0 bg-transparent px-1 py-1 text-center text-[15px] font-medium leading-6 text-white outline-none transition placeholder:text-[#6f7394] focus:ring-0"
    : "w-full min-h-[52px] resize-none border-0 bg-transparent px-1 py-1 text-center text-[15px] font-medium leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-0";

  const headerInputClass = dark
    ? "w-full min-h-[54px] resize-none border-0 bg-transparent px-1 py-1 text-center text-[14px] font-semibold uppercase tracking-[0.08em] leading-6 text-white outline-none transition placeholder:text-white/45 focus:ring-0"
    : "w-full min-h-[54px] resize-none border-0 bg-transparent px-1 py-1 text-center text-[14px] font-semibold uppercase tracking-[0.08em] leading-6 text-white outline-none transition placeholder:text-white/60 focus:ring-0";

  const breakRowClass = dark
    ? "bg-[#7c4dff]/18 text-[#ece9ff] border-[#7c4dff]/30"
    : "bg-[#eef0ff] text-[#4b36d2] border-indigo-200";

  const pageButtonBaseClass =
    "rounded-full px-4 py-2 text-sm font-semibold transition [font-family:'Montserrat',sans-serif]";
  const pageButtonActiveClass = dark
    ? "bg-[#7c4dff] text-white shadow-[0_10px_18px_rgba(124,77,255,0.28)]"
    : "bg-[#4b36d2] text-white shadow-[0_10px_18px_rgba(75,54,210,0.22)]";
  const pageButtonInactiveClass = dark
    ? "bg-white/6 text-[#cfc8ff] hover:bg-white/12"
    : "bg-slate-100 text-slate-700 hover:bg-slate-200";

  return (
    <section className="space-y-5 [font-family:'Inter','Segoe_UI',Arial,sans-serif]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            className={`text-2xl font-bold tracking-tight [font-family:'Montserrat','Inter',sans-serif] ${
              dark ? "text-white" : "text-slate-900"
            }`}
          >
            Time Table
          </h2>
          <p className={`mt-1 text-sm font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
            Edit campus-wide class schedules. Changes apply to the selected branch.
          </p>
        </div>

        <div className="w-full max-w-[220px]">
          <ScrollableSelect
            label="Branch"
            placeholder="Select branch"
            value={branch}
            options={branchOptions}
            onChange={(value) => {
              setBranch(value);
              setCurrentPage(1);
              setSuccess("");
            }}
            dark={dark}
            openUpward
          />
        </div>
      </div>

      {error ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            dark ? "border-[#e91e63]/30 bg-[#e91e63]/10 text-[#e91e63]" : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {error}
        </div>
      ) : null}

      {success ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            dark ? "border-[#4caf50]/30 bg-[#4caf50]/10 text-[#4caf50]" : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {success}
        </div>
      ) : null}

      <div className={`overflow-hidden rounded-[28px] border ${shellClass}`}>
        <div className={`relative overflow-hidden px-6 py-7 sm:px-8 ${headerBandClass}`}>
          <div className="pointer-events-none absolute -left-10 top-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -right-8 bottom-0 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

          <div className="relative text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/75 [font-family:'Montserrat',sans-serif]">
              Naseer Ideal Public School
            </p>
            <h3
              className="mt-2 text-[28px] font-extrabold leading-tight text-white sm:text-[34px] [font-family:'Montserrat',sans-serif]"
            >
              All Classes Time Table
            </h3>
            <span
              className="mt-3 inline-flex rounded-full border border-white/25 bg-white/12 px-4 py-1.5 text-sm font-semibold text-white [font-family:'Montserrat',sans-serif]"
            >
              ( {campusLabel} )
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div
              className={`inline-flex rounded-full border p-1 ${
                dark ? "border-white/[0.08] bg-white/5" : "border-slate-200 bg-slate-100"
              }`}
            >
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                className={`${pageButtonBaseClass} ${
                  isFirstPage ? pageButtonActiveClass : pageButtonInactiveClass
                }`}
              >
                PG - 5th
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(2)}
                className={`${pageButtonBaseClass} ${
                  !isFirstPage ? pageButtonActiveClass : pageButtonInactiveClass
                }`}
              >
                6th - 10th
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportPdf}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition [font-family:'Montserrat',sans-serif] ${
                  dark
                    ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
                title="Export timetable as PDF"
                aria-label="Export timetable as PDF"
              >
                <IconExportPdf className="h-4 w-4" />
                Export PDF
              </button>
              <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                Page {currentPage} of 2
              </p>
            </div>
          </div>

          {loading ? (
            <p className={`py-16 text-center text-sm font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
              Loading time table...
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-transparent">
              <table className={`w-full border-collapse text-left ${currentPage === 1 ? "min-w-[1020px]" : "min-w-[620px]"}`}>
                <thead>
                  <tr>
                    <th
                      className={`min-w-[130px] border px-3 py-3 text-center text-[11px] font-bold uppercase tracking-[0.14em] ${lectureHeadClass} [font-family:'Montserrat',sans-serif]`}
                    >
                      Lecture No#
                    </th>
                    {visibleClassColumns.map((className) => {
                      const { title, subtitle } = getClassHeaderMeta(className);
                      return (
                        <th
                          key={className}
                          className={`min-w-[108px] border px-2 py-3 text-center ${tableHeadClass}`}
                        >
                          <span className="block text-[17px] font-bold leading-none [font-family:'Montserrat',sans-serif]">
                            {title}
                          </span>
                          {subtitle ? (
                            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/85 [font-family:'Montserrat',sans-serif]">
                              {subtitle}
                            </span>
                          ) : null}
                          <textarea
                            value={tableState.classTeachers?.[className] || ""}
                            onChange={(e) => updateClassTeacher(className, e.target.value)}
                            placeholder="Teacher name"
                            className={`${headerInputClass} mt-3`}
                            aria-label={`${className} class teacher`}
                            rows={2}
                          />
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {visiblePeriods.map((period) => {
                    const periodIndex = tableState.periods.findIndex((item) => item.number === period.number);
                    const rows = [
                      <tr key={`period-${period.number}`}>
                        <td
                          className={`border px-3 py-3 text-center align-middle ${cellClass}`}
                        >
                          <p
                            className={`text-[15px] font-bold [font-family:'Montserrat',sans-serif] ${
                              dark ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {period.number}
                          </p>
                          <p
                            className={`mt-1 text-[12px] font-semibold tracking-wide ${
                              dark ? "text-[#9e9e9e]" : "text-slate-500"
                            }`}
                          >
                            {formatPeriodTime(period.start, period.end)}
                          </p>
                        </td>
                        {visibleClassColumns.map((classColumn) => {
                          const cellValue = period.assignments[classColumn] || "";
                          const classTeacherName = String(tableState.classTeachers?.[classColumn] || "").trim();
                          const assignedTeachers = teachersByColumn[classColumn] || [];
                          const isFirstLecture = Number(period.number) === 1;
                          const parsed = parseTeacherCell(cellValue);

                          const usedKeys = new Set();
                          (tableState.periods || []).forEach((otherPeriod) => {
                            if (Number(otherPeriod.number) === Number(period.number)) return;
                            const otherCell = String(otherPeriod.assignments?.[classColumn] || "").trim();
                            if (!otherCell) return;
                            const otherParsed = parseTeacherCell(otherCell);
                            const subjectKey = (otherParsed.subject || otherCell).toLowerCase();
                            const teacherKey = (
                              otherParsed.teacherName ||
                              (Number(otherPeriod.number) === 1 ? classTeacherName : "")
                            ).toLowerCase();
                            if (subjectKey) {
                              usedKeys.add(`${teacherKey}::${subjectKey}`);
                              usedKeys.add(`::${subjectKey}`);
                            }
                          });

                          const lectureOptions = assignedTeachers
                            .flatMap((item) => {
                              const subjects = (item.subjects || []).filter(Boolean);
                              if (!subjects.length) {
                                return [
                                  {
                                    value: item.id,
                                    label: item.name,
                                    teacherId: item.id,
                                    teacherName: item.name,
                                    subject: "",
                                  },
                                ];
                              }
                              return subjects.map((subject) => ({
                                value: `${item.id}::${subject}`,
                                label: `${item.name} (${subject})`,
                                teacherId: item.id,
                                teacherName: item.name,
                                subject,
                              }));
                            })
                            .filter((option) => {
                              const key = `${option.teacherName.toLowerCase()}::${option.subject.toLowerCase()}`;
                              const subjectOnlyKey = `::${option.subject.toLowerCase()}`;
                              const isCurrentSelection =
                                Boolean(String(cellValue).trim()) &&
                                ((option.teacherName.toLowerCase() === parsed.teacherName.toLowerCase() &&
                                  option.subject.toLowerCase() === parsed.subject.toLowerCase()) ||
                                  (!parsed.teacherName &&
                                    option.subject &&
                                    option.subject.toLowerCase() === parsed.subject.toLowerCase()));
                              if (isCurrentSelection) return true;
                              return !usedKeys.has(key) && !usedKeys.has(subjectOnlyKey);
                            });

                          let selectedOptionValue = "";
                          if (String(cellValue).trim()) {
                            selectedOptionValue =
                              lectureOptions.find(
                                (item) =>
                                  item.teacherName.toLowerCase() === parsed.teacherName.toLowerCase() &&
                                  item.subject.toLowerCase() === parsed.subject.toLowerCase()
                              )?.value ||
                              lectureOptions.find(
                                (item) =>
                                  !parsed.teacherName &&
                                  item.subject &&
                                  item.subject.toLowerCase() === parsed.subject.toLowerCase()
                              )?.value ||
                              lectureOptions.find(
                                (item) =>
                                  item.teacherName.toLowerCase() === parsed.subject.toLowerCase() && !item.subject
                              )?.value ||
                              "";
                          }

                          const firstLectureSubject =
                            extractSubjectFromCell(cellValue) ||
                            getInchargeFirstSubject(
                              (assignedTeachers || []).find((item) => namesMatch(item.name, classTeacherName))
                            );

                          return (
                            <td key={`${period.number}-${classColumn}`} className={`border p-2 align-middle ${cellClass}`}>
                              {isFirstLecture ? (
                                classTeacherName ? (
                                  <div className="px-1 py-2 text-center">
                                    <p
                                      className={`text-[13px] font-semibold leading-5 ${
                                        dark ? "text-white" : "text-slate-800"
                                      }`}
                                    >
                                      {firstLectureSubject}
                                    </p>
                                    <p className={`mt-1 text-[11px] ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                                      {classTeacherName}
                                    </p>
                                  </div>
                                ) : (
                                  <p
                                    className={`px-1 py-3 text-center text-[12px] ${
                                      dark ? "text-[#6f7394]" : "text-slate-400"
                                    }`}
                                  >
                                    Set class incharge above
                                  </p>
                                )
                              ) : assignedTeachers.length ? (
                                <ScrollableSelect
                                  placeholder="Select teacher"
                                  value={selectedOptionValue}
                                  options={[{ value: "", label: "—" }, ...lectureOptions]}
                                  onChange={(value) => selectLectureTeacher(periodIndex, classColumn, value)}
                                  dark={dark}
                                  portal
                                  menuMaxHeight={220}
                                />
                              ) : (
                                <textarea
                                  value={cellValue}
                                  onChange={(e) => updateCell(periodIndex, classColumn, e.target.value)}
                                  placeholder="Teacher (Subject)"
                                  className={inputClass}
                                  aria-label={`${classColumn} period ${period.number}`}
                                  rows={2}
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>,
                    ];

                    if (isFirstPage && period.number === breakAfter) {
                      rows.push(
                        <tr key="break-row">
                          <td
                            colSpan={visibleClassColumns.length + 1}
                            className={`border px-4 py-3 text-center text-[14px] font-bold tracking-[0.08em] ${breakRowClass} [font-family:'Montserrat',sans-serif]`}
                          >
                            {breakLabel} {breakStart} - {breakEnd}
                          </td>
                        </tr>
                      );
                    }

                    return rows;
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div
          className={`flex flex-col-reverse items-stretch justify-between gap-3 border-t px-5 py-4 sm:flex-row sm:items-center ${
            dark ? "border-white/[0.06] bg-[#121528]/60" : "border-slate-100 bg-slate-50/80"
          }`}
        >
          <p className={`text-xs font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
            Tip: Lecture 1 shows the class incharge&apos;s first assigned subject. Other lectures use Select teacher — each subject once per class.
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className={`rounded-xl px-8 py-3 text-sm font-semibold text-white transition disabled:opacity-60 [font-family:'Montserrat',sans-serif] ${
              dark
                ? "bg-[#7c4dff] shadow-[0_12px_24px_rgba(124,77,255,0.35)] hover:bg-[#875cff]"
                : "bg-gradient-to-r from-[#6f58ff] to-[#4b36d2] shadow-[0_12px_24px_rgba(91,70,220,0.28)] hover:from-[#7c6aff] hover:to-[#543fd8]"
            }`}
          >
            {saving ? "Saving..." : "Save Time Table"}
          </button>
        </div>
      </div>
    </section>
  );
}
