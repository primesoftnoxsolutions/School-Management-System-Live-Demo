import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../../services/api/client";
import ScrollableSelect from "../../components/ui/ScrollableSelect";
import useTeacherClassOptions from "../../hooks/useTeacherClassOptions";
import { notifySyllabusUpdated, subscribeSyllabusUpdated } from "../../utils/syllabusSync";

const MONTH_OPTIONS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DEFAULT_ROWS = ["ENGLISH", "URDU", "MATHEMATICS", "ISLAMIC STUDIES", "GENERAL SCIENCE", "SOCIAL STUDIES", "COMPUTER", "NAZRA"];
const schoolLogo = "/Logo%20Insaf%20Grammar%20High%20School.png";

const createRows = (subjects = DEFAULT_ROWS) =>
  subjects.map((subject) => ({
    id: crypto.randomUUID(),
    subject,
    syllabus: "",
    covered: "",
  }));

const formatUpdatedAt = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

function EditableCell({ value, onChange, multiline = false, placeholder = "", className = "" }) {
  const base = "w-full border-0 bg-transparent text-center font-bold uppercase text-blue-950 outline-none placeholder:text-blue-300";
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onInput={(event) => {
          event.currentTarget.style.height = "0px";
          event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
        }}
        data-syllabus-autosize="true"
        placeholder={placeholder}
        rows={2}
        className={`${base} min-h-14 resize-none overflow-hidden py-2 text-left text-sm leading-6 normal-case ${className}`}
      />
    );
  }
  return <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`${base} ${className}`} />;
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
        style={{
          backgroundImage: "radial-gradient(#8dc1ff 1.4px, transparent 1.4px)",
          backgroundSize: "8px 8px",
        }}
      />
      <div className={`absolute top-[14px] ${alignClass} flex w-[176px] justify-center`}>
        <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#dcebff]">
          <img src={schoolLogo} alt="" className="h-11 w-11 object-contain" />
        </div>
      </div>
    </>
  );
}

function SaveModal({ open, summary, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 backdrop-blur-sm">
      <div className="relative w-[min(92vw,620px)] rounded-3xl border border-emerald-200 bg-white px-9 py-8 text-center shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          aria-label="Close"
        >
          x
        </button>
        <p className="text-xl font-black text-emerald-700">Syllabus saved</p>
        <p className="mt-3 text-sm font-semibold text-slate-700">{summary}</p>
      </div>
    </div>
  );
}

