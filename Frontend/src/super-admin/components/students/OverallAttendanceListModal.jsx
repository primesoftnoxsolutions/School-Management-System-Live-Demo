import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../services/api/client";
import { BRANCH_OPTIONS, CLASS_OPTIONS, SECTION_OPTIONS } from "../../constants/classes";
import { normalizeBranch, withStudentBranchParams } from "../../utils/branch";
import ModernDatePicker from "../ui/ModernDatePicker";
import ScrollableSelect from "../ui/ScrollableSelect";

const FONT = "[font-family:'Montserrat','Manrope',sans-serif]";

const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const formatDisplayDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return value || "—";
  return `${Number(match[3])}-${Number(match[2])}-${match[1]}`;
};

const formatZeroAsX = (value) => {
  const num = Number(value || 0);
  return num === 0 ? "x" : String(num);
};

export default function OverallAttendanceListModal({ open, onClose, dark = false, branchSection = "Boys" }) {
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [branch, setBranch] = useState(() => normalizeBranch(branchSection));
  const [fromDate, setFromDate] = useState(todayKey);
  const [toDate, setToDate] = useState(todayKey);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (!open) return;
    setBranch(normalizeBranch(branchSection));
    setClassName("");
    setSection("");
    setFromDate(todayKey());
    setToDate(todayKey());
    setError("");
    setReport(null);
  }, [open, branchSection]);

  useEffect(() => {
    if (!open || !fromDate || !toDate) return undefined;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/students/overall-attendance-list", {
          params: withStudentBranchParams(
            {
              className: className || undefined,
              section: section || undefined,
              from: fromDate,
              to: toDate,
              branch,
            },
            branch
          ),
        });
        if (!cancelled) setReport(data.data || null);
      } catch (err) {
        if (!cancelled) {
          setReport(null);
          setError(err.response?.data?.message || "Failed to load overall attendance list");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, className, section, branch, fromDate, toDate]);

  const classOptions = useMemo(
    () => [{ value: "", label: "All Classes" }, ...CLASS_OPTIONS.map((item) => ({ value: item, label: item === "Prep" ? "Preparatory" : item }))],
    []
  );

  const sectionOptions = useMemo(
    () => [{ value: "", label: "All Sections" }, ...SECTION_OPTIONS.map((item) => ({ value: item, label: `Section ${item}` }))],
    []
  );

  const branchOptions = useMemo(
    () => BRANCH_OPTIONS.map((item) => ({ value: item, label: item })),
    []
  );

  const headerDate = useMemo(() => {
    if (!fromDate && !toDate) return "—";
    if (fromDate && toDate && fromDate !== toDate) {
      return `${formatDisplayDate(fromDate)} - ${formatDisplayDate(toDate)}`;
    }
    return formatDisplayDate(toDate || fromDate);
  }, [fromDate, toDate]);

  if (!open) return null;

  const rows = report?.rows || [];
  const totals = report?.totals || { enrolment: 0, absent: 0, onLeave: 0, present: 0 };
  const percentage = report?.percentage ?? 0;
  const schoolName = report?.schoolName || "Insaf Grammer School";
  const displayBranch = report?.branch || branch;

  return createPortal(
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center overflow-y-auto bg-slate-900/55 px-3 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border shadow-2xl ${FONT} ${
          dark ? "border-white/[0.08] bg-[#14151f]" : "border-slate-200 bg-white"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={`flex items-start justify-between gap-4 border-b px-6 py-4 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
          <div>
            <h3 className={`text-xl font-extrabold ${dark ? "text-white" : "text-slate-900"}`}>Overall Attendance List</h3>
            <p className={`mt-1 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
              Attendance Book summary by class and section
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full p-2 ${dark ? "text-[#9e9e9e] hover:bg-white/[0.06] hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}
            aria-label="Close overall attendance list"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <ScrollableSelect
              label="Select Class"
              placeholder="All Classes"
              value={className}
              options={classOptions}
              onChange={setClassName}
              dark={dark}
              portal
            />
            <ScrollableSelect
              label="Select Section"
              placeholder="All Sections"
              value={section}
              options={sectionOptions}
              onChange={setSection}
              dark={dark}
              portal
            />
            <ScrollableSelect
              label="Branch"
              placeholder="Boys"
              value={branch}
              options={branchOptions}
              onChange={(value) => setBranch(normalizeBranch(value))}
              dark={dark}
              portal
            />
            <ModernDatePicker
              label="From date"
              value={fromDate}
              max={toDate || undefined}
              dark={dark}
              onChange={setFromDate}
            />
            <ModernDatePicker
              label="To date"
              value={toDate}
              min={fromDate || undefined}
              dark={dark}
              onChange={setToDate}
            />
          </div>

          {error ? (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                dark ? "border-[#e91e63]/30 bg-[#e91e63]/10 text-[#e91e63]" : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {error}
            </div>
          ) : null}

          <div className={`overflow-hidden rounded-xl border-2 ${dark ? "border-white/20 bg-[#161722]" : "border-slate-800 bg-white"}`}>
            <div className={`grid grid-cols-[1.1fr_1.4fr_0.7fr_1fr] items-end gap-3 border-b px-4 py-3 ${dark ? "border-white/15" : "border-slate-800"}`}>
              <p className={`text-[15px] font-bold ${dark ? "text-white" : "text-slate-900"}`}>Attendance Book</p>
              <p className={`text-center text-[17px] font-extrabold underline decoration-2 underline-offset-4 ${dark ? "text-white" : "text-slate-900"}`}>
                {schoolName}
              </p>
              <p className={`text-center text-[15px] font-bold ${dark ? "text-white" : "text-slate-900"}`}>{displayBranch}</p>
              <p className={`text-right text-[15px] font-bold underline decoration-2 underline-offset-4 ${dark ? "text-white" : "text-slate-900"}`}>
                Date: {headerDate}
              </p>
            </div>

            <div className="max-h-[52vh] overflow-auto">
              <table className="w-full table-fixed border-collapse">
                <thead className={`sticky top-0 z-[1] ${dark ? "bg-[#1a1b26] text-white" : "bg-white text-slate-900"}`}>
                  <tr>
                    {["Class", "Section", "Total Enrolment", "Absent", "On Leave", "Present"].map((heading) => (
                      <th
                        key={heading}
                        className={`border px-3 py-3 text-center text-[15px] font-extrabold ${
                          dark ? "border-white/20" : "border-slate-800"
                        }`}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className={`border px-4 py-10 text-center text-base ${dark ? "border-white/15 text-[#9e9e9e]" : "border-slate-800 text-slate-500"}`}>
                        Loading attendance list...
                      </td>
                    </tr>
                  ) : rows.length ? (
                    <>
                      {rows.map((row) => (
                        <tr key={`${row.className}-${row.section}`}>
                          <td className={`border px-3 py-2.5 text-center text-[16px] font-semibold ${dark ? "border-white/15 text-white" : "border-slate-800 text-slate-900"}`}>
                            {row.classLabel || row.className}
                          </td>
                          <td className={`border px-3 py-2.5 text-center text-[16px] font-semibold ${dark ? "border-white/15 text-white" : "border-slate-800 text-slate-900"}`}>
                            {row.section || "—"}
                          </td>
                          <td className={`border px-3 py-2.5 text-center text-[16px] font-semibold tabular-nums ${dark ? "border-white/15 text-white" : "border-slate-800 text-slate-900"}`}>
                            {row.enrolment}
                          </td>
                          <td className={`border px-3 py-2.5 text-center text-[16px] font-semibold tabular-nums ${dark ? "border-white/15 text-white" : "border-slate-800 text-slate-900"}`}>
                            {formatZeroAsX(row.absent)}
                          </td>
                          <td className={`border px-3 py-2.5 text-center text-[16px] font-semibold tabular-nums ${dark ? "border-white/15 text-white" : "border-slate-800 text-slate-900"}`}>
                            {formatZeroAsX(row.onLeave)}
                          </td>
                          <td className={`border px-3 py-2.5 text-center text-[16px] font-semibold tabular-nums ${dark ? "border-white/15 text-white" : "border-slate-800 text-slate-900"}`}>
                            {row.present}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td className={`border px-3 py-3 text-center text-[16px] font-extrabold ${dark ? "border-white/15 text-white" : "border-slate-800 text-slate-900"}`} colSpan={2}>
                          Total
                        </td>
                        <td className={`border px-3 py-3 text-center text-[16px] font-extrabold tabular-nums ${dark ? "border-white/15 text-white" : "border-slate-800 text-slate-900"}`}>
                          {totals.enrolment}
                        </td>
                        <td className={`border px-3 py-3 text-center text-[16px] font-extrabold tabular-nums ${dark ? "border-white/15 text-white" : "border-slate-800 text-slate-900"}`}>
                          {totals.absent}
                        </td>
                        <td className={`border px-3 py-3 text-center text-[16px] font-extrabold tabular-nums ${dark ? "border-white/15 text-white" : "border-slate-800 text-slate-900"}`}>
                          {totals.onLeave}
                        </td>
                        <td className={`border px-3 py-3 text-center text-[16px] font-extrabold tabular-nums ${dark ? "border-white/15 text-white" : "border-slate-800 text-slate-900"}`}>
                          {totals.present}
                        </td>
                      </tr>
                      <tr>
                        <td className={`border px-3 py-3 text-center text-[16px] font-extrabold ${dark ? "border-white/15 text-white" : "border-slate-800 text-slate-900"}`} colSpan={5}>
                          Percentage
                        </td>
                        <td className={`border px-3 py-3 text-center text-[17px] font-extrabold tabular-nums ${dark ? "border-white/15 text-white" : "border-slate-800 text-slate-900"}`}>
                          {percentage}%
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan={6} className={`border px-4 py-10 text-center text-base ${dark ? "border-white/15 text-[#9e9e9e]" : "border-slate-800 text-slate-500"}`}>
                        No students found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={`flex justify-end border-t px-6 py-4 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
          <button type="button" className="ref-btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
