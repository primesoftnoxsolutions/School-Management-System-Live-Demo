import { useEffect, useMemo, useState } from "react";
import api from "../../services/api/client";
import FormModal from "../../components/ui/FormModal";
import ModernDatePicker from "../../components/ui/ModernDatePicker";
import ScrollableSelect from "../../components/ui/ScrollableSelect";
import { resolveStudentPhotoUrl } from "../../utils/mediaUrl";
import useTeacherClassOptions from "../../hooks/useTeacherClassOptions";
import { notifyAttendanceUpdated } from "../../utils/attendanceSync";

const today = () => new Date().toISOString().slice(0, 10);

const STATUS_BUTTONS = [
  { value: "PRESENT", label: "Present", active: "bg-emerald-600 text-white border-emerald-600" },
  { value: "ABSENT", label: "Absent", active: "bg-rose-600 text-white border-rose-600" },
  { value: "LATE", label: "Late", active: "bg-amber-500 text-white border-amber-500" },
  { value: "LEAVE", label: "Leave", active: "bg-sky-600 text-white border-sky-600" },
];

const CALENDAR_DAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

const STATUS_META = {
  PRESENT: { label: "Present", dot: "bg-emerald-500", cell: "bg-emerald-500 text-white border-emerald-500" },
  ABSENT: { label: "Absent", dot: "bg-rose-500", cell: "bg-rose-500 text-white border-rose-500" },
  LATE: { label: "Late", dot: "bg-amber-500", cell: "bg-amber-500 text-white border-amber-500" },
  LEAVE: { label: "On Leave", dot: "bg-amber-400", cell: "bg-amber-400 text-white border-amber-400" },
  NO_RECORD: { label: "No Record", dot: "bg-slate-300", cell: "bg-slate-200 text-slate-700 border-slate-200" },
};

const formatDateKey = (date) => date.toISOString().slice(0, 10);

const getMonthLabel = (date) => date.toLocaleDateString([], { month: "long", year: "numeric" });

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "S";

function AttendanceProfile({ row, onClick }) {
  const photo = resolveStudentPhotoUrl(row.studentPhotoUrl);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xs font-black text-blue-700 transition hover:bg-blue-200"
      title="Open attendance calendar"
    >
      {photo ? (
        <img src={photo} alt={`${row.name} profile`} className="h-full w-full object-cover" />
      ) : (
        getInitials(row.name)
      )}
    </button>
  );
}

function AttendanceTotal({ row }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium leading-none text-slate-700">
      <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        <span>Present:</span>
        <span className="font-semibold text-emerald-700">{row.present}</span>
      </div>
      <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
        <span>Absent:</span>
        <span className="font-semibold text-rose-600">{row.absent}</span>
      </div>
      <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span>On Leave:</span>
        <span className="font-semibold text-amber-600">{row.leave}</span>
      </div>
    </div>
  );
}

const buildCalendarCells = (monthDate) => {
  const year = monthDate.getFullYear();
  const monthIndex = monthDate.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const startOffset = firstDay.getDay();
  const totalCells = 42;
  const cells = [];

  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - startOffset + 1;
    const cellDate = new Date(year, monthIndex, dayNumber);
    const inMonth = cellDate.getMonth() === monthIndex;

    cells.push({
      key: formatDateKey(cellDate),
      day: cellDate.getDate(),
      inMonth,
    });
  }

  return cells;
};