export default function MonthlySyllabusPage({ dark = false }) {
  const now = new Date();
  const [teacherName, setTeacherName] = useState("");
  const { classOptions, loading: classesLoading } = useTeacherClassOptions({ mergeClasses: true });
  const [selectedClassId, setSelectedClassId] = useState("");
  const [viewMode, setViewMode] = useState("MONTHLY");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [monthTitle, setMonthTitle] = useState(MONTH_OPTIONS[now.getMonth()].toUpperCase());
  const [bookTitle, setBookTitle] = useState("BOOKS NAME");
  const [rows, setRows] = useState(() => createRows());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saveSummary, setSaveSummary] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const rowsDirtyRef = useRef(false);

  const classSectionOptions = useMemo(() => {
    const seen = new Set();
    return classOptions.filter((option) => {
      const key = `${option.className}__${option.section || "A"}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [classOptions]);

  const selectedClass = useMemo(() => classSectionOptions.find((option) => option._id === selectedClassId) || null, [classSectionOptions, selectedClassId]);
  const monthDisabled = viewMode === "ANNUALLY";

  // Only the subjects assigned to this teacher for the selected class/section.
  const assignedSubjects = useMemo(() => {
    if (!selectedClass) return [];
    const seen = new Set();
    const subjects = [];
    classOptions.forEach((option) => {
      if (String(option.className || "") !== String(selectedClass.className || "")) return;
      if (String(option.section || "A") !== String(selectedClass.section || "A")) return;
      const subject = String(option.subject || "").trim();
      if (!subject || /^class\s*teacher$/i.test(subject)) return;
      const key = subject.toUpperCase();
      if (seen.has(key)) return;
      seen.add(key);
      subjects.push(key);
    });
    return subjects;
  }, [classOptions, selectedClass]);

  const subjectRows = useMemo(() => (assignedSubjects.length ? assignedSubjects : DEFAULT_ROWS), [assignedSubjects]);

  useEffect(() => {
    const loadTeacher = async () => {
      setLoading(true);
      setError("");
      try {
        const panelRes = await api.get("/teachers/my-panel");
        setTeacherName(panelRes.data?.data?.teacher?.fullName || "");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load monthly syllabus data");
      } finally {
        setLoading(false);
      }
    };
    loadTeacher();
  }, []);

  useEffect(() => {
    if (!classesLoading && !classSectionOptions.length) {
      setError((prev) => prev || "No classes assigned. Ask Super Admin to assign a class first.");
    }
  }, [classesLoading, classSectionOptions.length]);

  useEffect(() => {
    if (!selectedClassId && classSectionOptions.length) setSelectedClassId(classSectionOptions[0]._id);
    if (selectedClassId && classSectionOptions.length && !classSectionOptions.some((option) => option._id === selectedClassId)) {
      setSelectedClassId(classSectionOptions[0]._id);
    }
  }, [classSectionOptions, selectedClassId]);

  const classSectionOptionsRef = useRef(classSectionOptions);
  classSectionOptionsRef.current = classSectionOptions;

  const applyRecord = useCallback(
    (item) => {
      rowsDirtyRef.current = false;
      if (item) {
        setMonthTitle(
          viewMode === "ANNUALLY"
            ? "ANNUALLY"
            : item.monthTitle || MONTH_OPTIONS[item.month ?? selectedMonth]?.toUpperCase() || MONTH_OPTIONS[selectedMonth].toUpperCase()
        );
        setBookTitle(item.bookTitle || "BOOKS NAME");
        const savedRows = Array.isArray(item.rows) ? item.rows : [];
        const hasAssignedSubjects = assignedSubjects.length > 0;
        setRows(
          subjectRows.map((subject, index) => {
            const saved =
              savedRows.find((row) => String(row.subject || "").trim().toUpperCase() === subject) ||
              (hasAssignedSubjects ? null : savedRows[index]) ||
              null;
            return {
              id: saved?._id || `${item._id || "saved"}-${index}`,
              subject: saved?.subject || subject,
              syllabus: saved?.syllabus || "",
              covered: saved?.covered || "",
            };
          })
        );
        setLastUpdated(item.updatedAt || null);
      } else {
        setRows(createRows(subjectRows));
        setBookTitle("BOOKS NAME");
        setMonthTitle(viewMode === "ANNUALLY" ? "ANNUALLY" : MONTH_OPTIONS[selectedMonth].toUpperCase());
        setLastUpdated(null);
      }
    },
    [selectedMonth, viewMode, subjectRows, assignedSubjects.length]
  );

  const loadSyllabus = useCallback(async ({ silent = false } = {}) => {
    if (!selectedClassId) return;
    const selected = classSectionOptionsRef.current.find((item) => item._id === selectedClassId);
    if (!selected?.className) return;

    const year = Number(selectedYear);
    if (!Number.isFinite(year) || year < 2000) return;

    try {
      if (!silent) setError("");
      const params = {
        className: selected.className,
        section: selected.section || "A",
        mode: viewMode,
        year,
      };
      if (viewMode === "MONTHLY") params.month = Number(selectedMonth);
      const { data } = await api.get("/teacher-panel/syllabi", { params });
      const records = Array.isArray(data.data) ? data.data : [];
      const item =
        viewMode === "ANNUALLY"
          ? records.find((entry) => entry.mode === "ANNUALLY" || entry.month == null) || null
          : records.find((entry) => Number(entry.month) === Number(selectedMonth)) || null;
      // Don't wipe in-progress typing when background sync runs
      if (silent && rowsDirtyRef.current) return;
      applyRecord(item);
    } catch (err) {
      if (silent && rowsDirtyRef.current) return;
      if (!silent) {
        setError(err.response?.data?.message || "Failed to load syllabus");
      }
      applyRecord(null);
    }
  }, [selectedClassId, selectedMonth, selectedYear, viewMode, applyRecord]);

  useEffect(() => {
    rowsDirtyRef.current = false;
    loadSyllabus();
  }, [selectedClassId, selectedMonth, selectedYear, viewMode, loadSyllabus]);

  // Keep Teacher Portal in sync with Super Admin syllabus changes
  useEffect(() => {
    if (!selectedClassId) return undefined;
    const poll = window.setInterval(() => {
      loadSyllabus({ silent: true });
    }, 5000);
    const onFocus = () => {
      if (!rowsDirtyRef.current) loadSyllabus({ silent: true });
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    const unsubscribe = subscribeSyllabusUpdated(() => {
      if (!rowsDirtyRef.current) loadSyllabus({ silent: true });
    });
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribe();
    };
  }, [selectedClassId, loadSyllabus]);

  useEffect(() => {
    document.querySelectorAll('textarea[data-syllabus-autosize="true"]').forEach((node) => {
      node.style.height = "0px";
      node.style.height = `${node.scrollHeight}px`;
    });
  }, [rows]);

  const updateRow = (id, field, value) => {
    rowsDirtyRef.current = true;
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const normalizeRows = () =>
    rows
      .map((row) => ({ subject: String(row.subject || "").trim(), syllabus: String(row.syllabus || "").trim(), covered: String(row.covered || "").trim() }))
      .filter((row) => row.subject);

  const saveSyllabus = async () => {
    if (!selectedClass) {
      setError("Please select a class first.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const resolvedMonthTitle = viewMode === "ANNUALLY" ? "ANNUALLY" : monthTitle || MONTH_OPTIONS[selectedMonth].toUpperCase();
      const branch =
        selectedClass.branch === "Boys" || selectedClass.branch === "Girls"
          ? selectedClass.branch
          : undefined;
      const { data } = await api.post("/teacher-panel/syllabi", {
        className: selectedClass.className,
        section: selectedClass.section || "A",
        ...(branch ? { branch } : {}),
        mode: viewMode,
        month: viewMode === "MONTHLY" ? selectedMonth : null,
        year: selectedYear,
        monthTitle: resolvedMonthTitle,
        bookTitle,
        rows: normalizeRows(),
      });
      if (data?.data?.updatedAt) setLastUpdated(data.data.updatedAt);
      setMonthTitle(resolvedMonthTitle);
      await loadSyllabus();
      notifySyllabusUpdated({
        className: selectedClass.className,
        section: selectedClass.section || "A",
        branch: branch || null,
        mode: viewMode,
        year: selectedYear,
        month: viewMode === "MONTHLY" ? selectedMonth : null,
        at: Date.now(),
      });
      setSuccess("Syllabus saved successfully.");
      setSaveSummary(
        `${teacherName || "Teacher"} | ${selectedClass.className} ${selectedClass.section || "A"} | ${viewMode === "MONTHLY" ? MONTH_OPTIONS[selectedMonth] : "Annually"} ${selectedYear}`
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save syllabus");
    } finally {
      setSaving(false);
    }
  };

  const renderTable = () => (
    <table className="w-full table-auto border-collapse text-blue-950">
      <thead>
        <tr className="bg-blue-700 text-white">
          <th className="w-[160px] min-w-[160px] whitespace-nowrap border border-blue-500 px-2 py-3 text-sm font-black uppercase">Books/Subjects</th>
          <th className="border border-blue-500 px-3 py-3 text-sm font-black uppercase">Syllabus</th>
          <th className="w-[120px] max-w-[120px] min-w-[120px] border border-blue-500 px-1 py-3 text-sm font-black uppercase">Covered%</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="align-top">
            <td className="w-[160px] min-w-[160px] whitespace-nowrap border border-blue-500 px-2 py-2 align-middle">
              <p className="w-full whitespace-nowrap text-center font-bold uppercase text-blue-950">{row.subject}</p>
            </td>
            <td className="border border-blue-500 px-3 py-2 align-middle">
              <EditableCell
                value={row.syllabus}
                onChange={(value) => updateRow(row.id, "syllabus", value)}
                multiline
                placeholder={viewMode === "ANNUALLY" ? "Write annually syllabus here" : `Write ${MONTH_OPTIONS[selectedMonth]} syllabus here`}
              />
            </td>
            <td className="w-[120px] max-w-[120px] min-w-[120px] border border-blue-500 px-1 py-2 align-middle">
              <EditableCell value={row.covered} onChange={(value) => updateRow(row.id, "covered", value)} className="w-[120px] text-lg" placeholder="0%" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (loading) return <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Loading monthly syllabus...</p>;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>Monthly Syllabus</h2>
          <p className={`mt-1 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Create and save class-wise monthly syllabus coverage.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-blue-200 bg-white p-1">
            {["MONTHLY", "ANNUALLY"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  rowsDirtyRef.current = false;
                  setViewMode(mode);
                  setMonthTitle(mode === "ANNUALLY" ? "ANNUALLY" : MONTH_OPTIONS[selectedMonth].toUpperCase());
                  setRows(createRows(subjectRows));
                  setBookTitle("BOOKS NAME");
                  setLastUpdated(null);
                }}
                className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${viewMode === mode ? "bg-blue-700 text-white" : "text-blue-700 hover:bg-blue-50"}`}
              >
                {mode === "MONTHLY" ? "Monthly" : "Annually"}
              </button>
            ))}
          </div>
          <button type="button" onClick={saveSyllabus} disabled={saving} className="rounded-xl bg-blue-700 px-4 py-3 text-xs font-black uppercase tracking-[0.08em] text-white disabled:opacity-70">
            {saving ? "Saving..." : "Save Syllabus"}
          </button>
          <button type="button" onClick={() => window.print()} className="rounded-xl bg-blue-700 px-4 py-3 text-xs font-black uppercase tracking-[0.08em] text-white">
            Print Syllabus
          </button>
          <div className="min-w-[160px]">
            <ScrollableSelect
              label="Month Select"
              placeholder="Select month"
              value={String(selectedMonth)}
              options={MONTH_OPTIONS.map((month, index) => ({
                value: String(index),
                label: month,
              }))}
              onChange={(value) => {
                const nextMonth = Number(value);
                setSelectedMonth(nextMonth);
                setMonthTitle(MONTH_OPTIONS[nextMonth].toUpperCase());
              }}
              dark={dark}
              portal
              disabled={monthDisabled}
            />
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <SaveModal open={Boolean(success)} summary={saveSummary} onClose={() => { setSuccess(""); setSaveSummary(""); }} />

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <ScrollableSelect
            label="Class"
            placeholder="Select class"
            value={selectedClassId}
            options={classSectionOptions.map((option) => ({
              value: option._id,
              label: `${option.className} ${option.section || "A"}`,
            }))}
            onChange={setSelectedClassId}
            dark={dark}
            portal
          />
        </div>
        <div>
          <label className={`mb-1 block text-xs font-bold uppercase tracking-[0.12em] ${dark ? "text-[#9e9e9e]" : "text-blue-700"}`}>Year</label>
          <input
            type="number"
            min={2000}
            max={2100}
            value={selectedYear || ""}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isFinite(next) && next > 0) setSelectedYear(next);
            }}
            className="h-11 w-full rounded-xl border border-blue-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className={`mb-1 block text-xs font-bold uppercase tracking-[0.12em] ${dark ? "text-[#9e9e9e]" : "text-blue-700"}`}>Teacher</label>
          <input value={teacherName || "Teacher Portal"} readOnly className="h-11 w-full rounded-xl border border-blue-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border-4 border-blue-600 bg-white shadow-[0_18px_44px_rgba(37,99,235,0.14)]">
        <div className="relative overflow-hidden border-2 border-white bg-white">
          <CornerSeal side="left" />
          <CornerSeal side="right" />
          <div className="relative z-10 px-6 pt-4 text-center">
            <div className="text-3xl font-black uppercase tracking-wide text-blue-950">
              {viewMode === "ANNUALLY"
                ? `ANNUALLY ${selectedYear}`
                : `${(monthTitle || MONTH_OPTIONS[selectedMonth]).toUpperCase()} ${selectedYear}`}
            </div>
          </div>
          <div className="relative z-10 px-2 pb-2 pt-4">{renderTable()}</div>
          <div className="relative z-10 flex justify-end px-4 pb-4">
            <p className="text-xs font-semibold text-slate-500">
              Last Updated: {lastUpdated ? formatUpdatedAt(lastUpdated) : "—"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
