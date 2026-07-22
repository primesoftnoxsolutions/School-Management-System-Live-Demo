import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../../../services/api/client";
import ScrollableSelect from "../../../components/ui/ScrollableSelect";
import { withTeacherBranchParams } from "../../utils/branch";
import { notifySyllabusUpdated, subscribeSyllabusUpdated } from "../../../utils/syllabusSync";

const MONTH_OPTIONS = [
  { value: 0, label: "January" },
  { value: 1, label: "February" },
  { value: 2, label: "March" },
  { value: 3, label: "April" },
  { value: 4, label: "May" },
  { value: 5, label: "June" },
  { value: 6, label: "July" },
  { value: 7, label: "August" },
  { value: 8, label: "September" },
  { value: 9, label: "October" },
  { value: 10, label: "November" },
  { value: 11, label: "December" },
];

const DEFAULT_ROWS = ["ENGLISH", "URDU", "MATHEMATICS", "ISLAMIC STUDIES", "GENERAL SCIENCE", "SOCIAL STUDIES", "COMPUTER", "NAZRA"];
const schoolLogo = "/Logo%20Insaf%20Grammar%20High%20School.png";

const createRows = (subjects = DEFAULT_ROWS) => subjects.map((subject) => ({ id: crypto.randomUUID(), subject, syllabus: "", covered: "" }));

const formatUpdatedAt = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

function EditableCell({ value, onChange, multiline = false, className = "" }) {
  const base = "w-full border-0 bg-transparent text-center font-semibold uppercase text-blue-950 outline-none [font-family:'Montserrat','Inter',sans-serif]";
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onInput={(e) => {
          e.currentTarget.style.height = "0px";
          e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
        }}
        data-syllabus-autosize="true"
        rows={2}
        className={`${base} min-h-[52px] resize-none overflow-hidden py-2 text-left text-sm leading-6 normal-case ${className}`}
      />
    );
  }
  return <input value={value} onChange={(e) => onChange(e.target.value)} className={`${base} ${className}`} />;
}

function CornerSeal({ side = "left" }) {
  const alignClass = side === "left" ? "left-0" : "right-0";
  const curveClass = side === "left" ? "-left-1 rounded-br-[100px]" : "-right-1 rounded-bl-[100px]";
  const dotClass = side === "left" ? "left-[160px]" : "right-[160px]";
  return (
    <>
      <div className={`absolute top-0 h-[72px] w-[168px] bg-[#2f63e6] ${curveClass}`} />
      <div className={`absolute top-1.5 h-px w-[150px] bg-white ${side === "left" ? "left-4" : "right-4"}`} />
      <div className={`absolute top-0 h-[34px] w-[76px] opacity-60 ${dotClass}`} style={{ backgroundImage: "radial-gradient(#8dc1ff 1.4px, transparent 1.4px)", backgroundSize: "8px 8px" }} />
      <div className={`absolute top-[10px] ${alignClass} flex w-[148px] justify-center`}>
        <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#dcebff]">
          <img src={schoolLogo} alt="" className="h-8 w-8 object-contain" />
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
        <button type="button" onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800" aria-label="Close">
          x
        </button>
        <p className="text-xl font-black text-emerald-700">Syllabus saved</p>
        <p className="mt-3 text-sm font-semibold text-slate-700">{summary}</p>
      </div>
    </div>
  );
}

