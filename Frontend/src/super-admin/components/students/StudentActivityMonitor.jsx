import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import api from "../../services/api/client";
import { CLASS_OPTIONS, SECTION_OPTIONS } from "../../constants/classes";
import { resolveStudentPhotoUrl } from "../../utils/mediaUrl";
import { withStudentBranchParams } from "../../utils/branch";
import ScrollableSelect from "../ui/ScrollableSelect";
import ThemeToggleButton from "../ui/ThemeToggleButton";
import StudentAttendanceCalendarModal from "./StudentAttendanceCalendarModal";
import OverallAttendanceListModal from "./OverallAttendanceListModal";
import { subscribeAttendanceUpdated } from "../../../utils/attendanceSync";

const ATTENDANCE_POLL_MS = 2500;
function IconSearch() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
    </svg>
  );
}

function StudentAvatar({ student, dark = false }) {
  const initials = `${student?.firstName || ""}${student?.lastName || ""}`
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
  const photo = resolveStudentPhotoUrl(student?.studentPhotoUrl);

  if (photo) {
    return (
      <img
        src={photo}
        alt={`${student?.firstName || ""} ${student?.lastName || ""}`.trim() || initials}
        className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white"
      />
    );
  }

  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-semibold ${
        dark ? "bg-[#7c4dff]/20 text-[#b794ff]" : "bg-blue-100 text-blue-700"
      }`}
    >
      {initials || "?"}
    </div>
  );
}

function TotalAttendanceCell({ totals, dark = false, loading = false }) {
  if (loading) {
    return <span className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-400"}`}>Loading...</span>;
  }

  const data = totals || { present: 0, absent: 0, onLeave: 0 };

  const items = [
    { label: "Present", value: data.present, dot: dark ? "bg-[#4caf50]" : "bg-green-500", text: dark ? "text-[#4caf50]" : "text-green-700" },
    { label: "Absent", value: data.absent, dot: dark ? "bg-[#ef4444]" : "bg-red-500", text: dark ? "text-[#ef4444]" : "text-red-700" },
    { label: "On Leave", value: data.onLeave, dot: dark ? "bg-[#facc15]" : "bg-yellow-400", text: dark ? "text-[#facc15]" : "text-yellow-700" },
  ];

  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item) => (
        <span
          key={item.label}
          className={`inline-flex items-center gap-2 text-sm font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}
        >
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.dot}`} />
          <span>{item.label}:</span>
          <span className={item.text}>{item.value}</span>
        </span>
      ))}
    </div>
  );
}