function StudentAttendanceCalendarModal({
  open,
  dark,
  student,
  classLabel,
  monthDate,
  days,
  loading,
  error,
  onClose,
  onPrevMonth,
  onNextMonth,
}) {
  const cells = useMemo(() => buildCalendarCells(monthDate), [monthDate]);
  const dayMap = useMemo(() => {
    const map = new Map();
    days.forEach((entry) => {
      map.set(entry.date, entry.status);
    });
    return map;
  }, [days]);

  const counts = useMemo(
    () =>
      days.reduce(
        (acc, entry) => {
          if (entry.status === "PRESENT") acc.present += 1;
          if (entry.status === "ABSENT") acc.absent += 1;
          if (entry.status === "LATE") acc.late += 1;
          if (entry.status === "LEAVE") acc.leave += 1;
          return acc;
        },
        { present: 0, absent: 0, late: 0, leave: 0 }
      ),
    [days]
  );

  return (
    <FormModal
      open={open}
      title={`${student?.name || "Student"} - ${classLabel} - ${getMonthLabel(monthDate)} attendance`}
      onClose={onClose}
      dark={dark}
      wide
    >
      {error ? <p className="mb-2 text-xs text-rose-600">{error}</p> : null}

      <div className={`rounded-xl border p-3 ${dark ? "border-white/[0.06] bg-[#1a1b26]" : "border-slate-200 bg-white shadow-sm"}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className={`text-base font-black ${dark ? "text-white" : "text-slate-900"}`}>{student?.name || "Student"}</h4>
            <p className={`mt-0.5 text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
              {classLabel} - {getMonthLabel(monthDate)} attendance
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onPrevMonth}
              className={`rounded-lg border px-2.5 py-1.5 text-sm font-semibold transition ${
                dark ? "border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.06]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              ‹
            </button>
            <div className={`min-w-[7.5rem] rounded-lg border px-3 py-1.5 text-center text-xs font-semibold ${dark ? "border-white/[0.08] bg-white/[0.03] text-white" : "border-slate-200 bg-white text-slate-800"}`}>
              {getMonthLabel(monthDate)}
            </div>
            <button
              type="button"
              onClick={onNextMonth}
              className={`rounded-lg border px-2.5 py-1.5 text-sm font-semibold transition ${
                dark ? "border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.06]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              ›
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {CALENDAR_DAYS.map((day) => (
            <div key={day} className={`text-center text-[10px] font-semibold tracking-[0.12em] ${dark ? "text-[#9e9e9e]" : "text-slate-400"}`}>
              {day}
            </div>
          ))}
        </div>

        <div className="mt-1.5 grid grid-cols-7 gap-1.5">
          {loading ? (
            <div className={`col-span-7 py-6 text-center text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Loading calendar...</div>
          ) : (
            cells.map((cell) => {
              const status = dayMap.get(cell.key) || "NO_RECORD";
              const meta = STATUS_META[status] || STATUS_META.NO_RECORD;
              return (
                <div
                  key={cell.key}
                  className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full border text-center transition sm:h-10 sm:w-10 ${meta.cell} ${
                    cell.inMonth ? "" : dark ? "opacity-35" : "opacity-35"
                  }`}
                  title={`${cell.key} ${meta.label}`}
                >
                  <span className="text-sm font-bold sm:text-base">{cell.day}</span>
                </div>
              );
            })
          )}
        </div>

        <div className={`mt-3 border-t pt-2.5 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            {["PRESENT", "ABSENT", "LATE", "LEAVE"].map((status) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_META[status].dot}`} />
                <span className={dark ? "text-[#9e9e9e]" : "text-slate-600"}>{STATUS_META[status].label}</span>
              </div>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-emerald-600">Total Present: {counts.present}</span>
            <span className={dark ? "text-[#9e9e9e]" : "text-slate-400"}>·</span>
            <span className="text-rose-500">Total Absent: {counts.absent}</span>
            <span className={dark ? "text-[#9e9e9e]" : "text-slate-400"}>·</span>
            <span className="text-amber-500">Total Late: {counts.late}</span>
            <span className={dark ? "text-[#9e9e9e]" : "text-slate-400"}>·</span>
            <span className="text-sky-500">Total On Leave: {counts.leave}</span>
          </div>
        </div>
      </div>
    </FormModal>
  );
}