export default function TeacherSyllabusPage({ dark = false, branchSection = "Boys" }) {
  const now = new Date();
  const [mode, setMode] = useState("MONTHLY");
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [classOptions, setClassOptions] = useState([]);
  const [teacherOptions, setTeacherOptions] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [rows, setRows] = useState(() => createRows());
  const [bookTitle, setBookTitle] = useState("BOOKS NAME");
  const [monthTitle, setMonthTitle] = useState(MONTH_OPTIONS[now.getMonth()].label.toUpperCase());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saveSummary, setSaveSummary] = useState("");
  const [records, setRecords] = useState([]);
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

  const selectedClass = classSectionOptions.find((item) => item._id === selectedClassId) || null;
  const monthDisabled = mode === "ANNUALLY";

  // Only subjects assigned for the selected class/section (and teacher, when one is selected).
  const assignedSubjects = useMemo(() => {
    if (!selectedClass) return [];
    const seen = new Set();
    const subjects = [];
    classOptions.forEach((option) => {
      if (String(option.className || "") !== String(selectedClass.className || "")) return;
      if (String(option.section || "A") !== String(selectedClass.section || "A")) return;
      if (selectedTeacherId && String(option.teacherId || "") !== String(selectedTeacherId)) return;
      const subject = String(option.subject || "").trim();
      if (!subject || /^class\s*teacher$/i.test(subject)) return;
      const key = subject.toUpperCase();
      if (seen.has(key)) return;
      seen.add(key);
      subjects.push(key);
    });
    return subjects;
  }, [classOptions, selectedClass, selectedTeacherId]);

  const subjectRows = useMemo(() => (assignedSubjects.length ? assignedSubjects : DEFAULT_ROWS), [assignedSubjects]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [classesRes, teachersRes] = await Promise.all([
          api.get("/teacher-panel/class-options", { params: { branch: branchSection === "Girls" ? "Girls" : "Boys" } }),
          api.get("/teachers", { params: withTeacherBranchParams({ page: 1, limit: 500 }, branchSection) }),
        ]);
        setClassOptions(classesRes.data?.data || []);
        setTeacherOptions((teachersRes.data?.data?.items || []).map((teacher) => ({ value: teacher._id, label: teacher.fullName || teacher.name || teacher.email || "Teacher" })));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load syllabus page");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [branchSection]);

  useEffect(() => {
    if (!selectedClassId && classSectionOptions.length) setSelectedClassId(classSectionOptions[0]._id);
  }, [classSectionOptions, selectedClassId]);

  const applyRecord = useCallback(
    (record) => {
      rowsDirtyRef.current = false;
      if (record) {
        const savedRows = Array.isArray(record.rows) ? record.rows : [];
        const hasAssignedSubjects = assignedSubjects.length > 0;
        setRows(
          subjectRows.map((subject, index) => {
            const saved =
              savedRows.find((row) => String(row.subject || "").trim().toUpperCase() === subject) ||
              (hasAssignedSubjects ? null : savedRows[index]) ||
              null;
            return {
              id: saved?._id || `${record._id || "record"}-${index}`,
              subject: saved?.subject || subject,
              syllabus: saved?.syllabus || "",
              covered: saved?.covered || "",
            };
          })
        );
        setBookTitle(record.bookTitle || "BOOKS NAME");
        setMonthTitle(
          mode === "ANNUALLY"
            ? "ANNUALLY"
            : record.monthTitle || MONTH_OPTIONS[record.month ?? month]?.label?.toUpperCase() || MONTH_OPTIONS[month].label.toUpperCase()
        );
        setLastUpdated(record.updatedAt || null);
      } else {
        setRows(createRows(subjectRows));
        setBookTitle("BOOKS NAME");
        setMonthTitle(mode === "ANNUALLY" ? "ANNUALLY" : MONTH_OPTIONS[month].label.toUpperCase());
        setLastUpdated(null);
      }
    },
    [month, mode, subjectRows, assignedSubjects.length]
  );

  const loadRecords = useCallback(async ({ silent = false } = {}) => {
    try {
      const params = { mode, year, branch: branchSection === "Girls" ? "Girls" : "Boys" };
      if (mode === "MONTHLY") params.month = month;
      const selected = classSectionOptions.find((item) => item._id === selectedClassId);
      if (selected) {
        params.className = selected.className;
        params.section = selected.section;
      }
      if (selectedTeacherId) params.teacherId = selectedTeacherId;
      const { data } = await api.get("/teacher-panel/principal/syllabi", { params });
      const nextRecords = data.data || [];
      setRecords(nextRecords);

      // Only apply an exact mode/month match — never fall back to an unrelated record.
      const matched =
        mode === "ANNUALLY"
          ? nextRecords.find((entry) => entry.mode === "ANNUALLY" || entry.month == null) || null
          : nextRecords.find((entry) => Number(entry.month) === Number(month)) || null;

      if (silent && rowsDirtyRef.current) return;
      applyRecord(matched);
    } catch {
      if (silent && rowsDirtyRef.current) return;
      setRecords([]);
      applyRecord(null);
    }
  }, [mode, month, year, selectedClassId, selectedTeacherId, classSectionOptions, applyRecord, branchSection]);

  useEffect(() => {
    rowsDirtyRef.current = false;
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    const refresh = () => {
      if (!rowsDirtyRef.current) loadRecords({ silent: true });
    };
    const poll = window.setInterval(refresh, 3000);
    const unsubscribe = subscribeSyllabusUpdated(refresh);
    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(poll);
      unsubscribe();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadRecords]);

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

  const save = async () => {
    if (!selectedTeacherId) {
      setError("Select a teacher first.");
      return;
    }
    if (!selectedClass) {
      setError("Select a class first.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const resolvedMonthTitle = mode === "ANNUALLY" ? "ANNUALLY" : monthTitle || MONTH_OPTIONS[month].label.toUpperCase();
      const { data } = await api.post("/teacher-panel/syllabi", {
        teacherId: selectedTeacherId,
        className: selectedClass.className,
        section: selectedClass.section || "A",
        branch: branchSection === "Girls" ? "Girls" : "Boys",
        mode,
        month: mode === "MONTHLY" ? month : null,
        year,
        monthTitle: resolvedMonthTitle,
        bookTitle,
        rows: rows.map((row) => ({ subject: row.subject, syllabus: row.syllabus, covered: row.covered })),
      });
      if (data?.data?.updatedAt) setLastUpdated(data.data.updatedAt);
      setMonthTitle(resolvedMonthTitle);
      await loadRecords();
      notifySyllabusUpdated({
        teacherId: selectedTeacherId,
        className: selectedClass.className,
        section: selectedClass.section || "A",
        mode,
        year,
        month: mode === "MONTHLY" ? month : null,
      });
      setSuccess("Syllabus saved.");
      setSaveSummary(
        `${teacherOptions.find((x) => x.value === selectedTeacherId)?.label || "Teacher"} | ${selectedClass.className} ${selectedClass.section || "A"} | ${mode === "MONTHLY" ? MONTH_OPTIONS[month].label : "Annually"}`
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save syllabus");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Loading syllabus...</p>;

  const fieldShell = dark
    ? "h-11 w-full rounded-xl border border-white/[0.06] bg-[#1a1b26] px-3 text-sm text-white outline-none"
    : "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none";
  const labelClass = `mb-1.5 block text-xs font-semibold leading-none ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`;
  const selectTrigger = "h-11 min-h-11 py-0 text-sm";

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-3">
        <div className="min-w-0 pr-2">
          <h2 className={`text-[28px] font-black leading-tight ${dark ? "text-white" : "text-slate-900"}`}>Teachers Assign Syllabus</h2>
          <p className={`mt-1.5 text-sm leading-snug ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Monthly syllabus by class for principal review.</p>
        </div>

        <div className="flex flex-nowrap items-end gap-2.5 overflow-x-auto">
          <div className="w-[128px] shrink-0">
            <p className={labelClass}>Month</p>
            <ScrollableSelect
              value={String(month)}
              onChange={(value) => {
                const next = Number(value);
                setMonth(next);
                setMonthTitle(MONTH_OPTIONS[next].label.toUpperCase());
              }}
              options={MONTH_OPTIONS.map((item) => ({ value: String(item.value), label: item.label }))}
              dark={dark}
              portal
              disabled={monthDisabled}
              menuMaxHeight={220}
              triggerClassName={selectTrigger}
            />
          </div>
          <div className="w-[96px] shrink-0">
            <p className={labelClass}>Year</p>
            <input value={year} onChange={(e) => setYear(Number(e.target.value))} className={fieldShell} />
          </div>
          <div className="w-[168px] shrink-0">
            <p className={labelClass}>Teacher</p>
            <ScrollableSelect
              value={selectedTeacherId}
              onChange={setSelectedTeacherId}
              options={[{ value: "", label: "Select Teacher" }, ...teacherOptions]}
              dark={dark}
              portal
              menuMaxHeight={240}
              triggerClassName={selectTrigger}
            />
          </div>
          <div className="w-[148px] shrink-0">
            <p className={labelClass}>Class</p>
            <ScrollableSelect
              value={selectedClassId}
              onChange={setSelectedClassId}
              options={classSectionOptions.map((item) => ({ value: item._id, label: `${item.className} ${item.section || "A"}` }))}
              dark={dark}
              portal
              menuMaxHeight={240}
              triggerClassName={selectTrigger}
            />
          </div>
          <div className="w-[80px] shrink-0">
            <p className={labelClass}>Records</p>
            <div className={`${fieldShell} flex items-center justify-center font-semibold`}>{records.length}</div>
          </div>
          <div className={`inline-flex h-11 shrink-0 items-center rounded-xl border p-1 ${dark ? "border-white/[0.06] bg-[#1a1b26]" : "border-blue-200 bg-white"}`}>
            <button
              type="button"
              onClick={() => {
                rowsDirtyRef.current = false;
                setMode("MONTHLY");
                setMonthTitle(MONTH_OPTIONS[month].label.toUpperCase());
                setRows(createRows(subjectRows));
                setBookTitle("BOOKS NAME");
                setLastUpdated(null);
              }}
              className={`h-full rounded-lg px-3.5 text-xs font-black uppercase ${mode === "MONTHLY" ? "bg-blue-700 text-white" : dark ? "text-[#93c5fd]" : "text-blue-700"}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => {
                rowsDirtyRef.current = false;
                setMode("ANNUALLY");
                setMonthTitle("ANNUALLY");
                setRows(createRows(subjectRows));
                setBookTitle("BOOKS NAME");
                setLastUpdated(null);
              }}
              className={`h-full rounded-lg px-3.5 text-xs font-black uppercase ${mode === "ANNUALLY" ? "bg-blue-700 text-white" : dark ? "text-[#93c5fd]" : "text-blue-700"}`}
            >
              Annually
            </button>
          </div>
          <button onClick={save} disabled={saving} className="h-11 shrink-0 rounded-xl bg-blue-700 px-5 text-sm font-black uppercase text-white">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <SaveModal open={Boolean(success)} summary={saveSummary} onClose={() => { setSuccess(""); setSaveSummary(""); }} />

      <div className="overflow-x-auto rounded-xl border-[3px] border-blue-600 bg-white [font-family:'Montserrat','Inter',sans-serif]">
        <div className="relative overflow-hidden border border-white bg-white px-4 py-4 text-center">
          <CornerSeal side="left" />
          <CornerSeal side="right" />
          <div className="text-[26px] font-black uppercase leading-tight tracking-wide text-blue-950">
            {mode === "ANNUALLY" ? `ANNUALLY ${year}` : `${(monthTitle || MONTH_OPTIONS[month].label).toUpperCase()} ${year}`}
          </div>
          <div className="mt-1 text-sm font-bold uppercase tracking-wide text-blue-950">Class: {selectedClass ? `${selectedClass.className} ${selectedClass.section || "A"}` : "-"}</div>
        </div>
        <table className="w-full table-auto border-collapse text-center">
          <thead>
            <tr className="bg-blue-700 text-white">
              <th className="w-[180px] min-w-[180px] whitespace-nowrap border border-blue-500 px-3 py-3 text-sm font-extrabold uppercase tracking-wide">Books/Subjects</th>
              <th className="border border-blue-500 px-3 py-3 text-sm font-extrabold uppercase tracking-wide">Syllabus</th>
              <th className="w-[120px] max-w-[120px] min-w-[120px] border border-blue-500 px-3 py-3 text-sm font-extrabold uppercase tracking-wide">Covered%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="h-[72px]">
                <td className="w-[180px] min-w-[180px] whitespace-nowrap border border-blue-500 px-2 py-3">
                  <p className="w-full text-center text-sm font-extrabold uppercase tracking-wide text-blue-950 [font-family:'Montserrat','Inter',sans-serif]">{row.subject}</p>
                </td>
                <td className="border border-blue-500 px-2 py-3 align-middle">
                  <EditableCell value={row.syllabus} onChange={(value) => updateRow(row.id, "syllabus", value)} multiline />
                </td>
                <td className="w-[120px] max-w-[120px] min-w-[120px] border border-blue-500 px-2 py-3">
                  <input value={row.covered} onChange={(e) => updateRow(row.id, "covered", e.target.value)} className="w-full bg-transparent text-center text-sm font-extrabold outline-none [font-family:'Montserrat','Inter',sans-serif]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end border-t border-blue-200 px-4 py-2">
          <p className="text-xs font-semibold text-slate-500">
            Last Updated: {lastUpdated ? formatUpdatedAt(lastUpdated) : "—"}
          </p>
        </div>
      </div>
    </section>
  );
}
