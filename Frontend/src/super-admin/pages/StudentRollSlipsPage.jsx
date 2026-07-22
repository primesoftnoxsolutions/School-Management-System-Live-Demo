import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import api from "../services/api/client";
import ScrollableSelect from "../components/ui/ScrollableSelect";
import { CLASS_OPTIONS, SECTION_OPTIONS } from "../constants/classes";
import { resolveStudentPhotoUrl } from "../utils/mediaUrl";
import { withStudentBranchParams } from "../utils/branch";
import { subscribeAcademicDocumentsUpdated } from "../../utils/academicDocumentsSync";

const PAGE_SIZE = 8;
const DOCUMENTS_POLL_MS = 3000;

function IconSearch({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconEye({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M2.5 12s3.7-6.5 9.5-6.5S21.5 12 21.5 12 17.8 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEdit({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}

function IconPrint({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M6 9V3h12v6" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v7H6z" />
    </svg>
  );
}

function IconExport({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M12 3v10" />
      <path d="M8 9l4 4 4-4" />
      <path d="M5 15.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5" />
    </svg>
  );
}

function IconChevron({ direction = "left", className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      {direction === "left" ? (
        <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function IconPrinterLarge({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M6 9V4h12v5" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      <path d="M6 13h12v7H6z" />
      <path d="M17 8h.01" />
    </svg>
  );
}

function StudentAvatar({ student }) {
  const photo = resolveStudentPhotoUrl(student?.studentPhotoUrl);
  const initials = `${student?.firstName?.[0] || ""}${student?.lastName?.[0] || ""}`.toUpperCase() || "?";

  if (photo) {
    return <img src={photo} alt={student?.firstName || "Student"} className="h-10 w-10 rounded-full object-cover ring-2 ring-white" />;
  }

  return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">{initials}</div>;
}

function GenderPill({ gender }) {
  const female = gender === "FEMALE";
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        female ? "bg-pink-100 text-pink-600" : "bg-indigo-100 text-indigo-600"
      }`}
    >
      {female ? "Female" : "Male"}
    </span>
  );
}

function SlipTypePill({ slipType }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
      {slipType}
    </span>
  );
}

function StatusChip({ ready }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${ready ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
      {ready ? "Ready" : "Pending"}
    </span>
  );
}

function getStudentDisplayName(student) {
  return `${student?.firstName || ""} ${student?.lastName || ""}`.trim() || "-";
}

function getFatherName(student) {
  return student?.fatherName || student?.guardianName || "-";
}

function getClassSection(student) {
  return `${student?.className || "-"} - ${student?.section || "A"}`;
}

function getRollNo(student, index = 0) {
  const raw = String(student?.rollNumber || "").trim();
  if (raw) return raw;
  return String(index + 1);
}

function getStudentId(student) {
  return student?.admissionNo || student?._id || "-";
}

function formatReleaseTime(value) {
  if (!value) return "Released";
  return new Date(value).toLocaleString();
}

function getGradeFromPercentage(percentage) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  if (percentage >= 40) return "E";
  return "F";
}

function buildPageButtons(page, totalPages) {
  const pages = [];
  const push = (value) => {
    if (!pages.includes(value)) pages.push(value);
  };

  push(1);
  if (page > 3) push("...");
  push(Math.max(2, page - 1));
  if (page !== 1 && page !== totalPages) push(page);
  if (page + 1 < totalPages) push(page + 1);
  if (page + 2 < totalPages) push("...");
  if (totalPages > 1) push(totalPages);

  return pages.filter((value, index, array) => value !== "..." || array[index - 1] !== "...");
}

function PrintPreviewModal({ student, slipDoc, slipType, slipTypeLabel = "Slip Type", previewVariant = "rollSlip", onClose, onPrint }) {
  if (!student) return null;

  const payload = slipDoc?.payload || {};
  const releaseLabel = formatReleaseTime(slipDoc?.releaseAt || slipDoc?.releasedAt);

  if (previewVariant === "resultCard") {
    const marks = payload.marks || {};
    const subjects = Object.keys(marks).length
      ? Object.keys(marks)
      : ["ENGLISH", "URDU", "MATHEMATICS", "PHYSICS", "CHEMISTRY", "BIOLOGY", "ISLAMIC STUDIES", "PAKISTAN STUDIES", "COMPUTER SCIENCE"];

    const subjectRows = subjects.map((subject, index) => {
      const obtained = Number(marks[subject] || 0);
      const total = 100;
      const percentage = Number(((obtained / total) * 100).toFixed(2));
      return {
        sr: `${index + 1}.`,
        subject: subject.toUpperCase(),
        total,
        obtained,
        percentage: percentage.toFixed(2),
        grade: getGradeFromPercentage(percentage),
      };
    });

    const totalMarks = subjectRows.reduce((sum, row) => sum + row.total, 0);
    const marksObtained = subjectRows.reduce((sum, row) => sum + row.obtained, 0);
    const overallPercentage = totalMarks ? Number(((marksObtained / totalMarks) * 100).toFixed(2)) : 0;
    const overallGrade = getGradeFromPercentage(overallPercentage);
    const resultStatus = overallPercentage >= 40 ? "Pass" : "Fail";
    const classLabel = `${student.className || "Grade 1"} - ${student.section || "A"}`;
    const registrationId = student.admissionNo || student._id || "-";
    const resultDate = new Date().toLocaleDateString("en-GB");
    const termLabel = String(slipType || "1st Term").toUpperCase();
    const ShieldLogo = () => (
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-[3px] border-[#243a91] bg-white text-[#243a91]">
        <svg viewBox="0 0 24 24" className="h-11 w-11" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3l7 3v5c0 5-3.5 9.4-7 10-3.5-.6-7-5-7-10V6l7-3Z" />
          <path d="M9 11l2 2 4-4" />
        </svg>
      </div>
    );

    return createPortal(
      <div className="fixed inset-0 z-[980] flex items-center justify-center bg-slate-900/45 px-3 py-3 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div
          className="w-[min(980px,calc(100vw-18px))] max-h-[calc(100vh-18px)] overflow-hidden rounded-[16px] border-[3px] border-[#243a91] bg-white shadow-[0_28px_70px_rgba(15,23,42,0.24)]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="max-h-[calc(100vh-92px)] overflow-y-auto p-[10px]">
            <div className="roll-slip-print-area overflow-hidden rounded-[10px] border border-[#2d47a7] bg-white px-5 pb-4 pt-5 sm:px-7">
              <div className="flex items-start justify-between gap-3">
                <ShieldLogo />
                <div className="flex-1 text-center">
                  <h3 className="text-[28px] font-black uppercase leading-tight tracking-[0.01em] text-[#243a91] sm:text-[34px]">
                    Insaaf Grammer High School
                  </h3>
                  <div className="mx-auto mt-2 inline-flex min-w-[220px] justify-center rounded-[6px] bg-[#2d47a7] px-8 py-2 text-[18px] font-black uppercase tracking-wide text-white sm:text-[20px]">
                    Result Card
                  </div>
                  <p className="mt-2 text-[14px] font-bold uppercase tracking-[0.04em] text-[#243a91]">Academic Session: 2024-2025</p>
                  <div className="mx-auto mt-2 inline-flex min-w-[140px] justify-center rounded-[6px] bg-[#2d47a7] px-6 py-1.5 text-[14px] font-black uppercase tracking-wide text-white">
                    {termLabel}
                  </div>
                </div>
                <ShieldLogo />
              </div>

              <div className="mt-5 overflow-hidden rounded-[8px] border border-[#7ea4ef]">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="border-b border-[#7ea4ef] md:border-b-0 md:border-r">
                    <ResultInfoRow label="STUDENT NAME" value={getStudentDisplayName(student)} />
                    <ResultInfoRow label="FATHER NAME" value={getFatherName(student)} />
                    <ResultInfoRow label="CLASS" value={classLabel} last />
                  </div>
                  <div>
                    <ResultInfoRow label="ROLL NO." value={getRollNo(student)} />
                    <ResultInfoRow label="REGISTRATION ID" value={registrationId} />
                    <ResultInfoRow label="DATE OF RESULT" value={resultDate} last />
                  </div>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-[8px] border border-[#7ea4ef]">
                <table className="w-full border-separate border-spacing-0 text-center">
                  <thead>
                    <tr className="bg-[#2d47a7] text-white">
                      {["Sr. No.", "Subjects", "Total Marks", "Marks Obtained", "Percentage (%)", "Grade"].map((head) => (
                        <th key={head} className="border-r border-blue-300 px-2 py-3 text-[13px] font-bold last:border-r-0 sm:text-[14px]">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subjectRows.map((row) => (
                      <tr key={row.sr} className="bg-white text-[#243a91]">
                        <td className="border-b border-r border-[#7ea4ef] px-2 py-2.5 text-[13px] font-semibold sm:text-[14px]">{row.sr}</td>
                        <td className="border-b border-r border-[#7ea4ef] px-3 py-2.5 text-left text-[13px] font-bold uppercase sm:text-[14px]">{row.subject}</td>
                        <td className="border-b border-r border-[#7ea4ef] px-2 py-2.5 text-[13px] font-semibold sm:text-[14px]">{row.total}</td>
                        <td className="border-b border-r border-[#7ea4ef] px-2 py-2.5 text-[13px] font-bold sm:text-[14px]">{row.obtained}</td>
                        <td className="border-b border-r border-[#7ea4ef] px-2 py-2.5 text-[13px] font-semibold sm:text-[14px]">{row.percentage}</td>
                        <td className="border-b border-[#7ea4ef] px-2 py-2.5 text-[13px] font-bold sm:text-[14px]">{row.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="bg-[#2d47a7] py-2 text-center text-[15px] font-black uppercase tracking-wide text-white">Result Summary</div>
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="border-b border-[#7ea4ef] md:border-b-0 md:border-r">
                    <ResultInfoRow label="TOTAL MARKS" value={totalMarks} />
                    <ResultInfoRow label="OVERALL PERCENTAGE" value={`${overallPercentage.toFixed(2)}%`} />
                    <ResultInfoRow label="RESULT" value={resultStatus} last />
                  </div>
                  <div>
                    <ResultInfoRow label="MARKS OBTAINED" value={marksObtained} />
                    <ResultInfoRow label="OVERALL GRADE" value={overallGrade} last />
                    <div className="hidden min-h-[46px] md:block" />
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-8 px-2 sm:grid-cols-2 sm:gap-16">
                <div className="pt-2">
                  <div className="mx-auto h-px w-[78%] bg-[#2d47a7]" />
                  <p className="mt-1 text-center text-[13px] font-bold uppercase text-[#243a91]">Principal</p>
                </div>
                <div className="pt-2">
                  <div className="mx-auto h-px w-[78%] bg-[#2d47a7]" />
                  <p className="mt-1 text-center text-[13px] font-bold uppercase text-[#243a91]">Class Teacher Signature</p>
                </div>
              </div>

              <p className="mt-5 text-center text-[12px] font-medium text-slate-500">Portal release: {releaseLabel}</p>
            </div>
          </div>

          <div className="roll-slip-print-hide flex justify-end gap-2 border-t border-blue-200 bg-white px-4 py-3">
            <button type="button" className="rounded-xl border border-blue-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#2d47a7] hover:bg-blue-50" onClick={onClose}>
              Close
            </button>
            <button type="button" className="rounded-xl bg-[#2d47a7] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#243c92]" onClick={onPrint}>
              Print Card
            </button>
          </div>
        </div>
      </div>,
      globalThis.document.body
    );
  }

  if (previewVariant === "dateSheet") {
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    const dateSheetRows = rows.map((row, index) => [
      `${index + 1}.`,
      String(row.subject || "").toUpperCase(),
      String(row.day || "").toUpperCase(),
      String(row.dateLabel || row.date || "").toUpperCase(),
    ]);
    const paperTime = payload.paperTime || rows[0]?.time || "08:30 AM - 11:30 AM";
    const classText = `CLASS: ${String(student.className || "").toUpperCase()} ${String(student.section || "A").toUpperCase()}`;

    return createPortal(
      <div className="fixed inset-0 z-[980] flex items-center justify-center bg-slate-900/45 px-3 py-3 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="w-[min(1180px,calc(100vw-18px))] max-h-[calc(100vh-18px)] overflow-hidden rounded-[16px] border-[3px] border-blue-700 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.24)]" onMouseDown={(e) => e.stopPropagation()}>
          <div className="h-full overflow-hidden p-[8px]">
            <div className="roll-slip-print-area h-full overflow-hidden rounded-[10px] border border-blue-700 bg-white">
              <div className="flex items-start justify-between px-6 pb-2 pt-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-blue-700 bg-white text-blue-700">
                  <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 3l7 3v5c0 5-3.5 9.4-7 10-3.5-.6-7-5-7-10V6l7-3Z" />
                    <path d="M9 11l2 2 4-4" />
                  </svg>
                </div>
                <div className="flex-1 text-center">
                  <h3 className="text-[34px] font-black uppercase leading-none tracking-[0.01em] text-[#243a91]">Date Sheet</h3>
                  <div className="mx-auto mt-2 inline-flex min-w-[350px] justify-center rounded-[3px] bg-[#2d47a7] px-6 py-2 text-[22px] font-black uppercase text-white">
                    {classText}
                  </div>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-blue-700 bg-white text-blue-700">
                  <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 3l7 3v5c0 5-3.5 9.4-7 10-3.5-.6-7-5-7-10V6l7-3Z" />
                    <path d="M9 11l2 2 4-4" />
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-0 px-6 pb-3 pt-3 md:grid-cols-2">
                <InfoBar label="EXAMINATION" value={String(slipType || slipDoc?.term || "1ST TERM").toUpperCase()} />
                <InfoBar label="EXAM TIME" value={String(paperTime).toUpperCase()} alignRight />
              </div>

              <div className="px-6 pb-3">
                <div className="overflow-hidden rounded-[3px] border border-blue-400">
                  <table className="w-full border-separate border-spacing-0 text-center">
                    <colgroup>
                      <col style={{ width: "8%" }} />
                      <col style={{ width: "24%" }} />
                      <col style={{ width: "16%" }} />
                      <col style={{ width: "21%" }} />
                      <col style={{ width: "31%" }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-[#2d47a7] text-white">
                        {["Sr. No.", "Subject", "Day", "Date", "Time"].map((head) => (
                          <th key={head} className="border-r border-blue-300 px-3 py-3 text-[15px] font-bold last:border-r-0">
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dateSheetRows.length ? dateSheetRows.map((row) => (
                        <tr key={row[0]} className="bg-white text-[#243a91]">
                          <td className="border-b border-r border-blue-300 px-2 py-3 text-[15px] font-bold">{row[0]}</td>
                          <td className="border-b border-r border-blue-300 px-3 py-3 text-[14px] font-bold">{row[1]}</td>
                          <td className="border-b border-r border-blue-300 px-3 py-3 text-[14px] font-bold">{row[2]}</td>
                          <td className="border-b border-r border-blue-300 px-3 py-3 text-[14px] font-bold">
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex-1 text-center">{row[3]}</span>
                            </div>
                          </td>
                          <td className="border-b border-blue-300 px-3 py-3 text-[14px] font-bold">{rows[Number(row[0].replace(".", "")) - 1]?.time || paperTime}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-sm text-slate-500">No date sheet rows in released document.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 px-6 pb-5 md:grid-cols-[1.15fr_0.75fr] md:items-end">
                <div className="rounded-[4px] border border-blue-300 bg-white p-3">
                  <div className="inline-flex rounded-[3px] bg-[#2d47a7] px-3 py-1 text-[12px] font-bold uppercase text-white">
                    Important Instructions:
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] font-semibold leading-[1.2] text-[#243a91]">
                    <li>Students must reach the exam center at least 30 minutes before exam time.</li>
                    <li>Mobile phones and smart watches are not allowed in the examination hall.</li>
                    <li>Use of unfair means will result in disqualification.</li>
                  </ul>
                  <p className="mt-2 text-[12px] font-semibold text-[#243a91]">Portal release: {releaseLabel}</p>
                </div>
                <div className="pb-2 pt-8">
                  <div className="mx-auto h-px w-[78%] bg-[#2d47a7]" />
                  <p className="mt-1 text-center text-[14px] font-bold uppercase text-[#243a91]">Principal Signature</p>
                </div>
              </div>
            </div>
          </div>

          <div className="roll-slip-print-hide flex justify-end gap-2 border-t border-blue-200 bg-white px-4 py-3">
            <button type="button" className="rounded-xl border border-blue-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#2d47a7] hover:bg-blue-50" onClick={onClose}>
              Close
            </button>
            <button type="button" className="rounded-xl bg-[#2d47a7] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#243c92]" onClick={onPrint}>
              Print Slip
            </button>
          </div>
        </div>
      </div>,
      globalThis.document.body
    );
  }

  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const subjectRows = rows.length
    ? rows.map((row, index) => [
        `${index + 1}.`,
        String(row.subject || "").toUpperCase(),
        String(row.day || "").toUpperCase(),
        String(row.dateLabel || row.date || "").toUpperCase(),
        String(row.time || "08:30"),
      ])
    : [];

  const rollNo = getRollNo(student);
  const registrationId = student.admissionNo || "-";
  const examStarts = rows[0]?.dateLabel || rows[0]?.date || "-";
  const releaseTime = releaseLabel;
  const classLabel = `${student.className || "-"} - ${student.section || "A"}`;
  const photo = resolveStudentPhotoUrl(student.studentPhotoUrl);

  return createPortal(
    <div className="fixed inset-0 z-[980] flex items-center justify-center bg-slate-900/45 px-2 py-2 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-[min(1180px,calc(100vw-16px))] max-h-[calc(100vh-16px)] overflow-hidden rounded-[14px] border-[3px] border-blue-700 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.24)]" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden p-[10px]">
            <div className="roll-slip-print-area h-full overflow-hidden rounded-[10px] border border-blue-500 bg-white">
              <div className="flex items-center justify-between bg-[#2d47a7] px-4 py-2 text-white">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#2d47a7] shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 3l7 3v5c0 5-3.5 9.4-7 10-3.5-.6-7-5-7-10V6l7-3Z" />
                    <path d="M9 11l2 2 4-4" />
                  </svg>
                </div>
                <div className="text-center leading-none">
                  <h3 className="text-[32px] font-black uppercase tracking-[0.02em]">Insaaf Grammer High School</h3>
                  <p className="mt-1 text-[13px] font-bold uppercase tracking-[0.28em]">Roll No. Slip</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#2d47a7] shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 3l7 3v5c0 5-3.5 9.4-7 10-3.5-.6-7-5-7-10V6l7-3Z" />
                    <path d="M9 11l2 2 4-4" />
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 px-5 pb-2 pt-3 md:grid-cols-[1.08fr_0.95fr_96px] md:items-start">
                <div className="space-y-3 pt-1">
                  <DetailLine label="Roll No." value={rollNo} />
                  <DetailLine label="Student Name" value={getStudentDisplayName(student)} />
                  <DetailLine label="Father Name" value={getFatherName(student)} />
                  <DetailLine label="Class" value={classLabel} />
                </div>
                <div className="space-y-3 pt-1">
                  <DetailLine label="Registration ID" value={registrationId} />
                  <DetailLine label="Exam Starts" value={examStarts} />
                  <DetailLine label="Release Time" value={releaseTime} />
                  <DetailLine label={slipTypeLabel} value={slipType} />
                </div>
                <div className="flex h-[96px] items-center justify-center rounded-[4px] border border-blue-500 bg-white text-center text-[11px] font-semibold uppercase text-[#2d47a7]">
                  {photo ? <img src={photo} alt={getStudentDisplayName(student)} className="h-full w-full object-cover" /> : <span>Candidate<br />Photo</span>}
                </div>
              </div>

              <div className="px-5 pb-3">
                <div className="overflow-hidden rounded-[6px] border border-blue-400">
                  <div className="bg-[#2d47a7] py-1 text-center text-[18px] font-black uppercase tracking-wide text-white">Date Sheet</div>
                  <table className="w-full border-separate border-spacing-0 text-center text-[14px]">
                    <colgroup>
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "31%" }} />
                      <col style={{ width: "22%" }} />
                      <col style={{ width: "23%" }} />
                      <col style={{ width: "14%" }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-[#eef3ff] text-[#24305f]">
                        {["SR. NO.", "SUBJECT", "DAY", "DATE", "TIME"].map((head) => (
                          <th key={head} className="border-b border-r border-blue-300 px-3 py-2 text-[14px] font-bold last:border-r-0">
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {subjectRows.length ? subjectRows.map((row) => (
                        <tr key={`${row[0]}-${row[1]}`} className="bg-white text-[#28345f]">
                          {row.map((cell, index) => (
                            <td key={`${row[0]}-${index}`} className={`border-b border-r border-blue-300 px-3 py-1.5 last:border-r-0 ${index === 0 || index === 1 || index === 3 || index === 4 ? "font-bold" : "font-normal"}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-sm text-slate-500">No schedule rows in released document.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 px-5 pb-4 md:grid-cols-[1fr_220px_220px] md:items-end">
                <div className="rounded-[6px] border border-blue-300 bg-white px-3 py-2">
                  <p className="text-[14px] font-bold uppercase text-[#2d47a7]">Instructions</p>
                  <p className="mt-1 text-[12px] font-semibold leading-[1.25] text-[#24305f]">
                    Bring this roll no slip and school ID card on every paper day.
                    <br />
                    Reach the examination hall 30 minutes before paper time.
                    <br />
                    Mobile phones and unfair means are strictly prohibited.
                  </p>
                </div>
                <div className="pt-8">
                  <div className="mx-auto h-px w-[80%] bg-[#2d47a7]" />
                  <p className="mt-1 text-center text-[12px] font-bold uppercase text-[#24305f]">Principal Signature</p>
                </div>
                <div className="pt-8">
                  <div className="mx-auto h-px w-[80%] bg-[#2d47a7]" />
                  <p className="mt-1 text-center text-[12px] font-bold uppercase text-[#24305f]">Teacher Signature</p>
                </div>
              </div>
            </div>
          </div>

          <div className="roll-slip-print-hide flex justify-end gap-2 border-t border-blue-200 bg-white px-4 py-3">
            <button type="button" className="rounded-xl border border-blue-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#2d47a7] hover:bg-blue-50" onClick={onClose}>
              Close
            </button>
            <button type="button" className="rounded-xl bg-[#2d47a7] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#243c92]" onClick={onPrint}>
              Print Slip
            </button>
          </div>
        </div>
      </div>
    </div>,
      globalThis.document.body
    );
}

function DetailLine({ label, value }) {
  return (
    <div className="grid grid-cols-[120px_14px_1fr] items-end gap-3 text-[#24305f] md:grid-cols-[132px_14px_1fr]">
      <span className="text-[15px] font-bold">{label}</span>
      <span className="text-[15px] font-bold">:</span>
      <span className="border-b border-[#6ca0ff] pb-0.5 text-[15px] font-bold text-[#1f2c53]">{value}</span>
    </div>
  );
}

function ResultInfoRow({ label, value, last = false }) {
  return (
    <div className={`grid grid-cols-[150px_12px_1fr] items-center gap-2 px-4 py-3 text-[#243a91] sm:grid-cols-[170px_14px_1fr] ${last ? "" : "border-b border-[#7ea4ef]"}`}>
      <span className="text-[12px] font-bold uppercase sm:text-[13px]">{label}</span>
      <span className="text-[13px] font-bold">:</span>
      <span className="text-[13px] font-bold sm:text-[14px]">{value}</span>
    </div>
  );
}

function InfoBar({ label, value, alignRight = false }) {
  return (
    <div
      className={`flex items-center border border-blue-300 px-4 py-3 text-[#243a91] ${
        alignRight ? "justify-start md:border-l-0" : "justify-start"
      }`}
    >
      <span className="text-[16px] font-black uppercase">{label}:</span>
      <span className="ml-2 text-[16px] font-bold uppercase">{value}</span>
    </div>
  );
}

function EditSlipModal({
  student,
  slipType,
  onClose,
  onSave,
  dark = false,
  slipTypeLabel = "Slip Type",
  slipTypeOptions = [],
  editModalTitle = "Edit Roll Slip",
}) {
  const [nextSlipType, setNextSlipType] = useState(slipType);

  useEffect(() => {
    setNextSlipType(slipType);
  }, [slipType, student?._id]);

  if (!student) return null;

  return createPortal(
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-slate-900/45 px-4 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`w-full max-w-xl overflow-hidden rounded-2xl border ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white"} shadow-[0_24px_64px_rgba(15,23,42,0.18)]`} onMouseDown={(e) => e.stopPropagation()}>
        <div className={`border-b px-6 py-4 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
          <h3 className={`text-lg font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{editModalTitle}</h3>
          <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{getStudentDisplayName(student)}</p>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className={`mb-2 text-sm font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-700"}`}>Roll No</p>
              <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${dark ? "border-white/[0.06] bg-[#1a1b26] text-white" : "border-slate-200 bg-slate-50 text-slate-800"}`}>{getRollNo(student)}</div>
            </div>
            <div>
              <p className={`mb-2 text-sm font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-700"}`}>Student ID</p>
              <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${dark ? "border-white/[0.06] bg-[#1a1b26] text-white" : "border-slate-200 bg-slate-50 text-slate-800"}`}>{getStudentId(student)}</div>
            </div>
          </div>
          <ScrollableSelect
            label={slipTypeLabel}
            value={nextSlipType}
            options={slipTypeOptions}
            onChange={setNextSlipType}
            portal
            dark={dark}
          />
        </div>
        <div className={`flex justify-end gap-2 border-t px-6 py-4 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
          <button type="button" className="ref-btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="ref-btn-primary" onClick={() => onSave(nextSlipType)}>
            Save
          </button>
        </div>
      </div>
    </div>,
      globalThis.document.body
    );
}

export default function StudentRollSlipsPage({
  dark = false,
  branchSection = "Boys",
  documentType = "ROLL_SLIP",
  previewVariant = "rollSlip",
  title = "Roll Slips",
  subtitle = "Released roll slips from teacher portal appear here.",
  listTitle = "Roll Slips List",
  slipTypeLabel = "Slip Type",
  slipTypePlaceholder = "Select Slip Type",
  slipTypeOptions = [
    { value: "", label: "Select Slip Type" },
    { value: "Examination", label: "Examination" },
    { value: "Monthly Test", label: "Monthly Test" },
  ],
  rowTypeLabels = ["Examination", "Monthly Test"],
  exportFileName = "roll_slips.csv",
  emptyMessage = "No roll slips found.",
  filtersPlacement = "header",
  classSelectLabel = "Principal Class",
  sectionSelectLabel = "Section",
  studentSelectLabel = "Student",
  editModalTitle = "Edit Roll Slip",
}) {
  const [releasedItems, setReleasedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [studentFilter, setStudentFilter] = useState("");
  const [slipTypeFilter, setSlipTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [previewRow, setPreviewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
        setError("");
      }
      try {
        const { data } = await api.get("/academic-documents/released", {
          params: withStudentBranchParams(
            {
              documentType,
              className: classFilter || "",
              section: sectionFilter || "",
              term: slipTypeFilter || "",
            },
            branchSection
          ),
        });
        if (!cancelled) setReleasedItems(data.data || []);
      } catch (err) {
        if (!cancelled) {
          if (!silent) setError(err.response?.data?.message || "Failed to load released documents");
          if (!silent) setReleasedItems([]);
        }
      } finally {
        if (!cancelled && !silent) setLoading(false);
      }
    };

    load({ silent: false });
    const intervalId = window.setInterval(() => load({ silent: true }), DOCUMENTS_POLL_MS);
    const onFocus = () => load({ silent: true });
    const onVisibility = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    const unsubscribe = subscribeAcademicDocumentsUpdated((detail) => {
      if (detail?.documentType && detail.documentType !== documentType) return;
      load({ silent: true });
    });
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribe();
    };
  }, [branchSection, documentType, classFilter, sectionFilter, slipTypeFilter]);

  const classOptions = useMemo(
    () => [{ value: "", label: "All Classes" }, ...CLASS_OPTIONS.map((value) => ({ value, label: value }))],
    []
  );

  const sectionOptions = useMemo(
    () => [{ value: "", label: "All Sections" }, ...SECTION_OPTIONS.map((value) => ({ value, label: value }))],
    []
  );

  const allStudentsForClass = useMemo(() => {
    const map = new Map();
    releasedItems.forEach((item) => {
      if (!item.student?._id) return;
      if (classFilter && item.student.className !== classFilter) return;
      if (sectionFilter && (item.student.section || "A") !== sectionFilter) return;
      map.set(item.student._id, item.student);
    });
    return Array.from(map.values());
  }, [releasedItems, classFilter, sectionFilter]);

  const studentOptions = useMemo(
    () => [
      { value: "", label: "Select Student" },
      ...allStudentsForClass.map((student) => ({
        value: student._id,
        label: `${getStudentDisplayName(student)}${student.admissionNo ? ` • ${student.admissionNo}` : ""}`,
      })),
    ],
    [allStudentsForClass]
  );

  const resolvedSlipTypeOptions = useMemo(
    () => [
      { value: "", label: slipTypePlaceholder },
      ...slipTypeOptions.filter((option) => option.value !== ""),
    ],
    [slipTypePlaceholder, slipTypeOptions]
  );

  const filteredRows = useMemo(() => {
    const rows = releasedItems
      .filter((item) => item.student)
      .map((item, index) => {
        const student = item.student;
        return {
          item,
          student,
          index,
          rollNo: getRollNo(student, index),
          studentId: getStudentId(student),
          studentName: getStudentDisplayName(student),
          fatherName: getFatherName(student),
          classSection: getClassSection(student),
          gender: student.gender || "MALE",
          slipType: item.term || "",
        };
      });

    return rows.filter((row) => {
      if (classFilter && row.student.className !== classFilter) return false;
      if (sectionFilter && (row.student.section || "A") !== sectionFilter) return false;
      if (studentFilter && row.student._id !== studentFilter) return false;
      if (slipTypeFilter && row.slipType !== slipTypeFilter) return false;
      return true;
    });
  }, [releasedItems, classFilter, sectionFilter, studentFilter, slipTypeFilter]);

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [classFilter, sectionFilter, studentFilter, slipTypeFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const exportRows = () => {
    const headers = ["Roll No", "Student ID", "Student Name", "Father's Name", "Class + Section", "Gender", slipTypeLabel];
    const csv = [headers, ...filteredRows.map((row) => [row.rollNo, row.studentId, row.studentName, row.fatherName, row.classSection, row.gender, row.slipType])]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportFileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printAll = () => {
    if (!visibleRows.length) {
      setError("No documents available to print.");
      return;
    }
    setPreviewRow(visibleRows[0]);
    window.setTimeout(() => window.print(), 350);
  };

  const filterSelects = (
    <>
      <div className="w-[138px] shrink-0">
        <ScrollableSelect
          label={classSelectLabel}
          placeholder="Select Class"
          value={classFilter}
          options={classOptions}
          onChange={(value) => {
            setClassFilter(value);
            setStudentFilter("");
          }}
          dark={dark}
          portal
          menuMaxHeight={220}
        />
      </div>
      <div className="w-[120px] shrink-0">
        <ScrollableSelect
          label={sectionSelectLabel}
          placeholder="Select Section"
          value={sectionFilter}
          options={sectionOptions}
          onChange={(value) => {
            setSectionFilter(value);
            setStudentFilter("");
          }}
          dark={dark}
          portal
          menuMaxHeight={220}
        />
      </div>
      <div className="w-[180px] shrink-0">
        <ScrollableSelect
          label={studentSelectLabel}
          placeholder="Select Student"
          value={studentFilter}
          options={studentOptions}
          onChange={setStudentFilter}
          dark={dark}
          portal
          menuMaxHeight={260}
          endIcon={<IconSearch className="h-4 w-4" />}
          showChevron={false}
        />
      </div>
      <div className="w-[150px] shrink-0">
        <ScrollableSelect
          label={slipTypeLabel}
          placeholder={slipTypePlaceholder}
          value={slipTypeFilter}
          options={resolvedSlipTypeOptions}
          onChange={setSlipTypeFilter}
          dark={dark}
          portal
          menuMaxHeight={180}
        />
      </div>
    </>
  );

  return (
    <section className="space-y-3">
      <style>{`
        @media print {
          @page { size: auto; margin: 8mm; }
          html, body {
            background: #fff !important;
            height: auto !important;
            overflow: visible !important;
          }
          body * { visibility: hidden !important; }
          .roll-slip-print-area,
          .roll-slip-print-area * {
            visibility: visible !important;
          }
          .roll-slip-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #fff !important;
          }
          .roll-slip-print-hide { display: none !important; }
        }
      `}</style>

      {filtersPlacement === "header" ? (
        <div className="flex flex-nowrap items-end justify-between gap-3 overflow-x-auto">
          <div className="min-w-0 shrink-0">
            <h2 className={`text-[26px] font-bold leading-tight ${dark ? "text-white" : "text-slate-900"}`}>{title}</h2>
            <p className={`mt-0.5 text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{subtitle}</p>
          </div>
          <div className="flex flex-nowrap items-end gap-2">{filterSelects}</div>
        </div>
      ) : (
        <>
          <div className="space-y-0.5">
            <h2 className={`text-[26px] font-bold leading-tight ${dark ? "text-white" : "text-slate-900"}`}>{title}</h2>
            <p className={`text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{subtitle}</p>
          </div>

          <div className={`rounded-2xl border p-3 shadow-[0_16px_34px_rgba(15,23,42,0.06)] ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white"}`}>
            <div className="flex flex-nowrap items-end gap-2 overflow-x-auto">{filterSelects}</div>
          </div>
        </>
      )}

      {error ? (
        <p className={`text-sm ${dark ? "text-[#e91e63]" : "text-rose-600"}`}>{error}</p>
      ) : null}

      <div className={`rounded-2xl border p-4 shadow-[0_16px_34px_rgba(15,23,42,0.06)] ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white"}`}>
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 md:flex-row md:items-center md:justify-between">
          <h3 className={`text-[20px] font-bold ${dark ? "text-white" : "text-slate-900"}`}>{listTitle}</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportRows}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold ${
                dark
                  ? "border-[#7c4dff]/30 bg-[#7c4dff]/10 text-[#7c4dff] hover:bg-[#7c4dff]/15"
                  : "border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
              }`}
            >
              <IconExport className="h-5 w-5" />
              Export
            </button>
            <button
              type="button"
              onClick={printAll}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(79,70,229,0.22)]"
            >
              <IconPrinterLarge className="h-5 w-5" />
              Print All
            </button>
          </div>
        </div>

        <div className={`mt-4 overflow-hidden rounded-xl border ${dark ? "border-white/[0.06]" : "border-slate-200"}`}>
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full text-left text-sm">
              <thead className={dark ? "bg-[#1a1b26] text-[#cbd5e1]" : "bg-slate-50 text-slate-700"}>
                <tr>
                  <th className="px-5 py-4 font-semibold">Roll No.</th>
                  <th className="px-5 py-4 font-semibold">Student ID</th>
                  <th className="px-5 py-4 font-semibold">Student Name</th>
                  <th className="px-5 py-4 font-semibold">Father's Name</th>
                  <th className="px-5 py-4 font-semibold">Class + Section</th>
                  <th className="px-5 py-4 font-semibold">Gender</th>
                  <th className="px-5 py-4 font-semibold">{slipTypeLabel}</th>
                  <th className="px-5 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className={`px-5 py-10 text-center ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                      Loading...
                    </td>
                  </tr>
                ) : visibleRows.length ? (
                  visibleRows.map((row) => (
                    <tr key={row.item._id || row.student._id} className={`border-t ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
                      <td className={`px-5 py-4 font-medium ${dark ? "text-white" : "text-slate-700"}`}>{row.rollNo}</td>
                      <td className={`px-5 py-4 ${dark ? "text-[#e2e8f0]" : "text-slate-700"}`}>{row.studentId}</td>
                      <td className={`px-5 py-4 ${dark ? "text-white" : "text-slate-700"}`}>{row.studentName}</td>
                      <td className={`px-5 py-4 ${dark ? "text-[#e2e8f0]" : "text-slate-700"}`}>{row.fatherName}</td>
                      <td className={`px-5 py-4 ${dark ? "text-[#e2e8f0]" : "text-slate-700"}`}>{row.classSection}</td>
                      <td className="px-5 py-4">
                        <GenderPill gender={row.gender} />
                      </td>
                      <td className="px-5 py-4">
                        <SlipTypePill slipType={row.slipType} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewRow(row)}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm ${
                              dark
                                ? "border-white/[0.06] bg-[#1a1b26] text-blue-400 hover:bg-white/[0.04]"
                                : "border-slate-200 bg-white text-blue-600 hover:bg-blue-50"
                            }`}
                            title="View"
                          >
                            <IconEye />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditRow(row)}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm ${
                              dark
                                ? "border-white/[0.06] bg-[#1a1b26] text-violet-400 hover:bg-white/[0.04]"
                                : "border-slate-200 bg-white text-violet-600 hover:bg-violet-50"
                            }`}
                            title="Edit"
                          >
                            <IconEdit />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewRow(row);
                              window.setTimeout(() => window.print(), 350);
                            }}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm ${
                              dark
                                ? "border-white/[0.06] bg-[#1a1b26] text-emerald-400 hover:bg-white/[0.04]"
                                : "border-slate-200 bg-white text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title="Print"
                          >
                            <IconPrint />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className={`px-5 py-10 text-center ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                      {emptyMessage}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`mt-5 flex flex-col gap-3 border-t pt-4 lg:flex-row lg:items-center lg:justify-between ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
          <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
            Showing {total ? (currentPage - 1) * PAGE_SIZE + 1 : 0} to {Math.min(currentPage * PAGE_SIZE, total)} of {total} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage <= 1}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border disabled:opacity-40 ${
                dark
                  ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e]"
                  : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              <IconChevron direction="left" />
            </button>
            {buildPageButtons(currentPage, totalPages).map((entry, index) =>
              entry === "..." ? (
                <span key={`dots-${index}`} className={`px-2 ${dark ? "text-[#9e9e9e]" : "text-slate-400"}`}>
                  ...
                </span>
              ) : (
                <button
                  key={entry}
                  type="button"
                  onClick={() => setPage(Number(entry))}
                  className={`inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-semibold ${
                    Number(entry) === currentPage
                      ? "bg-indigo-600 text-white shadow-[0_10px_22px_rgba(79,70,229,0.22)]"
                      : dark
                        ? "border border-white/[0.06] bg-[#1a1b26] text-[#e2e8f0] hover:bg-white/[0.04]"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {entry}
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={currentPage >= totalPages}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border disabled:opacity-40 ${
                dark
                  ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e]"
                  : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              <IconChevron direction="right" />
            </button>
          </div>
        </div>
      </div>

      {previewRow ? (
        <PrintPreviewModal
          student={previewRow.student}
          slipDoc={previewRow.item}
          slipType={previewRow.slipType}
          slipTypeLabel={slipTypeLabel}
          previewVariant={previewVariant}
          onClose={() => setPreviewRow(null)}
          onPrint={() => window.print()}
        />
      ) : null}

      {editRow ? (
        <EditSlipModal
          student={editRow.student}
          slipType={editRow.slipType}
          onClose={() => setEditRow(null)}
          onSave={async (nextSlipType) => {
            try {
              await api.put(`/academic-documents/${editRow.item._id}`, { term: nextSlipType });
              setReleasedItems((current) =>
                current.map((item) => (item._id === editRow.item._id ? { ...item, term: nextSlipType } : item))
              );
              setEditRow(null);
            } catch (err) {
              setError(err.response?.data?.message || "Failed to update document");
            }
          }}
          dark={dark}
          slipTypeLabel={slipTypeLabel}
          slipTypeOptions={resolvedSlipTypeOptions.filter((opt) => opt.value !== "")}
          editModalTitle={editModalTitle}
        />
      ) : null}
    </section>
  );
}