export default function StudentActivityMonitor({ dark = false, onToggleTheme, refreshKey = 0, branchSection = "Boys" }) {
  const [allStudents, setAllStudents] = useState([]);
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceTotals, setAttendanceTotals] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [showOverallList, setShowOverallList] = useState(false);
  const attendanceFirstLoadRef = useRef(true);
  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/students", {
        params: withStudentBranchParams({ page: 1, limit: 500, status: "ACTIVE" }, branchSection),
      });
      setAllStudents(data.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load students");
      setAllStudents([]);
    } finally {
      setLoading(false);
    }
  }, [branchSection]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents, refreshKey]);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allStudents.filter((student) => {
      if (className && student.className !== className) return false;
      if (section && (student.section || "A") !== section) return false;
      if (query) {
        const name = `${student.firstName || ""} ${student.lastName || ""}`.toLowerCase();
        const admissionNo = (student.admissionNo || "").toLowerCase();
        const rollNumber = (student.rollNumber || "").toLowerCase();
        if (!name.includes(query) && !admissionNo.includes(query) && !rollNumber.includes(query)) return false;
      }
      return true;
    });
  }, [allStudents, className, section, searchQuery]);

  useEffect(() => {
    const ids = filteredStudents.map((student) => student._id).filter(Boolean);
    if (!ids.length) {
      setAttendanceTotals({});
      attendanceFirstLoadRef.current = true;
      return undefined;
    }

    let cancelled = false;

    const loadAttendanceTotals = async ({ silent = false } = {}) => {
      if (!silent || attendanceFirstLoadRef.current) {
        setLoadingAttendance(true);
      }
      try {
        const { data } = await api.get("/students/attendance-totals", {
          params: { ids: ids.join(",") },
        });
        if (!cancelled) {
          setAttendanceTotals(data.data || {});
          attendanceFirstLoadRef.current = false;
        }
      } catch {
        if (!cancelled && !silent) setAttendanceTotals({});
      } finally {
        if (!cancelled) setLoadingAttendance(false);
      }
    };

    loadAttendanceTotals({ silent: false });
    const intervalId = window.setInterval(() => {
      loadAttendanceTotals({ silent: true });
    }, ATTENDANCE_POLL_MS);

    const onFocus = () => loadAttendanceTotals({ silent: true });
    const onVisibility = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    const unsubscribe = subscribeAttendanceUpdated(() => loadAttendanceTotals({ silent: true }));
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribe();
    };
  }, [filteredStudents, refreshKey]);

  const classOptions = useMemo(
    () => [{ value: "", label: "All Classes" }, ...CLASS_OPTIONS.map((item) => ({ value: item, label: item }))],
    []
  );

  const sectionOptions = useMemo(
    () => [{ value: "", label: "All Sections" }, ...SECTION_OPTIONS.map((item) => ({ value: item, label: `Section ${item}` }))],
    []
  );

  const canDownloadReport = Boolean(className && section);

  const downloadAttendanceReport = async () => {
    if (!canDownloadReport) {
      setError("Select class and section before downloading the attendance report.");
      return;
    }

    setDownloading(true);
    setError("");
    try {
      const reportStudents = allStudents
        .filter((student) => student.className === className && (student.section || "A") === section)
        .sort((a, b) => String(a.rollNumber || "").localeCompare(String(b.rollNumber || ""), undefined, { numeric: true }));

      if (!reportStudents.length) {
        setError("No students found for the selected class and section.");
        return;
      }

      const ids = reportStudents.map((student) => student._id).filter(Boolean);
      const { data } = await api.get("/students/attendance-totals", {
        params: { ids: ids.join(",") },
      });
      const totalsMap = data.data || {};

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Student Attendance Report", 14, 16);
      doc.setFontSize(10);
      doc.text(`Class: ${className} - Section ${section}`, 14, 24);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Students: ${reportStudents.length}`, 14, 36);

      let y = 46;
      doc.setFont(undefined, "bold");
      doc.text("Roll No#", 14, y);
      doc.text("Student ID", 36, y);
      doc.text("Name", 78, y);
      doc.text("Present", 130, y);
      doc.text("Absent", 152, y);
      doc.text("On Leave", 172, y);
      doc.setFont(undefined, "normal");
      y += 7;

      reportStudents.forEach((student) => {
        if (y > 280) {
          doc.addPage();
          y = 18;
        }
        const totals = totalsMap[student._id] || { present: 0, absent: 0, onLeave: 0 };
        const name = `${student.firstName || ""} ${student.lastName || ""}`.trim() || "-";
        doc.text(String(student.rollNumber || "-"), 14, y);
        doc.text(String(student.admissionNo || "-").slice(0, 16), 36, y);
        doc.text(name.slice(0, 24), 78, y);
        doc.text(String(totals.present || 0), 130, y);
        doc.text(String(totals.absent || 0), 152, y);
        doc.text(String(totals.onLeave || 0), 172, y);
        y += 7;
      });

      doc.save(`attendance-report_${className}_sec-${section}.pdf`.replace(/\s+/g, "_"));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download attendance report");
    } finally {
      setDownloading(false);
    }
  };

  const thClass = dark
    ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e]"
    : "border-slate-100 bg-slate-50 text-slate-500";
  const rowHoverClass = dark
    ? "cursor-pointer border-b border-white/[0.06] transition hover:bg-white/[0.04]"
    : "cursor-pointer border-b border-slate-100 transition hover:bg-indigo-50/60";

  return (
    <div>
      <div
        className={`flex flex-col gap-3 border-b px-5 py-4 xl:flex-row xl:items-center xl:justify-between ${
          dark ? "border-white/[0.06]" : "border-slate-100"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              dark ? "bg-[#2196f3]/15 text-[#64b5f6]" : "bg-sky-50 text-sky-600"
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </span>
          <h3 className={`text-base font-semibold ${dark ? "text-white" : "text-slate-800"}`}>Student Activity Monitor</h3>
          <ThemeToggleButton dark={dark} onToggle={onToggleTheme} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end xl:justify-end">
          <div className="min-w-[140px] flex-1 sm:max-w-[160px]">
            <ScrollableSelect
              label="Class"
              placeholder="All Classes"
              value={className}
              options={classOptions}
              onChange={setClassName}
              dark={dark}
            />
          </div>
          <div className="min-w-[130px] flex-1 sm:max-w-[150px]">
            <ScrollableSelect
              label="Section"
              placeholder="All Sections"
              value={section}
              options={sectionOptions}
              onChange={setSection}
              dark={dark}
            />
          </div>
          <div className="min-w-[180px] flex-1 sm:max-w-[220px]">
            <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>
              Search
            </label>
            <div className="relative">
              <span
                className={`pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 ${
                  dark ? "text-[#9e9e9e]" : "text-slate-400"
                }`}
              >
                <IconSearch />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type student name..."
                className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none ${
                  dark
                    ? "border-white/[0.06] bg-[#1a1b26] text-white placeholder:text-[#9e9e9e] focus:border-[#7c4dff]/40 focus:ring-2 focus:ring-[#7c4dff]/15"
                    : "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                }`}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={downloadAttendanceReport}
            disabled={!canDownloadReport || downloading}
            title={canDownloadReport ? "Download attendance report" : "Select class and section first"}
            className={`inline-flex h-[42px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              dark
                ? "bg-[#7c4dff] text-white hover:bg-[#6a3df0]"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 3v12" strokeLinecap="round" />
              <path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 21h14" strokeLinecap="round" />
            </svg>
            {downloading ? "Downloading..." : "Download Report"}
          </button>
          <button
            type="button"
            onClick={() => setShowOverallList(true)}
            className={`inline-flex h-[42px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
              dark
                ? "border-white/[0.12] bg-[#1a1b26] text-white hover:bg-white/[0.05]"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Overall Attendance List
          </button>
        </div>
      </div>

      <div className="px-5 py-5">
        {error ? (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              dark ? "border-[#e91e63]/30 bg-[#e91e63]/10 text-[#e91e63]" : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {error}
          </div>
        ) : null}

        {loading ? (
          <p className={`py-10 text-center text-base ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Loading students...</p>
        ) : !filteredStudents.length ? (
          <div
            className={`rounded-2xl border px-4 py-14 text-center text-base ${
              dark ? "border-white/[0.06] text-[#9e9e9e]" : "border-slate-200 text-slate-500"
            }`}
          >
            No students match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="min-w-full text-base">
              <thead>
                <tr className={`border-b text-left text-xs font-semibold uppercase tracking-wider ${thClass}`}>
                  <th className="px-4 py-3.5">Profile</th>
                  <th className="px-4 py-3.5">Roll No#</th>
                  <th className="px-4 py-3.5">Student ID</th>
                  <th className="px-4 py-3.5">Name</th>
                  <th className="px-4 py-3.5">Class</th>
                  <th className="px-4 py-3.5">Total Attendance</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr
                    key={student._id}
                    className={rowHoverClass}
                    onClick={() => setSelectedStudent(student)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedStudent(student);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`View attendance for ${student.firstName} ${student.lastName}`}
                  >
                    <td className="px-4 py-3.5">
                      <StudentAvatar student={student} dark={dark} />
                    </td>
                    <td className={`px-4 py-3.5 font-mono text-base font-medium ${dark ? "text-white/90" : "text-slate-700"}`}>
                      {student.rollNumber || "—"}
                    </td>
                    <td className={`px-4 py-3.5 font-mono text-base font-medium ${dark ? "text-white/90" : "text-slate-700"}`}>
                      {student.admissionNo}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className={`text-base font-semibold ${dark ? "text-white" : "text-slate-800"}`}>
                        {student.firstName} {student.lastName}
                      </p>
                    </td>
                    <td className={`px-4 py-3.5 text-base ${dark ? "text-[#9e9e9e]" : "text-slate-700"}`}>
                      {student.className} - {student.section || "A"}
                    </td>
                    <td className="px-4 py-3.5">
                      <TotalAttendanceCell
                        totals={attendanceTotals[student._id]}
                        dark={dark}
                        loading={loadingAttendance}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={`mt-3 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
              Showing {filteredStudents.length} student{filteredStudents.length === 1 ? "" : "s"} · Click a row to view attendance calendar
            </p>
          </div>
        )}
      </div>

      <StudentAttendanceCalendarModal
        open={Boolean(selectedStudent)}
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        dark={dark}
        onToggleTheme={onToggleTheme}
        refreshKey={refreshKey}
      />

      <OverallAttendanceListModal
        open={showOverallList}
        onClose={() => setShowOverallList(false)}
        dark={dark}
        branchSection={branchSection}
      />
    </div>
  );
}
