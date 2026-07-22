import { useEffect, useMemo, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import api from "../../../services/api/client";
import ModernDatePicker from "../../components/ui/ModernDatePicker";
import ScrollableSelect from "../../components/ui/ScrollableSelect";
import { withTeacherBranchParams } from "../../utils/branch";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DUTIES = [
  { key: "assembly", label: "Assembly Duty", icon: "⚑" },
  { key: "neatness", label: "Neatness Check", icon: "🧹" },
  { key: "uniform", label: "Uniform Check", icon: "👕" },
  { key: "attendance", label: "Student Attendance", icon: "✓" },
  { key: "corridor", label: "Corridor Monitoring", icon: "▣" },
  { key: "discipline", label: "Discipline Monitoring", icon: "🛡" },
  { key: "classroom", label: "Classroom Supervision", icon: "👥" },
  { key: "library", label: "Library Duty", icon: "📖" },
  { key: "canteen", label: "Canteen Duty", icon: "☕" },
  { key: "gate", label: "Gate Duty", icon: "🚪" },
  { key: "other", label: "Other Duties", icon: "⋯" },
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

const WEEK_OPTIONS = [
  { value: "1", label: "1st Week" },
  { value: "2", label: "2nd Week" },
  { value: "3", label: "3rd Week" },
  { value: "4", label: "4th Week" },
  { value: "5", label: "5th Week" },
];

const blankRow = (day) => ({
  day,
  teacherId: "",
  teacherName: "",
  duties: DUTIES.map((duty) => ({ ...duty, assigned: false })),
});

function weekMonday(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayNum = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayNum}`;
}

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function LogoBadge() {
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-blue-700">
      <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none" aria-hidden="true">
        <path d="M32 5 52 12v17c0 13-8.4 23.2-20 29C20.4 52.2 12 42 12 29V12l20-7Z" fill="#ffffff" stroke="#0b55c8" strokeWidth="2.4" />
        <path d="M32 12 46 17v12c0 8.6-5.8 16.2-14 21-8.2-4.8-14-12.4-14-21V17l14-5Z" fill="#eff6ff" stroke="#0b55c8" strokeWidth="1.8" />
        <path d="M24 27c0-2.2 1.8-4 4-4h8c2.2 0 4 1.8 4 4v12H24V27Z" fill="#0b55c8" />
        <path d="M28 29h8M28 34h8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function mapDutyRowsFromApi(dutyData) {
  if (!dutyData?.rows?.length) {
    return {
      rows: DAYS.map(blankRow),
      notes: "",
      signatureTeacherName: "",
      signatureDate: "",
    };
  }

  return {
    rows: DAYS.map((day) => {
      const row = dutyData.rows.find((item) => item.day === day);
      if (!row) return blankRow(day);
      return {
        day,
        teacherId: row.teacherId?._id || row.teacherId || "",
        teacherName: row.teacherName || row.teacherId?.fullName || "",
        duties: DUTIES.map((duty) => ({
          ...duty,
          assigned: Boolean(row.duties?.find((item) => item.key === duty.key)?.assigned),
        })),
      };
    }),
    notes: dutyData.notes || "",
    signatureTeacherName: dutyData.signatureTeacherName || "",
    signatureDate: dutyData.signatureDate || "",
  };
}

function downloadCsv(filename, rows, notes) {
  const header = ["Day", "Teacher", ...DUTIES.map((d) => d.label)];
  const lines = [header.join(",")];
  rows.forEach((row) => {
    const cols = [
      row.day,
      `"${String(row.teacherName || "").replace(/"/g, '""')}"`,
      ...DUTIES.map((duty) => (row.duties.find((item) => item.key === duty.key)?.assigned ? "Yes" : "No")),
    ];
    lines.push(cols.join(","));
  });
  if (notes) {
    lines.push("");
    lines.push(`Notes,"${String(notes).replace(/"/g, '""')}"`);
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function TeacherDutiesPage({ dark = false, branchSection = "Boys" }) {
  const [weekCommencing, setWeekCommencing] = useState(weekMonday());
  const [teacherOptions, setTeacherOptions] = useState([]);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [rows, setRows] = useState(DAYS.map(blankRow));
  const [notes, setNotes] = useState("");
  const [signatureTeacherName, setSignatureTeacherName] = useState("");
  const [signatureDate, setSignatureDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState(() => currentMonthValue().slice(5, 7));
  const [reportYear, setReportYear] = useState(() => currentMonthValue().slice(0, 4));
  const [reportWeek, setReportWeek] = useState("1");
  const [reportBusy, setReportBusy] = useState(false);

  const filteredTeacherOptions = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    return teacherOptions.filter((teacher) => {
      const label = teacher.fullName || teacher.name || teacher.email || "";
      return !q || label.toLowerCase().includes(q);
    });
  }, [teacherOptions, teacherSearch]);

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 8 }, (_, i) => {
      const year = String(current - 3 + i);
      return { value: year, label: year };
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [teachersRes, dutiesRes] = await Promise.all([
          api.get("/teachers", { params: withTeacherBranchParams({ page: 1, limit: 500 }, branchSection) }),
          api.get("/teacher-panel/duties", { params: { date: weekCommencing } }),
        ]);

        const teachers = teachersRes.data?.data?.items || [];
        setTeacherOptions(teachers);

        const mapped = mapDutyRowsFromApi(dutiesRes.data?.data);
        setRows(mapped.rows);
        setNotes(mapped.notes);
        setSignatureTeacherName(mapped.signatureTeacherName);
        setSignatureDate(mapped.signatureDate);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load duties");
        setRows(DAYS.map(blankRow));
        setNotes("");
        setSignatureTeacherName("");
        setSignatureDate("");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [weekCommencing, branchSection]);

  const updateTeacher = (rowIndex, teacherId) => {
    const teacher = teacherOptions.find((item) => item._id === teacherId);
    setRows((current) =>
      current.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              teacherId,
              teacherName: teacher?.fullName || teacher?.name || teacher?.email || "",
            }
          : row
      )
    );
  };

  const updateDuty = (rowIndex, dutyKey, assigned) => {
    setRows((current) =>
      current.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              duties: row.duties.map((duty) => (duty.key === dutyKey ? { ...duty, assigned } : duty)),
            }
          : row
      )
    );
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSaveMessage("");
    try {
      const { data } = await api.post("/teacher-panel/duties", {
        weekCommencing,
        rows,
        notes,
        signatureTeacherName,
        signatureDate,
      });
      const mapped = mapDutyRowsFromApi(data?.data);
      setRows(mapped.rows);
      setNotes(mapped.notes);
      setSignatureTeacherName(mapped.signatureTeacherName);
      setSignatureDate(mapped.signatureDate);
      setSaveMessage("Duty assignments saved successfully.");
      window.setTimeout(() => setSaveMessage(""), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save duties");
    } finally {
      setSaving(false);
    }
  };

  const fetchReportData = async () => {
    const month = `${reportYear}-${reportMonth}`;
    const { data } = await api.get("/teacher-panel/duties/report", {
      params: { month, week: reportWeek },
    });
    return mapDutyRowsFromApi(data?.data);
  };

  const handleDownloadCsv = async () => {
    setReportBusy(true);
    setError("");
    try {
      const mapped = await fetchReportData();
      const monthLabel = MONTH_OPTIONS.find((m) => m.value === reportMonth)?.label || reportMonth;
      downloadCsv(`teacher_duties_${reportYear}-${reportMonth}_week${reportWeek}.csv`, mapped.rows, mapped.notes);
      setReportOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download CSV report");
    } finally {
      setReportBusy(false);
    }
  };

  const handleDownloadPdf = async () => {
    setReportBusy(true);
    setError("");
    try {
      const mapped = await fetchReportData();
      const monthLabel = MONTH_OPTIONS.find((m) => m.value === reportMonth)?.label || reportMonth;
      const weekLabel = WEEK_OPTIONS.find((w) => w.value === reportWeek)?.label || `Week ${reportWeek}`;

      const exportRoot = document.createElement("div");
      exportRoot.style.position = "fixed";
      exportRoot.style.left = "-10000px";
      exportRoot.style.top = "0";
      exportRoot.style.width = "1100px";
      exportRoot.style.background = "#fff";
      exportRoot.innerHTML = `
        <div style="padding:24px;font-family:Arial,sans-serif;color:#0f172a;">
          <h1 style="margin:0;font-size:22px;text-align:center;">Teacher Assigned Duties</h1>
          <p style="margin:8px 0 16px;text-align:center;font-size:13px;">${monthLabel} ${reportYear} · ${weekLabel}</p>
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
              <tr style="background:#1d4ed8;color:#fff;">
                <th style="border:1px solid #93c5fd;padding:8px;text-align:left;">Day</th>
                <th style="border:1px solid #93c5fd;padding:8px;text-align:left;">Teacher</th>
                ${DUTIES.map((d) => `<th style="border:1px solid #93c5fd;padding:6px;text-align:center;">${d.label}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${mapped.rows
                .map(
                  (row) => `
                <tr>
                  <td style="border:1px solid #bfdbfe;padding:8px;font-weight:700;">${row.day}</td>
                  <td style="border:1px solid #bfdbfe;padding:8px;">${row.teacherName || "-"}</td>
                  ${DUTIES.map((duty) => {
                    const assigned = row.duties.find((item) => item.key === duty.key)?.assigned;
                    return `<td style="border:1px solid #bfdbfe;padding:8px;text-align:center;">${assigned ? "✓" : ""}</td>`;
                  }).join("")}
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
          ${mapped.notes ? `<p style="margin-top:16px;font-size:12px;"><strong>Notes:</strong> ${mapped.notes}</p>` : ""}
        </div>
      `;
      document.body.appendChild(exportRoot);
      const canvas = await html2canvas(exportRoot.firstElementChild, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width * ratio, canvas.height * ratio);
      pdf.save(`teacher_duties_${reportYear}-${reportMonth}_week${reportWeek}.pdf`);
      document.body.removeChild(exportRoot);
      setReportOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download PDF report");
    } finally {
      setReportBusy(false);
    }
  };

  if (loading) {
    return <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Loading duties board...</p>;
  }

  return (
    <section className="space-y-2">
      {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
      {saveMessage ? <p className="text-sm font-semibold text-emerald-600">{saveMessage}</p> : null}

      <div className="overflow-hidden rounded-[16px] border-4 border-blue-700 bg-white shadow-[0_18px_48px_rgba(37,99,235,0.18)]">
        <div className="relative overflow-hidden border-2 border-white bg-white px-4 pb-3 pt-2">
          <div className="pointer-events-none absolute left-0 top-0 h-24 w-52 rounded-br-[100%] bg-blue-600" />
          <div className="pointer-events-none absolute left-5 top-2 h-20 w-64 rounded-br-[100%] border-t-4 border-white" />
          <div className="pointer-events-none absolute right-0 top-0 h-24 w-52 rounded-bl-[100%] bg-blue-600" />
          <div className="pointer-events-none absolute right-5 top-2 h-20 w-64 rounded-bl-[100%] border-t-4 border-white" />
          <div className="pointer-events-none absolute left-16 top-2 h-8 w-36 bg-[radial-gradient(circle,#60a5fa_1px,transparent_1.5px)] [background-size:8px_8px] opacity-45" />
          <div className="pointer-events-none absolute right-16 top-2 h-8 w-36 bg-[radial-gradient(circle,#60a5fa_1px,transparent_1.5px)] [background-size:8px_8px] opacity-45" />

          <div className="relative z-10 mb-2 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="rounded-md border border-blue-700 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-700"
            >
              Download Report
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-md bg-blue-700 px-5 py-2 text-xs font-black uppercase tracking-[0.14em] text-white shadow-[0_10px_20px_rgba(37,99,235,0.25)]"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>

          <div className="relative z-10 grid grid-cols-[96px_minmax(0,1fr)_96px] items-start gap-3">
            <div className="flex justify-center">
              <div className="scale-90">
                <LogoBadge />
              </div>
            </div>
            <div className="pt-0.5 text-center">
              <h3 className="text-[clamp(22px,2.6vw,42px)] font-black uppercase leading-none tracking-[0.06em] text-blue-950">
                Teacher Assigned Duties
              </h3>
              <div className="mx-auto mt-2 flex max-w-[480px] items-center justify-center gap-3 text-blue-800">
                <span className="h-px flex-1 bg-blue-700/50" />
                <span className="text-2xl leading-none">★ ★ ★</span>
                <span className="h-px flex-1 bg-blue-700/50" />
              </div>
            </div>
            <div className="flex justify-center">
              <div className="scale-90">
                <LogoBadge />
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-black uppercase text-blue-900">
              <span>Week Commencing:</span>
              <div className="min-w-[200px]">
                <ModernDatePicker
                  label=""
                  value={weekCommencing}
                  onChange={(value) => setWeekCommencing(weekMonday(value || new Date()))}
                  dark={dark}
                  placeholder="Select week"
                  openUpward
                />
              </div>
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-sm font-bold text-blue-800 shadow-sm">
              Search Teacher
              <input
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                className="w-44 border-0 bg-transparent text-sm font-semibold text-slate-800 outline-none focus:outline-none focus:ring-0"
                placeholder="Type a name..."
              />
            </label>
          </div>

          <div className="relative z-10 mt-2 overflow-hidden rounded-[8px] border border-blue-300">
            <table className="w-full table-fixed border-collapse bg-white text-blue-950">
              <thead>
                <tr className="bg-blue-800 text-white">
                  <th className="w-[200px] border border-blue-300 px-3 py-1.5 text-left text-sm font-black uppercase">Teacher Name</th>
                  <th className="w-[120px] border border-blue-300 px-3 py-1.5 text-left text-sm font-black uppercase">Day</th>
                  <th className="border border-blue-300 px-2 py-1.5 text-center text-sm font-black uppercase" colSpan={DUTIES.length}>
                    Duties
                  </th>
                </tr>
                <tr className="bg-white">
                  <th className="border border-blue-300 px-2 py-1.5" />
                  <th className="border border-blue-300 px-2 py-1.5" />
                  {DUTIES.map((duty) => (
                    <th key={duty.key} className="border border-blue-300 px-1 py-1.5 align-top">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-blue-200 text-lg text-blue-800">
                          <span>{duty.icon}</span>
                        </div>
                        <span className="block text-[10px] font-semibold leading-tight text-blue-900">{duty.label}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={row.day}>
                    <td className="border border-blue-300 px-2 py-1.5">
                      <ScrollableSelect
                        placeholder={filteredTeacherOptions.length ? "Select Teacher" : "No teachers found"}
                        value={row.teacherId}
                        options={filteredTeacherOptions.map((teacher) => ({
                          value: teacher._id,
                          label: teacher.fullName || teacher.name || teacher.email || "Teacher",
                        }))}
                        onChange={(value) => updateTeacher(rowIndex, value)}
                        openUpward
                        portal
                        menuMaxHeight={240}
                        dark={dark}
                      />
                    </td>
                    <td className="border border-blue-300 px-2 py-1.5 text-sm font-black uppercase text-blue-800">{row.day}</td>
                    {DUTIES.map((duty) => (
                      <td key={duty.key} className="border border-blue-300 px-1.5 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(row.duties.find((item) => item.key === duty.key)?.assigned)}
                          onChange={(e) => updateDuty(rowIndex, duty.key, e.target.checked)}
                          className="h-4 w-4 rounded border-blue-500 text-blue-700 focus:outline-none focus:ring-0"
                          aria-label={`${row.day} ${duty.label}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="relative z-10 mt-2">
            <div className="mb-1 inline-flex rounded bg-blue-700 px-3 py-0.5 text-xs font-black uppercase text-white">Notes:</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="min-h-14 w-full resize-none border-0 border-b border-blue-300 bg-transparent px-0 py-1 text-sm font-semibold text-blue-950 outline-none focus:outline-none focus:ring-0"
            />
          </div>
        </div>
      </div>

      {reportOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className={`w-full max-w-md rounded-2xl border p-5 shadow-xl ${dark ? "border-white/10 bg-[#161722] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
            <h4 className="text-lg font-bold">Download Duties Report</h4>
            <p className={`mt-1 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
              Choose month and week of the duty board to export.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <ScrollableSelect
                label="Month"
                value={reportMonth}
                options={MONTH_OPTIONS}
                onChange={setReportMonth}
                dark={dark}
                portal
              />
              <ScrollableSelect
                label="Year"
                value={reportYear}
                options={yearOptions}
                onChange={setReportYear}
                dark={dark}
                portal
              />
              <ScrollableSelect
                label="Week"
                value={reportWeek}
                options={WEEK_OPTIONS}
                onChange={setReportWeek}
                dark={dark}
                portal
              />
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                disabled={reportBusy}
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${dark ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDownloadCsv}
                disabled={reportBusy}
                className="rounded-lg border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700"
              >
                {reportBusy ? "Working..." : "CSV"}
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={reportBusy}
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
              >
                {reportBusy ? "Working..." : "PDF"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
