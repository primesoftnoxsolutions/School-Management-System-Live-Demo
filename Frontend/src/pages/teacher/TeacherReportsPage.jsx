import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import api from "../../services/api/client";
import ModernDatePicker from "../../components/ui/ModernDatePicker";
import ScrollableSelect from "../../components/ui/ScrollableSelect";
import { fetchTeacherSignature } from "../../utils/teacherSignature";

const today = () => new Date().toISOString().slice(0, 10);

const REPORT_TYPES = [
  { value: "STUDENT_ATTENDANCE", label: "Student Attendance Report" },
  { value: "CLASS_RESULT", label: "Teacher Class Wise Result Report" },
];

const DEFAULT_SUBJECTS = ["English", "Urdu", "Maths", "Physics", "Chemistry", "Biology", "Isl. Studies", "Pak. Studies", "Comp. Science"];

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const getStudentName = (student = {}) => student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim() || "-";
const getFatherName = (student = {}) => student.fatherName || student.guardianName || "";
const getStudentDisplayName = (student = {}) => {
  const name = getStudentName(student);
  const fatherName = getFatherName(student);
  return fatherName ? `${name} / ${fatherName}` : name;
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function ReportShell({ title, children, footer, onPrint }) {
  return (
    <div id="teacher-selected-report" className="overflow-hidden rounded-2xl border border-blue-900 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      <div className="bg-blue-950 px-5 py-4 text-center text-white">
        <div className="flex justify-end print:hidden">
          <button
            type="button"
            onClick={onPrint}
            className="rounded-lg bg-white px-4 py-2 text-xs font-black uppercase text-blue-950"
          >
            Print Report
          </button>
        </div>
        <p className="text-3xl font-black uppercase tracking-[0.12em]">Insaaf Grammar High School</p>
        <div className="mx-auto mt-2 max-w-2xl rounded-lg border border-white/70 px-4 py-1 text-lg font-extrabold uppercase tracking-[0.08em]">
          {title}
        </div>
      </div>
      <div className="p-5">{children}</div>
      {footer ? <div className="border-t border-blue-900 px-5 py-4">{footer}</div> : null}
    </div>
  );
}

function SummaryPill({ label, value, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <div className={`rounded-2xl px-4 py-3 ${tones[tone] || tones.blue}`}>
      <p className="text-xs font-bold uppercase tracking-[0.08em] opacity-75">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

export default function TeacherReportsPage({ dark = false }) {
  const user = useSelector((state) => state.auth.user);
  const [teacherName, setTeacherName] = useState("");
  const [classOptions, setClassOptions] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState([]);
  const [reportType, setReportType] = useState("STUDENT_ATTENDANCE");
  const [periodFrom, setPeriodFrom] = useState(today());
  const [periodTo, setPeriodTo] = useState(today());
  const [academicSession, setAcademicSession] = useState("2024-2025");
  const [examination, setExamination] = useState("Annual Examination");
  const [reportDate, setReportDate] = useState(today());
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [marksByStudent, setMarksByStudent] = useState({});
  const [studentAttendanceRows, setStudentAttendanceRows] = useState([]);
  const [teacherAttendance, setTeacherAttendance] = useState(null);
  const [teacherSignature, setTeacherSignature] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    () => classSectionOptions.find((option) => option._id === selectedClassId) || null,
    [classSectionOptions, selectedClassId]
  );

  const resultRows = useMemo(
    () =>
      students.map((student, index) => {
        const marks = marksByStudent[student._id] || {};
        const subjectMarks = subjects.map((subject) => toNumber(marks[subject]));
        const total = subjectMarks.reduce((sum, mark) => sum + mark, 0);
        const maxTotal = subjects.length * 100;
        const percentage = maxTotal ? (total / maxTotal) * 100 : 0;
        return {
          student,
          rollNo: student.rollNumber || student.admissionNo || index + 1,
          subjectMarks,
          total,
          percentage,
        };
      }),
    [marksByStudent, students, subjects]
  );

  const overallPercentage = useMemo(() => {
    if (!resultRows.length) return 0;
    const total = resultRows.reduce((sum, row) => sum + row.percentage, 0);
    return total / resultRows.length;
  }, [resultRows]);

  const loadStudents = async (classOption) => {
    if (!classOption) {
      setStudents([]);
      setMarksByStudent({});
      return;
    }

    const { data } = await api.get("/teacher-panel/students", {
      params: { className: classOption.className, section: classOption.section || "A" },
    });
    const nextStudents = data.data || [];
    setStudents(nextStudents);
    setMarksByStudent((current) => {
      const next = {};
      nextStudents.forEach((student) => {
        next[student._id] = current[student._id] || {};
      });
      return next;
    });
  };

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      setError("");
      try {
        const [panelRes, classRes] = await Promise.all([
          api.get("/teachers/my-panel"),
          api.get("/teacher-panel/class-options"),
        ]);

        setTeacherName(panelRes.data?.data?.teacher?.fullName || "");
        setTeacherSignature(panelRes.data?.data?.signatureDataUrl || "");
        fetchTeacherSignature(user).then((value) => {
          if (value) setTeacherSignature(value);
        });
        const classes = classRes.data?.data || [];
        setClassOptions(classes);
        if (classes.length) {
          setSelectedClassId(classes[0]._id);
          await loadStudents(classes[0]);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load report data");
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
  }, []);

  const onClassChange = async (classId) => {
    setSelectedClassId(classId);
    setStudentAttendanceRows([]);
    const classOption = classSectionOptions.find((option) => option._id === classId);
    try {
      setLoading(true);
      setError("");
      await loadStudents(classOption);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load students for this class");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const generateStudentAttendance = async ({ silent = false } = {}) => {
    if (!selectedClass || !periodFrom || !periodTo) {
      if (!silent) setError("Select class, from date and to date first.");
      return;
    }

    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const { data } = await api.get("/teacher-panel/attendance/summary", {
        params: {
          className: selectedClass.className,
          section: selectedClass.section || "A",
          fromDate: periodFrom,
          toDate: periodTo,
          _t: Date.now(),
        },
      });
      setStudentAttendanceRows(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      if (!silent) {
        setError(err.response?.data?.message || "Failed to generate student attendance report");
        setStudentAttendanceRows([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const generateTeacherAttendance = async () => {
    if (!periodFrom || !periodTo) {
      setError("Select from date and to date first.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/teacher-panel/my-attendance/summary", {
        params: { fromDate: periodFrom, toDate: periodTo },
      });
      setTeacherAttendance(data.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate teacher attendance report");
      setTeacherAttendance(null);
    } finally {
      setLoading(false);
    }
  };

  const generateClassResult = async () => {
    if (!selectedClass || !examination) {
      setError("Select class and examination first.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await loadStudents(selectedClass);
      const { data } = await api.get("/teacher-panel/academic-records", {
        params: {
          className: selectedClass.className,
          section: selectedClass.section || "A",
          examType: examination,
          page: 1,
          limit: 500,
        },
      });
      const records = data.data?.items || [];
      const subjectSet = new Set();
      const nextMarks = {};
      records.forEach((record) => {
        const studentId = record.studentId?._id || record.studentId;
        if (!studentId) return;
        if (!nextMarks[studentId]) nextMarks[studentId] = {};
        nextMarks[studentId][record.subject] = record.marks;
        subjectSet.add(record.subject);
      });
      const nextSubjects = subjectSet.size ? [...subjectSet] : DEFAULT_SUBJECTS;
      setSubjects(nextSubjects);
      setMarksByStudent(nextMarks);
      if (!records.length) {
        setError("No academic records found for this class and examination. Marks table will stay empty until records exist.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load class result records");
      setMarksByStudent({});
    } finally {
      setLoading(false);
    }
  };

  const generateReport = () => {
    if (reportType === "STUDENT_ATTENDANCE") {
      generateStudentAttendance();
      return;
    }
    if (reportType === "CLASS_RESULT") {
      generateClassResult();
    }
  };

  // Keep Student Attendance Report in sync with latest Mark Attendance data
  useEffect(() => {
    if (reportType !== "STUDENT_ATTENDANCE") return undefined;
    if (!selectedClass || !periodFrom || !periodTo) return undefined;

    let cancelled = false;
    const refresh = async ({ silent = false } = {}) => {
      if (cancelled) return;
      await generateStudentAttendance({ silent });
    };

    refresh({ silent: false });
    const poll = window.setInterval(() => refresh({ silent: true }), 5000);
    const onFocus = () => refresh({ silent: true });
    const onVisibility = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, selectedClassId, periodFrom, periodTo, selectedClass?.className, selectedClass?.section]);

  const updateMark = (studentId, subject, value) => {
    const clamped = Math.max(0, Math.min(100, toNumber(value)));
    setMarksByStudent((current) => ({
      ...current,
      [studentId]: {
        ...(current[studentId] || {}),
        [subject]: value === "" ? "" : clamped,
      },
    }));
  };

  const printReport = () => {
    const report = document.getElementById("teacher-selected-report");
    if (!report) return;
    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>${REPORT_TYPES.find((type) => type.value === reportType)?.label || "Report"}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page { size: A4 portrait; margin: 8mm; }
            body { margin: 0; padding: 0; background: #ffffff; }
            #teacher-selected-report {
              width: 190mm !important;
              max-width: 190mm !important;
              margin: 0 auto !important;
              box-shadow: none !important;
              border-radius: 8px !important;
            }
            #teacher-selected-report * {
              box-sizing: border-box;
              letter-spacing: 0 !important;
            }
            #teacher-selected-report table {
              width: 100% !important;
              min-width: 0 !important;
              font-size: 9.5px !important;
              table-layout: fixed !important;
            }
            #teacher-selected-report th,
            #teacher-selected-report td {
              padding: 4px 5px !important;
              overflow-wrap: anywhere;
            }
            #teacher-selected-report input {
              height: 22px !important;
              font-size: 9.5px !important;
            }
            #teacher-selected-report .print\\:hidden { display: none !important; }
          </style>
        </head>
        <body class="bg-white">${report.outerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const selectedClassLabel = selectedClass ? `${selectedClass.className} - ${selectedClass.section || "A"}` : "-";
  const selectedSubject = selectedClass?.subject || "-";

  const renderStudentAttendanceReport = () => {
    const totals = studentAttendanceRows.reduce(
      (acc, row) => {
        acc.present += Number(row.present || 0);
        acc.absent += Number(row.absent || 0);
        acc.late += Number(row.late || 0);
        acc.leave += Number(row.leave || 0);
        return acc;
      },
      { present: 0, absent: 0, late: 0, leave: 0 }
    );

    return (
      <ReportShell title="Student Attendance Report" onPrint={printReport}>
        <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold text-slate-900">
          <p className="whitespace-nowrap">
            Teacher Name: <span className="text-blue-800">{teacherName || "-"}</span>
          </p>
          <p className="whitespace-nowrap">
            Class: <span className="text-blue-800">{selectedClassLabel}</span>
          </p>
          <p className="whitespace-nowrap">
            Subject Taught: <span className="text-blue-800">{selectedSubject}</span>
          </p>
          <p className="whitespace-nowrap">
            Range:{" "}
            <span className="text-blue-800">
              {formatDate(periodFrom)} - {formatDate(periodTo)}
            </span>
          </p>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-4">
          <SummaryPill label="Present" value={totals.present} tone="green" />
          <SummaryPill label="Absent" value={totals.absent} tone="rose" />
          <SummaryPill label="Late" value={totals.late} tone="amber" />
          <SummaryPill label="Leave" value={totals.leave} tone="violet" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead className="bg-blue-950 text-white">
              <tr>
                <th className="border border-blue-800 px-3 py-2 text-left">Roll No#</th>
                <th className="border border-blue-800 px-3 py-2 text-left">Date</th>
                <th className="border border-blue-800 px-3 py-2 text-left">Student Name</th>
                <th className="border border-blue-800 px-3 py-2">Present</th>
                <th className="border border-blue-800 px-3 py-2">Absent</th>
                <th className="border border-blue-800 px-3 py-2">Late</th>
                <th className="border border-blue-800 px-3 py-2">Leave</th>
              </tr>
            </thead>
            <tbody>
              {studentAttendanceRows.length ? (
                studentAttendanceRows.map((row) => (
                  <tr key={row.studentId}>
                    <td className="border border-blue-200 px-3 py-2 font-bold">{row.rollNo || "-"}</td>
                    <td className="border border-blue-200 px-3 py-2 font-bold">{formatDate(periodFrom)} - {formatDate(periodTo)}</td>
                    <td className="border border-blue-200 px-3 py-2 font-bold">{getStudentDisplayName(row)}</td>
                    <td className="border border-blue-200 px-3 py-2 text-center">{row.present}</td>
                    <td className="border border-blue-200 px-3 py-2 text-center">{row.absent}</td>
                    <td className="border border-blue-200 px-3 py-2 text-center">{row.late}</td>
                    <td className="border border-blue-200 px-3 py-2 text-center">{row.leave}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="border border-blue-200 px-3 py-8 text-center text-slate-500">
                    Generate the report to load attendance rows.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ReportShell>
    );
  };

  const renderTeacherAttendanceReport = () => {
    const totals = teacherAttendance?.totals || { present: 0, absent: 0, late: 0, leave: 0, marked: 0 };

    return (
      <ReportShell title="Teacher Attendance Report" onPrint={printReport}>
        <div className="mb-5 grid gap-3 text-sm font-bold text-slate-900 md:grid-cols-2">
          <p>Teacher Name: <span className="text-blue-800">{teacherName || "-"}</span></p>
          <p>Range: <span className="text-blue-800">{formatDate(periodFrom)} - {formatDate(periodTo)}</span></p>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-5">
          <SummaryPill label="Marked" value={totals.marked} />
          <SummaryPill label="Present" value={totals.present} tone="green" />
          <SummaryPill label="Absent" value={totals.absent} tone="rose" />
          <SummaryPill label="Late" value={totals.late} tone="amber" />
          <SummaryPill label="Leave" value={totals.leave} tone="violet" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead className="bg-blue-950 text-white">
              <tr>
                <th className="border border-blue-800 px-3 py-2 text-left">Date</th>
                <th className="border border-blue-800 px-3 py-2 text-left">Status</th>
                <th className="border border-blue-800 px-3 py-2 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {teacherAttendance?.items?.length ? (
                teacherAttendance.items.map((item) => (
                  <tr key={`${item.date}-${item.status}`}>
                    <td className="border border-blue-200 px-3 py-2 font-bold">{formatDate(item.date)}</td>
                    <td className="border border-blue-200 px-3 py-2">{item.status}</td>
                    <td className="border border-blue-200 px-3 py-2">{item.remarks || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="border border-blue-200 px-3 py-8 text-center text-slate-500">
                    Generate the report to load teacher attendance.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ReportShell>
    );
  };

  const renderClassResultReport = () => (
    <ReportShell
      title="Teacher Class Wise Result Report"
      onPrint={printReport}
      footer={
        <div className="grid grid-cols-2 gap-8 text-center text-sm font-black uppercase text-blue-950">
          <div>
            {teacherSignature ? (
              <img src={teacherSignature} alt="Teacher signature" className="mx-auto mb-2 h-12 max-w-[180px] object-contain" />
            ) : (
              <div className="mx-auto mb-2 h-px w-64 bg-blue-950" />
            )}
            Signature of Teacher
          </div>
          <div>
            <div className="mx-auto mb-2 h-px w-64 bg-blue-950" />
            Signature of Principal
          </div>
        </div>
      }
    >
      <div className="mb-4 grid gap-x-10 gap-y-2 text-base font-black text-slate-950 md:grid-cols-2">
        <div className="grid grid-cols-[150px_16px_minmax(0,1fr)] border-b border-blue-900 pb-1">
          <span className="uppercase text-blue-950">Teacher Name</span><span>:</span><span>{teacherName || "-"}</span>
        </div>
        <div className="grid grid-cols-[170px_16px_minmax(0,1fr)] border-b border-blue-900 pb-1">
          <span className="uppercase text-blue-950">Academic Session</span><span>:</span><span>{academicSession || "-"}</span>
        </div>
        <div className="grid grid-cols-[150px_16px_minmax(0,1fr)] border-b border-blue-900 pb-1">
          <span className="uppercase text-blue-950">Class</span><span>:</span><span>{selectedClassLabel}</span>
        </div>
        <div className="grid grid-cols-[170px_16px_minmax(0,1fr)] border-b border-blue-900 pb-1">
          <span className="uppercase text-blue-950">Examination</span><span>:</span><span>{examination || "-"}</span>
        </div>
        <div className="grid grid-cols-[150px_16px_minmax(0,1fr)] border-b border-blue-900 pb-1">
          <span className="uppercase text-blue-950">Subject Taught</span><span>:</span><span>{selectedSubject}</span>
        </div>
        <div className="grid grid-cols-[170px_16px_minmax(0,1fr)] border-b border-blue-900 pb-1">
          <span className="uppercase text-blue-950">Date</span><span>:</span><span>{formatDate(reportDate)}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse text-sm">
          <thead className="bg-blue-950 text-white">
            <tr>
              <th rowSpan={2} className="border border-blue-800 px-2 py-2">Roll No.</th>
              <th rowSpan={2} className="border border-blue-800 px-3 py-2 text-left">Student Name</th>
              <th colSpan={subjects.length} className="border border-blue-800 px-3 py-2">Subjects Marks (Out of 100)</th>
              <th rowSpan={2} className="border border-blue-800 px-2 py-2">Total Marks<br />(Out of {subjects.length * 100})</th>
              <th rowSpan={2} className="border border-blue-800 px-2 py-2">Percentage<br />(%)</th>
            </tr>
            <tr>
              {subjects.map((subject) => (
                <th key={subject} className="border border-blue-800 px-2 py-2 text-[11px] uppercase">
                  {subject}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resultRows.length ? (
              resultRows.map((row) => (
                <tr key={row.student._id}>
                  <td className="border border-blue-200 px-2 py-2 text-center font-black">{row.rollNo}</td>
                  <td className="border border-blue-200 px-3 py-2 font-black">{getStudentDisplayName(row.student)}</td>
                  {subjects.map((subject) => (
                    <td key={subject} className="border border-blue-200 p-0 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="h-9 w-full bg-transparent text-center text-sm font-bold text-slate-900 outline-none focus:bg-blue-50"
                        value={marksByStudent[row.student._id]?.[subject] ?? ""}
                        onChange={(event) => updateMark(row.student._id, subject, event.target.value)}
                        aria-label={`${getStudentName(row.student)} ${subject} marks`}
                      />
                    </td>
                  ))}
                  <td className="border border-blue-200 px-2 py-2 text-center text-base font-black">{row.total}</td>
                  <td className="border border-blue-200 px-2 py-2 text-center text-base font-black">{row.percentage.toFixed(2)}%</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={subjects.length + 4} className="border border-blue-200 px-3 py-8 text-center text-slate-500">
                  Select an assigned class to auto-fetch students.
                </td>
              </tr>
            )}
            <tr className="bg-blue-950 text-white">
              <td colSpan={subjects.length + 3} className="border border-blue-800 px-4 py-3 text-lg font-black uppercase">
                Class Overall Percentage
              </td>
              <td className="border border-blue-800 px-4 py-3 text-center text-lg font-black">{overallPercentage.toFixed(2)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </ReportShell>
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950">Reports</h2>
          <p className="text-sm text-slate-500">Generate attendance and class-wise result reports from your teacher panel.</p>
        </div>
      </div>

      {error ? <p className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}

      <div className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] lg:items-end">
          <ScrollableSelect
            label="Report Type"
            placeholder="Select report type"
            value={reportType}
            options={REPORT_TYPES}
            onChange={setReportType}
            dark={dark}
            portal
          />

          <ScrollableSelect
            label="Class"
            placeholder="Select class"
            value={selectedClassId}
            options={classSectionOptions.map((option) => ({
              value: option._id,
              label: `${option.className} - ${option.section || "A"}`,
            }))}
            onChange={onClassChange}
            dark={dark}
            portal
          />

          <ModernDatePicker
            label="From Date"
            value={periodFrom}
            onChange={setPeriodFrom}
            dark={dark}
            max={periodTo || undefined}
          />

          <ModernDatePicker
            label="To Date"
            value={periodTo}
            onChange={setPeriodTo}
            dark={dark}
            min={periodFrom || undefined}
          />

          <button
            type="button"
            onClick={generateReport}
            disabled={loading}
            className="h-12 rounded-xl bg-violet-600 px-6 text-sm font-black text-white shadow-[0_14px_28px_rgba(124,77,255,0.22)] transition hover:bg-violet-700 disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>

        {reportType === "CLASS_RESULT" ? (
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Field label="Academic Session">
              <input
                className="h-12 w-full rounded-xl border border-blue-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={academicSession}
                onChange={(event) => setAcademicSession(event.target.value)}
              />
            </Field>
            <Field label="Examination">
              <input
                className="h-12 w-full rounded-xl border border-blue-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={examination}
                onChange={(event) => setExamination(event.target.value)}
              />
            </Field>
            <ModernDatePicker
              label="Report Date"
              value={reportDate}
              onChange={setReportDate}
              dark={dark}
            />
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
        {reportType === "STUDENT_ATTENDANCE" ? renderStudentAttendanceReport() : null}
        {reportType === "CLASS_RESULT" ? renderClassResultReport() : null}
      </div>
    </section>
  );
}