export default function TeacherAttendancePage({ dark = false }) {
  const { classOptions } = useTeacherClassOptions();
  const [selectedClassId, setSelectedClassId] = useState("");
  const [fromDate, setFromDate] = useState(today());
  const [toDate, setToDate] = useState(today());
  const [summaryRows, setSummaryRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [todayRecords, setTodayRecords] = useState({});
  const [remarksByStudent, setRemarksByStudent] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showReportFormat, setShowReportFormat] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [markingId, setMarkingId] = useState("");
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentCalendar, setShowStudentCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [studentCalendarDays, setStudentCalendarDays] = useState([]);
  const [studentCalendarLoading, setStudentCalendarLoading] = useState(false);
  const [studentCalendarError, setStudentCalendarError] = useState("");

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
    () => classSectionOptions.find((c) => c._id === selectedClassId) || null,
    [classSectionOptions, selectedClassId]
  );

  const loadSummary = async (className, section, from, to) => {
    if (!className || !from || !to) {
      setSummaryRows([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/teacher-panel/attendance/summary", {
        params: { className, section: section || "A", fromDate: from, toDate: to },
      });
      setSummaryRows(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load attendance summary");
      setSummaryRows([]);
    } finally {
      setLoading(false);
    }
  };

  const loadModalData = async (className, section) => {
    setModalLoading(true);
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        api.get("/teacher-panel/students", { params: { className, section: section || "A" } }),
        api.get("/teacher-panel/attendance", {
          params: {
            className,
            section: section || "A",
            date: today(),
            page: 1,
            limit: 200,
          },
        }),
      ]);

      setStudents(studentsRes.data.data || []);

      const map = {};
      const remarksMap = {};
      (attendanceRes.data.data?.items || []).forEach((item) => {
        const sid = item.studentId?._id || item.studentId;
        if (sid) {
          map[sid] = { id: item._id, status: item.status, remarks: item.remarks || "" };
          remarksMap[sid] = item.remarks || "";
        }
      });
      setTodayRecords(map);
      setRemarksByStudent(remarksMap);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load students");
      setStudents([]);
      setTodayRecords({});
      setRemarksByStudent({});
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedClassId && classSectionOptions.length) {
      setSelectedClassId(classSectionOptions[0]._id);
    } else if (
      selectedClassId &&
      classSectionOptions.length &&
      !classSectionOptions.some((option) => option._id === selectedClassId)
    ) {
      setSelectedClassId(classSectionOptions[0]._id);
    }
  }, [classSectionOptions, selectedClassId]);

  useEffect(() => {
    if (selectedClass && fromDate && toDate) {
      loadSummary(selectedClass.className, selectedClass.section, fromDate, toDate);
    } else {
      setSummaryRows([]);
    }
  }, [selectedClassId, fromDate, toDate, selectedClass]);

  useEffect(() => {
    const loadStudentCalendar = async () => {
      if (!showStudentCalendar || !selectedStudent || !selectedClass) return;

      setStudentCalendarLoading(true);
      setStudentCalendarError("");

      try {
        const year = calendarMonth.getFullYear();
        const monthIndex = calendarMonth.getMonth();
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const requests = Array.from({ length: daysInMonth }, (_, index) => {
          const date = formatDateKey(new Date(year, monthIndex, index + 1));
          return api
            .get("/teacher-panel/attendance", {
              params: {
                className: selectedClass.className,
                section: selectedClass.section || "A",
                date,
                page: 1,
                limit: 200,
              },
            })
            .then(({ data }) => ({ date, items: data.data?.items || [] }))
            .catch(() => ({ date, items: [] }));
        });

        const results = await Promise.all(requests);
        const studentId = selectedStudent.studentId;
        const days = results.map(({ date, items }) => {
          const record = items.find((item) => {
            const sid = item.studentId?._id || item.studentId;
            return sid === studentId;
          });
          return { date, status: record?.status || "NO_RECORD" };
        });

        setStudentCalendarDays(days);
      } catch (err) {
        setStudentCalendarError(err.response?.data?.message || "Failed to load attendance calendar");
        setStudentCalendarDays([]);
      } finally {
        setStudentCalendarLoading(false);
      }
    };

    loadStudentCalendar();
  }, [showStudentCalendar, selectedStudent, selectedClass, calendarMonth]);

  const onClassChange = async (classId) => {
    setSelectedClassId(classId);
    if (!classId) {
      setShowModal(false);
      setStudents([]);
      return;
    }
    const cls = classSectionOptions.find((c) => c._id === classId);
    if (!cls) return;
    setShowModal(true);
    await loadModalData(cls.className, cls.section);
  };

  const openStudentCalendar = (row) => {
    if (!selectedClass) return;
    setSelectedStudent({
      studentId: row.studentId,
      name: row.name,
      rollNo: row.rollNo,
    });
    setCalendarMonth(new Date());
    setShowStudentCalendar(true);
  };

  const closeStudentCalendar = () => {
    setShowStudentCalendar(false);
    setSelectedStudent(null);
    setStudentCalendarDays([]);
    setStudentCalendarError("");
  };

  const markAttendance = async (studentId, status) => {
    if (!selectedClass) return;
    setMarkingId(studentId);
    setError("");
    const remarks = String(remarksByStudent[studentId] || "").trim();
    const payload = {
      studentId,
      className: selectedClass.className,
      section: selectedClass.section || "A",
      date: today(),
      status,
      remarks,
    };

    try {
      const existing = todayRecords[studentId];
      if (existing?.id) {
        await api.put(`/teacher-panel/attendance/${existing.id}`, { status, date: today(), remarks });
        setTodayRecords((prev) => ({
          ...prev,
          [studentId]: { ...existing, status, remarks },
        }));
      } else {
        const { data } = await api.post("/teacher-panel/attendance", payload);
        setTodayRecords((prev) => ({
          ...prev,
          [studentId]: { id: data.data._id, status, remarks },
        }));
      }
      if (fromDate && toDate) {
        await loadSummary(selectedClass.className, selectedClass.section, fromDate, toDate);
      }
      notifyAttendanceUpdated({
        studentId,
        className: selectedClass.className,
        section: selectedClass.section || "A",
        date: today(),
        status,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark attendance");
    } finally {
      setMarkingId("");
    }
  };

  const downloadCsv = (rows, filename) => {
    const header = [
      "Student Name",
      "Roll Number",
      "Class",
      "Section",
      "From Date",
      "To Date",
      "Present Days",
      "Absent Days",
      "Late Days",
      "Leave Days",
      "Remarks",
    ];
    const body = rows.map((row) =>
      [
        row.name,
        row.rollNo || row.admissionNo || "",
        row.className || selectedClass?.className || "",
        row.section || selectedClass?.section || "A",
        fromDate,
        toDate,
        row.present || 0,
        row.absent || 0,
        row.late || 0,
        row.leave || 0,
        row.remarks || "",
      ]
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(",")
    );
    const blob = new Blob([[header.join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = (rows, title) => {
    const printWindow = window.open("", "_blank", "width=900,height=1000");
    if (!printWindow) return;
    const tableRows = rows
      .map(
        (row) => `
      <tr>
        <td>${row.name || "-"}</td>
        <td>${row.rollNo || row.admissionNo || "-"}</td>
        <td>${row.className || selectedClass?.className || "-"}</td>
        <td>${row.section || selectedClass?.section || "A"}</td>
        <td>${row.present || 0}</td>
        <td>${row.absent || 0}</td>
        <td>${row.late || 0}</td>
        <td>${row.leave || 0}</td>
        <td>${row.remarks || "-"}</td>
      </tr>`
      )
      .join("");
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { margin: 0 0 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background: #eff6ff; }
          </style>
        </head>
        <body>
          <h1>Insaaf Grammar High School</h1>
          <h2>${title}</h2>
          <p>Class: ${selectedClass?.className || "-"} | Section: ${selectedClass?.section || "A"}</p>
          <p>Date Range: ${fromDate} to ${toDate}</p>
          <table>
            <thead>
              <tr>
                <th>Student Name</th><th>Roll No</th><th>Class</th><th>Section</th>
                <th>Present</th><th>Absent</th><th>Late</th><th>Leave</th><th>Remarks</th>
              </tr>
            </thead>
            <tbody>${tableRows || `<tr><td colspan="9">No records</td></tr>`}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const openClassReport = () => {
    if (!selectedClass || !summaryRows.length) {
      setError("Select a class with attendance records before generating a report.");
      return;
    }
    setReportTarget({ type: "class", rows: summaryRows });
    setShowReportFormat(true);
  };

  const openStudentReport = (row) => {
    setReportTarget({ type: "student", rows: [row] });
    setShowReportFormat(true);
  };

  const generateSelectedReport = (format) => {
    if (!reportTarget?.rows?.length) return;
    const filenameBase =
      reportTarget.type === "student"
        ? `student-attendance-${reportTarget.rows[0]?.rollNo || "student"}`
        : `class-attendance-${selectedClass?.className || "class"}-${selectedClass?.section || "A"}`;
    if (format === "CSV") downloadCsv(reportTarget.rows, `${filenameBase}.csv`);
    else downloadPdf(reportTarget.rows, reportTarget.type === "student" ? "Individual Student Attendance Report" : "Class Attendance Report");
    setShowReportFormat(false);
    setReportTarget(null);
  };

  const studentCalendarClassLabel = selectedClass ? `${selectedClass.className} - ${selectedClass.section || "A"}` : "";

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mark Attendance</h2>
          <p className="text-sm text-slate-500">Record and manage daily student attendance.</p>
        </div>

        <div className="ml-auto flex w-full flex-wrap items-end gap-3 sm:w-auto sm:flex-nowrap">
          <button type="button" className="ref-btn-primary whitespace-nowrap" onClick={openClassReport}>
            Generate Attendance Report
          </button>
          <div className="w-full sm:w-48">
            <ScrollableSelect
              label="Class"
              placeholder="Select class"
              value={selectedClassId}
              options={classSectionOptions.map((c) => ({
                value: c._id,
                label: `${c.className} - ${c.section}`,
              }))}
              onChange={onClassChange}
              dark={dark}
              portal
            />
          </div>
          <div className="w-full sm:w-44">
            <ModernDatePicker
              label="From Date"
              value={fromDate}
              onChange={setFromDate}
              dark={dark}
              max={toDate || undefined}
            />
          </div>
          <div className="w-full sm:w-44">
            <ModernDatePicker
              label="To Date"
              value={toDate}
              onChange={setToDate}
              dark={dark}
              min={fromDate || undefined}
            />
          </div>
        </div>
      </div>

      {!classOptions.length ? (
        <div className="ref-card p-5 text-sm text-slate-600">
          Please add a class in <strong>My Classes</strong> first, then mark attendance here.
        </div>
      ) : null}

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white p-0 shadow-[0_14px_34px_rgba(37,99,235,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Attendance Records ({summaryRows.length})</h3>
            <p className="text-xs font-medium text-slate-500">Click any student row to view their attendance calendar.</p>
          </div>
          {selectedClass ? (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
              {selectedClass.className} - {selectedClass.section || "A"}
            </span>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-blue-50 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-blue-700">
              <tr>
                <th className="px-4 py-3 font-bold">Profile</th>
                <th className="px-4 py-3 font-bold">Roll Number</th>
                <th className="px-4 py-3 font-bold">Student ID</th>
                <th className="px-4 py-3 font-bold">Name</th>
                <th className="px-4 py-3 font-bold">Class</th>
                <th className="px-4 py-3 font-bold">Total Attendance</th>
                <th className="px-4 py-3 font-bold">Report</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : !selectedClass || !fromDate || !toDate ? (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-slate-500">
                    Select class, from date and to date to view attendance summary.
                  </td>
                </tr>
              ) : summaryRows.length ? (
                summaryRows.map((row) => (
                  <tr
                    key={row.studentId}
                    onClick={() => openStudentCalendar(row)}
                    className="cursor-pointer border-t border-blue-50 transition hover:bg-blue-50/60"
                  >
                    <td className="px-4 py-4">
                      <AttendanceProfile row={row} onClick={() => openStudentCalendar(row)} />
                    </td>
                    <td className="px-4 py-4 font-mono text-sm font-medium text-slate-950">{row.rollNo || "-"}</td>
                    <td className="px-4 py-4 font-mono text-sm font-medium text-slate-950">{row.admissionNo || row.studentId}</td>
                    <td className="px-4 py-4 font-bold text-slate-950">{row.name || "-"}</td>
                    <td className="px-4 py-4 font-medium text-slate-950">
                      {row.className || selectedClass.className} - {row.section || selectedClass.section || "A"}
                    </td>
                    <td className="px-4 py-4">
                      <AttendanceTotal row={row} />
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        className="ref-btn-outline text-xs"
                        onClick={(event) => {
                          event.stopPropagation();
                          openStudentReport(row);
                        }}
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-slate-500">
                    No attendance records for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FormModal
        open={showModal && !!selectedClass}
        title="Mark Attendance"
        subtitle={selectedClass ? `${selectedClass.className} - ${selectedClass.section || "A"}` : ""}
        onClose={() => setShowModal(false)}
        wide
        extraWide
      >
        {modalLoading ? (
          <p className="text-sm text-slate-500">Loading students...</p>
        ) : students.length ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm">
              <div className="inline-flex items-center gap-2 whitespace-nowrap">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-blue-600">Class</span>
                <span className="font-semibold text-slate-900">{selectedClass.className}</span>
              </div>
              <div className="inline-flex items-center gap-2 whitespace-nowrap">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-blue-600">Section</span>
                <span className="font-semibold text-slate-900">{selectedClass.section || "A"}</span>
              </div>
              <div className="inline-flex items-center gap-2 whitespace-nowrap">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-blue-600">Date</span>
                <span className="font-semibold text-slate-900">{today()}</span>
              </div>
              <div className="inline-flex items-center gap-2 whitespace-nowrap">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-blue-600">Students</span>
                <span className="font-semibold text-slate-900">{students.length}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Roll No#</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Name</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Remarks</th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const currentStatus = todayRecords[student._id]?.status;
                    const isMarking = markingId === student._id;
                    return (
                      <tr key={student._id} className="border-t border-slate-100">
                        <td className="whitespace-nowrap px-3 py-3 text-slate-700">
                          {student.rollNumber || student.admissionNo || "-"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                          {student.firstName} {student.lastName}
                        </td>
                        <td className="px-3 py-3">
                          <input
                            className="ref-input min-w-[140px] max-w-[220px]"
                            placeholder="Remarks"
                            value={remarksByStudent[student._id] || ""}
                            onChange={(e) =>
                              setRemarksByStudent((current) => ({ ...current, [student._id]: e.target.value }))
                            }
                          />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-nowrap items-center gap-1.5">
                            {STATUS_BUTTONS.map((btn) => (
                              <button
                                key={btn.value}
                                type="button"
                                disabled={isMarking}
                                onClick={() => markAttendance(student._id, btn.value)}
                                className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                                  currentStatus === btn.value
                                    ? btn.active
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No students found in this class.</p>
        )}
      </FormModal>

      <FormModal
        open={showReportFormat}
        title="Download Format"
        onClose={() => {
          setShowReportFormat(false);
          setReportTarget(null);
        }}
      >
        <p className="mb-4 text-sm text-slate-600">Choose a format before downloading the attendance report.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button type="button" className="ref-btn-outline" onClick={() => generateSelectedReport("CSV")}>
            Download CSV
          </button>
          <button type="button" className="ref-btn-primary" onClick={() => generateSelectedReport("PDF")}>
            Download PDF
          </button>
        </div>
      </FormModal>

      <StudentAttendanceCalendarModal
        open={showStudentCalendar}
        dark={false}
        student={selectedStudent}
        classLabel={studentCalendarClassLabel}
        monthDate={calendarMonth}
        days={studentCalendarDays}
        loading={studentCalendarLoading}
        error={studentCalendarError}
        onClose={closeStudentCalendar}
        onPrevMonth={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
        onNextMonth={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
      />
    </section>
  );
}
