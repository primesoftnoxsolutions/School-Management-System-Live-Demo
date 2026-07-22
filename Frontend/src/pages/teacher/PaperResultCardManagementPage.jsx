import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import api from "../../services/api/client";
import ModernDatePicker from "../../components/ui/ModernDatePicker";
import ModernDateTimePicker from "../../components/ui/ModernDateTimePicker";
import ScrollableSelect from "../../components/ui/ScrollableSelect";
import { fetchTeacherSignature } from "../../utils/teacherSignature";
import { notifyAcademicDocumentsUpdated } from "../../utils/academicDocumentsSync";

const TERMS = ["Test Paper", "1st Term", "2nd Term", "3rd Term", "Final"];
const EXAM_TERMS = ["1st Term", "2nd Term", "3rd Term", "Final"];
const SUBJECTS = ["English", "Urdu", "Mathematics", "Physics", "Chemistry", "Biology", "Islamic Studies", "Pakistan Studies", "Computer Science"];

const todayInput = () => new Date().toISOString().slice(0, 10);

const addDays = (dateValue, days) => {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const formatDate = (value) =>
  value
    ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "-";

const getStudentName = (student = {}) => student?.name || `${student?.firstName || ""} ${student?.lastName || ""}`.trim() || "-";
const getFatherName = (student = {}) => student?.fatherName || student?.guardianName || "";
const getStudentDisplayName = (student = {}) => {
  const name = getStudentName(student);
  const fatherName = getFatherName(student);
  return fatherName ? `${name} / ${fatherName}` : name;
};

const gradeFromPercentage = (percentage) => {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
};

const getCountdown = (value) => {
  if (!value) return "";
  const diff = new Date(value).getTime() - Date.now();
  if (diff <= 0) return "Ready to release";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${days} days ${hours} hours ${minutes} minutes`;
};

const createMcq = () => ({ id: crypto.randomUUID(), question: "", options: ["", "", "", ""] });

const createSubjective = () => ({ id: crypto.randomUUID(), heading: "Short Questions", total: "9", attempt: "6", questions: [""] });

const cleanMcq = (mcq) => ({
  ...mcq,
  question: mcq.question.trim(),
  options: mcq.options.map((option) => option.trim()),
});

function IconPrinter({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 9V3h12v6" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v7H6z" />
      <path d="M18 12h.01" />
    </svg>
  );
}

function IconEye({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-xs font-black uppercase text-blue-800">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function SchoolBadge() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-blue-800">
      <svg viewBox="0 0 64 64" className="h-10 w-10" fill="none" aria-hidden="true">
        <path d="M32 5 52 12v17c0 13-8.4 23.2-20 29C20.4 52.2 12 42 12 29V12l20-7Z" fill="#ffffff" stroke="#002f9f" strokeWidth="2.4" />
        <path d="M32 12 46 17v12c0 8.6-5.8 16.2-14 21-8.2-4.8-14-12.4-14-21V17l14-5Z" fill="#eff6ff" stroke="#002f9f" strokeWidth="1.8" />
        <path d="M24 27c0-2.2 1.8-4 4-4h8c2.2 0 4 1.8 4 4v12H24V27Z" fill="#002f9f" />
        <path d="M28 29h8M28 34h8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="grid grid-cols-[9.5rem_1rem_minmax(0,1fr)] items-center gap-2 border-b border-blue-800 pb-1 text-sm font-black text-slate-950">
      <span className="uppercase text-blue-950">{label}</span>
      <span>:</span>
      <span>{value || "-"}</span>
    </div>
  );
}

function DateSheetPreview({ selectedClass, examTerm, rows, releaseAt, onRowChange }) {
  return (
    <div className="date-sheet-print-card overflow-hidden rounded-lg border-2 border-blue-900 bg-white p-3 text-blue-950 shadow-[0_10px_28px_rgba(37,99,235,0.12)]">
      <div className="grid grid-cols-[3.5rem_1fr_3.5rem] items-start gap-2">
        <SchoolBadge />
        <div className="text-center">
          <h3 className="text-2xl font-black uppercase leading-none text-blue-950 sm:text-3xl">Date Sheet</h3>
          <div className="mx-auto mt-1.5 max-w-xs rounded bg-blue-800 px-4 py-0.5 text-sm font-black uppercase text-white">
            Class: {selectedClass ? `${selectedClass.className} ${selectedClass.section || "A"}` : "-"}
          </div>
        </div>
        <SchoolBadge />
      </div>

      <div className="mt-2 grid overflow-hidden rounded-md border border-blue-300 md:grid-cols-2">
        <div className="border-b border-blue-300 px-3 py-1.5 text-xs font-black uppercase md:border-b-0 md:border-r">
          Examination: {examTerm}
        </div>
        <div className="px-3 py-1.5 text-xs font-black uppercase">
          Exam Time: {rows[0]?.time || "-"}
        </div>
      </div>

      <table className="mt-2 w-full border-collapse text-center text-xs">
        <thead className="bg-blue-900 text-white">
          <tr>
            <th className="w-16 border border-blue-400 px-2 py-1.5">Sr. No.</th>
            <th className="border border-blue-400 px-2 py-1.5">Subject</th>
            <th className="border border-blue-400 px-2 py-1.5">Day</th>
            <th className="border border-blue-400 px-2 py-1.5">Date</th>
            <th className="border border-blue-400 px-2 py-1.5">Time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.subject}>
              <td className="border border-blue-300 px-2 py-1 text-sm font-black text-blue-800">{index + 1}.</td>
              <td className="border border-blue-300 px-2 py-1 font-black uppercase">{row.subject}</td>
              <td className="border border-blue-300 px-2 py-1 font-black text-blue-900">{formatDate(row.date).split(",")[0].toUpperCase()}</td>
              <td className="border border-blue-300 p-0.5">
                <ModernDatePicker
                  value={row.date}
                  onChange={(value) => onRowChange(index, { date: value })}
                  dark={false}
                />
              </td>
              <td className="border border-blue-300 p-0">
                <input
                  className="h-9 w-full bg-transparent px-2 text-center text-xs font-bold text-blue-900 outline-none focus:bg-blue-50"
                  value={row.time}
                  onChange={(event) => onRowChange(index, { time: event.target.value })}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-2 grid gap-3 md:grid-cols-[1fr_12rem]">
        <div className="rounded-md border border-blue-300 p-2 text-[11px] font-bold text-blue-900">
          <span className="rounded bg-blue-800 px-2 py-0.5 text-[10px] font-black uppercase text-white">Important Instructions:</span>
          <ul className="mt-1.5 list-disc pl-4">
            <li>Students must reach the exam center at least 30 minutes before exam time.</li>
            <li>Mobile phones and smart watches are not allowed in the examination hall.</li>
            <li>Use of unfair means will result in disqualification.</li>
          </ul>
          <p className="mt-1.5">Portal release: {releaseAt ? new Date(releaseAt).toLocaleString() : "Not scheduled"}</p>
        </div>
        <div className="flex flex-col justify-end text-center text-xs font-black uppercase">
          <span className="border-b border-blue-900 pb-4">&nbsp;</span>
          Principal Signature
        </div>
      </div>
    </div>
  );
}

function ResultCardPreview({ selectedClass, student, term, marks, releaseAt, onMarkChange, editable = true, teacherSignature = "" }) {
  const rows = SUBJECTS.map((subject) => {
    const obtained = Number(marks[subject] || 0);
    const percentage = obtained;
    return { subject, total: 100, obtained, percentage, grade: gradeFromPercentage(percentage) };
  });
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const obtained = rows.reduce((sum, row) => sum + row.obtained, 0);
  const percentage = total ? (obtained / total) * 100 : 0;
  const grade = gradeFromPercentage(percentage);

  return (
    <div className="result-card-print overflow-hidden rounded-xl border-4 border-blue-900 bg-white p-5 text-blue-950 shadow-[0_18px_44px_rgba(37,99,235,0.14)]">
      <div className="grid grid-cols-[7rem_1fr_7rem] items-start">
        <SchoolBadge />
        <div className="text-center">
          <h3 className="text-5xl font-black uppercase leading-none text-blue-950">Insaaf Grammer High School</h3>
          <div className="mx-auto mt-1 max-w-xs rounded bg-blue-900 px-8 py-1 text-2xl font-black uppercase text-white">Result Card</div>
          <p className="mt-1 text-sm font-black uppercase text-blue-900">Academic Session: 2024-2025</p>
          <p className="mx-auto mt-1 max-w-xs rounded bg-blue-900 px-4 py-0.5 text-sm font-black uppercase text-white">{term}</p>
        </div>
        <SchoolBadge />
      </div>

      <div className="mt-4 grid gap-x-12 gap-y-2 rounded-md border border-blue-800 p-3 md:grid-cols-2">
        <InfoLine label="Student Name" value={getStudentName(student)} />
        <InfoLine label="Roll No." value={student?.rollNo || student?.rollNumber || student?.admissionNo} />
        <InfoLine label="Father Name" value={getFatherName(student)} />
        <InfoLine label="Registration ID" value={student?.admissionNo || student?._id} />
        <InfoLine label="Class" value={selectedClass ? `${selectedClass.className} ${selectedClass.section || "A"}` : ""} />
        <InfoLine label="Date of Result" value={formatDate(todayInput())} />
      </div>

      <table className="mt-3 w-full border-collapse text-center text-sm">
        <thead className="bg-blue-900 text-white">
          <tr>
            <th className="border border-blue-400 px-3 py-2">Sr. No.</th>
            <th className="border border-blue-400 px-3 py-2">Subjects</th>
            <th className="border border-blue-400 px-3 py-2">Total Marks</th>
            <th className="border border-blue-400 px-3 py-2">Marks Obtained</th>
            <th className="border border-blue-400 px-3 py-2">Percentage (%)</th>
            <th className="border border-blue-400 px-3 py-2">Grade</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.subject}>
              <td className="border border-blue-300 px-3 py-2">{index + 1}</td>
              <td className="border border-blue-300 px-3 py-2 font-black uppercase">{row.subject}</td>
              <td className="border border-blue-300 px-3 py-2">{row.total}</td>
              <td className="border border-blue-300 p-0">
                {editable ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="h-10 w-full bg-transparent text-center font-bold text-blue-950 outline-none focus:bg-blue-50"
                    value={marks[row.subject] ?? ""}
                    onChange={(event) => onMarkChange(row.subject, event.target.value)}
                  />
                ) : (
                  <span className="block px-3 py-2 font-bold">{row.obtained}</span>
                )}
              </td>
              <td className="border border-blue-300 px-3 py-2">{row.percentage.toFixed(2)}%</td>
              <td className="border border-blue-300 px-3 py-2">{row.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 overflow-hidden rounded-md border border-blue-400 text-sm">
        <div className="bg-blue-900 px-4 py-2 text-center font-black uppercase text-white">Result Summary</div>
        <div className="grid gap-x-8 gap-y-2 p-4 md:grid-cols-2">
          <InfoLine label="Total Marks" value={total} />
          <InfoLine label="Marks Obtained" value={obtained} />
          <InfoLine label="Overall Percentage" value={`${percentage.toFixed(2)}%`} />
          <InfoLine label="Overall Grade" value={grade} />
          <InfoLine label="Result" value={grade === "F" ? "Fail" : "Pass"} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-10 text-center text-xs font-black uppercase text-blue-900">
        <div><div className="mx-auto mb-2 h-px w-48 bg-blue-900" />Principal</div>
        <div>
          {teacherSignature ? (
            <img src={teacherSignature} alt="Teacher signature" className="mx-auto mb-2 h-10 max-w-[160px] object-contain" />
          ) : (
            <div className="mx-auto mb-2 h-px w-48 bg-blue-900" />
          )}
          Class Teacher Signature
        </div>
      </div>
      <p className="mt-3 text-center text-xs font-bold text-slate-500">
        Portal release: {releaseAt ? new Date(releaseAt).toLocaleString() : "Not scheduled"}
      </p>
    </div>
  );
}

function PaperPreview({ paper }) {
  return (
    <div className="paper-preview-print overflow-hidden rounded-xl border-4 border-blue-900 bg-white p-5 text-blue-950 shadow-[0_18px_44px_rgba(37,99,235,0.14)]">
      <div className="grid grid-cols-[5rem_1fr_5rem] items-start gap-3">
        <SchoolBadge />
        <div className="text-center">
          <h3 className="text-3xl font-black uppercase leading-none text-blue-950">Insaaf Grammer High School</h3>
          <p className="mt-2 text-sm font-black uppercase tracking-[0.14em] text-blue-800">{paper.term}</p>
          <div className="mx-auto mt-2 w-fit rounded bg-blue-900 px-6 py-1 text-lg font-black uppercase text-white">{paper.book}</div>
        </div>
        <SchoolBadge />
      </div>

      <div className="mt-4 grid gap-2 rounded-md border border-blue-800 p-3 text-sm font-black md:grid-cols-2">
        <InfoLine label="Class" value={paper.classLabel} />
        <InfoLine label="Date" value={formatDate(paper.paperDate)} />
        <InfoLine label="Time" value={paper.paperTime} />
        <InfoLine label="Total Marks" value={paper.totalMarks} />
      </div>

      <div className="mt-4">
        <h4 className="rounded bg-blue-900 px-3 py-2 text-sm font-black uppercase text-white">MCQs Part</h4>
        <div className="mt-3 space-y-3 text-sm">
          {paper.mcqs.length ? paper.mcqs.map((mcq, index) => (
            <div key={mcq.id} className="rounded-lg border border-blue-100 p-3">
              <p className="font-black text-slate-950">{index + 1}. {mcq.question}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {mcq.options.map((option, optionIndex) => (
                  <span key={optionIndex} className="rounded border border-blue-100 px-3 py-2 font-semibold text-slate-700">
                    {String.fromCharCode(65 + optionIndex)}. {option || "-"}
                  </span>
                ))}
              </div>
            </div>
          )) : <p className="rounded-lg border border-blue-100 p-3 text-sm font-semibold text-slate-500">No MCQs added.</p>}
        </div>
      </div>

      <div className="mt-4">
        <h4 className="rounded bg-blue-900 px-3 py-2 text-sm font-black uppercase text-white">Subjective Part</h4>
        <div className="mt-3 space-y-3 text-sm">
          {paper.subjective.map((section) => (
            <div key={section.id} className="rounded-lg border border-blue-100 p-3">
              <p className="font-black uppercase text-blue-900">{section.heading}: write any {section.attempt} out of {section.total}</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 font-semibold text-slate-800">
                {section.questions.filter(Boolean).map((question) => <li key={question}>{question}</li>)}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PaperResultCardManagementPage({ dark = false, navigationIntent = null }) {
  const user = useSelector((state) => state.auth.user);
  const [teacherSignature, setTeacherSignature] = useState("");
  const [mode, setMode] = useState("PAPER");
  const [showPaperForm, setShowPaperForm] = useState(false);
  const [showDateSheetForm, setShowDateSheetForm] = useState(false);
  const [showResultForm, setShowResultForm] = useState(false);
  const [classOptions, setClassOptions] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState([]);
  const [paperTerm, setPaperTerm] = useState("Test Paper");
  const [paperBook, setPaperBook] = useState(SUBJECTS[0]);
  const [mcqDraft, setMcqDraft] = useState(() => createMcq());
  const [editingMcqId, setEditingMcqId] = useState("");
  const [mcqRows, setMcqRows] = useState([]);
  const [subjectiveRows, setSubjectiveRows] = useState(() => [createSubjective()]);
  const [paperHistory, setPaperHistory] = useState([]);
  const [paperDate, setPaperDate] = useState(todayInput());
  const [paperExamTime, setPaperExamTime] = useState("08:30 AM - 11:30 AM");
  const [paperTotalMarks, setPaperTotalMarks] = useState("100");
  const [dateSheetTerm, setDateSheetTerm] = useState("1st Term");
  const [examStartDate, setExamStartDate] = useState(todayInput());
  const [gapDays, setGapDays] = useState(1);
  const [paperTime, setPaperTime] = useState("08:30 AM - 11:30 AM");
  const [reportingTime, setReportingTime] = useState("08:00 AM");
  const [dateSheetReleaseAt, setDateSheetReleaseAt] = useState("");
  const [dateSheetRows, setDateSheetRows] = useState([]);
  const [dateSheetNotice, setDateSheetNotice] = useState("");
  const [dateSheetSaved, setDateSheetSaved] = useState(false);
  const [savedDateSheets, setSavedDateSheets] = useState([]);
  const [resultTerm, setResultTerm] = useState("1st Term");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [resultSearch, setResultSearch] = useState("");
  const [resultMarks, setResultMarks] = useState({});
  const [resultReleaseAt, setResultReleaseAt] = useState("");
  const [resultNotice, setResultNotice] = useState("");
  const [savedResults, setSavedResults] = useState([]);
  const [printResult, setPrintResult] = useState(null);
  const [previewPaper, setPreviewPaper] = useState(null);
  const [printPapers, setPrintPapers] = useState([]);

  useEffect(() => {
    if (!navigationIntent?.mode) return;

    setMode(navigationIntent.mode);
    if (navigationIntent.openForm) {
      setShowPaperForm(navigationIntent.mode === "PAPER");
      setShowDateSheetForm(navigationIntent.mode === "DATE_SHEET");
      setShowResultForm(navigationIntent.mode === "RESULT");
    }
  }, [navigationIntent]);

  useEffect(() => {
    fetchTeacherSignature(user).then(setTeacherSignature);
  }, [user]);

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

  const selectedStudent = useMemo(
    () => students.find((student) => (student._id || student.studentId) === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const { data } = await api.get("/teacher-panel/class-options");
        const classes = data.data || [];
        setClassOptions(classes);
        if (classes.length) setSelectedClassId(classes[0]._id);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load classes");
      }
    };

    loadClasses();
  }, []);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClass) {
        setStudents([]);
        return;
      }
      try {
        const { data } = await api.get("/teacher-panel/students", {
          params: { className: selectedClass.className, section: selectedClass.section || "A" },
        });
        const nextStudents = data.data || [];
        setStudents(nextStudents);
        setSelectedStudentId(nextStudents[0]?._id || "");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load students");
        setStudents([]);
      }
    };

    loadStudents();
  }, [selectedClass]);

  useEffect(() => {
    setDateSheetRows(
      SUBJECTS.map((subject, index) => ({
        subject,
        date: addDays(examStartDate, index * (Number(gapDays) + 1)),
        time: paperTime,
      }))
    );
  }, [examStartDate, gapDays, paperTime]);

  const savePaper = () => {
    setPaperHistory((current) => [
      {
        id: crypto.randomUUID(),
        term: paperTerm,
        classLabel: selectedClass ? `${selectedClass.className} - ${selectedClass.section || "A"}` : "-",
        book: paperBook,
        paperDate,
        paperTime: paperExamTime,
        totalMarks: paperTotalMarks,
        mcqs: mcqRows.map(cleanMcq),
        subjective: subjectiveRows.map((section) => ({
          ...section,
          heading: section.heading.trim(),
          questions: section.questions.map((question) => question.trim()).filter(Boolean),
        })),
        createdAt: new Date().toLocaleString(),
      },
      ...current,
    ]);
    setMcqRows([]);
    setMcqDraft(createMcq());
    setEditingMcqId("");
    setSubjectiveRows([createSubjective()]);
    setShowPaperForm(false);
  };

  const printPaper = (paper) => {
    setPrintResult(null);
    setPrintPapers([paper]);
    window.setTimeout(() => window.print(), 50);
  };

  const printAllPapers = () => {
    if (!paperHistory.length) return;
    setPrintResult(null);
    setPrintPapers(paperHistory);
    window.setTimeout(() => window.print(), 50);
  };

  const saveDateSheet = () => {
    const item = {
      id: `${dateSheetTerm}-${selectedClassId}`,
      term: dateSheetTerm,
      className: selectedClass?.className || "",
      section: selectedClass?.section || "A",
      classLabel: selectedClass ? `${selectedClass.className} - ${selectedClass.section || "A"}` : "-",
      rows: dateSheetRows,
      examStartDate,
      gapDays,
      paperTime,
      reportingTime,
      releaseAt: dateSheetReleaseAt,
      savedAt: new Date().toLocaleString(),
    };
    setSavedDateSheets((current) => [item, ...current.filter((row) => row.id !== item.id)]);
    setDateSheetSaved(true);
    setDateSheetNotice("");
    setShowDateSheetForm(false);
  };

  const releaseDateSheet = async (sheet) => {
    if (!sheet?.className) {
      setError("Class is required before releasing the date sheet.");
      return;
    }
    try {
      await api.post("/academic-documents/release/date-sheets", {
        className: sheet.className,
        section: sheet.section || "A",
        term: sheet.term,
        rows: sheet.rows,
        releaseAt: sheet.releaseAt || null,
        studentIds: students.map((student) => student._id).filter(Boolean),
        examStartDate: sheet.examStartDate,
        paperTime: sheet.paperTime,
        reportingTime: sheet.reportingTime,
      });
      notifyAcademicDocumentsUpdated({
        documentType: "DATE_SHEET",
        className: sheet.className,
        section: sheet.section || "A",
        term: sheet.term,
      });
      setDateSheetNotice(`Date sheet (${sheet.term}) released to Super Admin.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to release date sheet");
    }
  };

  const updateMcqDraft = (patch) => {
    setMcqDraft((current) => ({ ...current, ...patch }));
  };

  const updateMcqDraftOption = (optionIndex, value) => {
    setMcqDraft((current) => ({
      ...current,
      options: current.options.map((option, index) => (index === optionIndex ? value : option)),
    }));
  };

  const addOrUpdateMcq = () => {
    const nextMcq = cleanMcq(mcqDraft);
    if (!nextMcq.question || nextMcq.options.some((option) => !option)) return;

    if (editingMcqId) {
      setMcqRows((rows) => rows.map((row) => (row.id === editingMcqId ? { ...nextMcq, id: editingMcqId } : row)));
    } else {
      setMcqRows((rows) => [...rows, { ...nextMcq, id: crypto.randomUUID() }]);
    }

    setMcqDraft(createMcq());
    setEditingMcqId("");
  };

  const editMcq = (mcq) => {
    setMcqDraft({ ...mcq, options: [...mcq.options] });
    setEditingMcqId(mcq.id);
  };

  const deleteMcq = (mcqId) => {
    setMcqRows((rows) => rows.filter((row) => row.id !== mcqId));
    if (editingMcqId === mcqId) {
      setMcqDraft(createMcq());
      setEditingMcqId("");
    }
  };

  const updateResultMark = (subject, value) => {
    const number = value === "" ? "" : Math.max(0, Math.min(100, Number(value)));
    setResultMarks((current) => ({ ...current, [subject]: number }));
  };

  const saveResult = () => {
    if (!selectedStudent) return;
    const existingKey = `${selectedStudent._id}-${resultTerm}`;
    const item = {
      id: existingKey,
      studentId: selectedStudent._id,
      rollNo: selectedStudent.rollNo || selectedStudent.rollNumber || selectedStudent.admissionNo,
      studentName: getStudentName(selectedStudent),
      fatherName: getFatherName(selectedStudent),
      term: resultTerm,
      marks: resultMarks,
      releaseAt: resultReleaseAt,
      savedAt: new Date().toLocaleString(),
    };
    setSavedResults((current) => [item, ...current.filter((row) => row.id !== existingKey)]);
    const remaining = students.filter((student) => {
      const key = `${student._id}-${resultTerm}`;
      return key !== existingKey && !savedResults.some((row) => row.id === key);
    });
    if (remaining[0]) {
      setSelectedStudentId(remaining[0]._id);
      setResultMarks({});
    }
    setResultNotice("");
    setShowResultForm(false);
  };

  const releaseResult = async (result) => {
    if (!selectedClass || !result?.studentId) return;
    try {
      await api.post("/academic-documents/release/result-cards", {
        studentId: result.studentId,
        className: selectedClass.className,
        section: selectedClass.section || "A",
        term: result.term,
        marks: result.marks,
        releaseAt: result.releaseAt || null,
      });
      notifyAcademicDocumentsUpdated({
        documentType: "RESULT_CARD",
        className: selectedClass.className,
        section: selectedClass.section || "A",
        term: result.term,
        studentId: result.studentId,
      });
      setResultNotice(`Result card released for ${result.studentName}.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to release result card");
    }
  };

  const printResultCard = (result) => {
    const student = students.find((item) => item._id === result.studentId) || {
      _id: result.studentId,
      name: result.studentName,
      fatherName: result.fatherName,
      rollNumber: result.rollNo,
    };
    setPrintPapers([]);
    setPrintResult({ ...result, student });
    window.setTimeout(() => window.print(), 50);
  };

  const searchResult = () => {
    const query = resultSearch.trim().toLowerCase();
    if (!query) return;
    const student = students.find((item) => String(item.rollNo || item.rollNumber || item.admissionNo || "").toLowerCase() === query);
    if (!student) return;
    setSelectedStudentId(student._id);
    const saved = savedResults.find((row) => row.id === `${student._id}-${resultTerm}` || String(row.rollNo).toLowerCase() === query);
    setResultMarks(saved?.marks || {});
    if (saved?.term) setResultTerm(saved.term);
    if (saved?.releaseAt) setResultReleaseAt(saved.releaseAt);
  };

  useEffect(() => {
    if (!selectedStudentId) return;
    const saved = savedResults.find((row) => row.id === `${selectedStudentId}-${resultTerm}`);
    setResultMarks(saved?.marks || {});
    if (saved?.releaseAt) setResultReleaseAt(saved.releaseAt);
  }, [resultTerm, savedResults, selectedStudentId]);

  const panelClass = dark ? "border-white/[0.06] bg-[#161722]" : "border-white/80 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.05)]";
  const inputClass = "h-10 rounded-xl border border-blue-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  const savedResultCount = savedResults.filter((row) => row.term === resultTerm).length;

  return (
    <section className="relative space-y-6">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          body * { visibility: hidden !important; }
          .result-print-root, .result-print-root * { visibility: visible !important; }
          .result-print-root { display: block !important; position: absolute !important; inset: 0 !important; padding: 0 !important; background: white !important; }
          .paper-print-root, .paper-print-root * { visibility: visible !important; }
          .paper-print-root { display: block !important; position: absolute !important; inset: 0 !important; padding: 0 !important; background: white !important; }
          .result-print-root, .paper-print-page { width: 194mm !important; min-height: 281mm !important; background: white !important; }
          .paper-print-page { break-after: page; page-break-after: always; padding: 0 !important; }
          .paper-print-page:last-child { break-after: auto; page-break-after: auto; }
          .result-card-print, .date-sheet-print-card, .paper-preview-print {
            width: 190mm !important;
            max-width: 190mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .result-card-print, .date-sheet-print-card { padding: 5mm !important; }
          .paper-preview-print { padding: 6mm !important; }
          .result-card-print h3, .date-sheet-print-card h3 { font-size: 26px !important; line-height: 1.05 !important; letter-spacing: 0 !important; }
          .paper-preview-print h3 { font-size: 22px !important; line-height: 1.1 !important; letter-spacing: 0 !important; }
          .result-card-print table, .date-sheet-print-card table, .paper-preview-print table { font-size: 10.5px !important; }
          .result-card-print th, .result-card-print td, .date-sheet-print-card th, .date-sheet-print-card td { padding: 4px 6px !important; }
          .paper-preview-print * { overflow-wrap: anywhere; }
          .result-card-print .h-20, .date-sheet-print-card .h-20, .paper-preview-print .h-20 { height: 50px !important; }
          .result-card-print .w-20, .date-sheet-print-card .w-20, .paper-preview-print .w-20 { width: 50px !important; }
          .result-card-print .h-16, .date-sheet-print-card .h-16, .paper-preview-print .h-16 { height: 42px !important; }
          .result-card-print .w-16, .date-sheet-print-card .w-16, .paper-preview-print .w-16 { width: 42px !important; }
        }
      `}</style>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-black ${dark ? "text-white" : "text-slate-950"}`}>Paper, Date Sheet & Result</h2>
          <p className={`mt-1 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Create papers, date sheets, and result cards for assigned classes.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ["PAPER", "Create Paper"],
            ["DATE_SHEET", "Create Date Sheet"],
            ["RESULT", "Create Results"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value);
                if (value === "PAPER") setShowPaperForm(true);
                if (value === "DATE_SHEET") setShowDateSheetForm(true);
                if (value === "RESULT") setShowResultForm(true);
              }}
              className={`rounded-xl px-4 py-3 text-sm font-black transition ${
                mode === value ? "bg-blue-800 text-white shadow-[0_12px_24px_rgba(30,64,175,0.22)]" : "border border-blue-200 bg-white text-blue-800 hover:bg-blue-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p> : null}

      <div className={`rounded-2xl border p-5 ${panelClass}`}>
        <div className="grid gap-3 md:grid-cols-3 md:items-end">
          <ScrollableSelect
            label="Class & Section"
            placeholder="Select class"
            value={selectedClassId}
            options={classSectionOptions.map((option) => ({
              value: option._id,
              label: `${option.className} - ${option.section || "A"}`,
            }))}
            onChange={setSelectedClassId}
            dark={dark}
            portal
          />
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-800">
            Students: {students.length}
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-800">
            Class & Section: {selectedClass ? `${selectedClass.className} - ${selectedClass.section || "A"}` : "-"}
          </div>
        </div>
      </div>

      {mode === "PAPER" ? (
        <div className="space-y-5">
          {showPaperForm ? (
            <div
              className="fixed inset-y-0 right-0 left-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/25 p-6 backdrop-blur-sm lg:left-72"
              onMouseDown={(event) => {
                if (event.currentTarget === event.target) setShowPaperForm(false);
              }}
            >
              <div className="w-full max-w-5xl rounded-2xl bg-blue-50 p-4 shadow-2xl">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-950">Create Paper</h3>
                    <p className="mt-0.5 text-xs font-semibold text-slate-600">Add paper details, MCQs, and subjective questions.</p>
                  </div>
                  <button type="button" onClick={() => setShowPaperForm(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-black text-blue-800 shadow-sm">x</button>
                </div>
                <div className={`rounded-2xl border p-4 ${panelClass}`}>
            <div className="grid gap-3 xl:grid-cols-2">
              <ScrollableSelect
                label="Paper Type"
                placeholder="Select paper type"
                value={paperTerm}
                options={TERMS.map((term) => ({ value: term, label: term }))}
                onChange={setPaperTerm}
                dark={dark}
                portal
              />
              <ScrollableSelect
                label="Book / Subject"
                placeholder="Select subject"
                value={paperBook}
                options={SUBJECTS.map((subject) => ({ value: subject, label: subject }))}
                onChange={setPaperBook}
                dark={dark}
                portal
              />
              <div className="grid gap-3 md:grid-cols-3 xl:col-span-2">
                <ModernDatePicker
                  label="Paper Date"
                  value={paperDate}
                  onChange={setPaperDate}
                  dark={dark}
                />
                <Field label="Paper Time">
                  <input className={`${inputClass} w-full`} value={paperExamTime} onChange={(event) => setPaperExamTime(event.target.value)} placeholder="08:30 AM - 11:30 AM" />
                </Field>
                <Field label="Total Marks">
                  <input className={`${inputClass} w-full`} value={paperTotalMarks} onChange={(event) => setPaperTotalMarks(event.target.value)} placeholder="100" />
                </Field>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-black uppercase text-blue-900">MCQs Part</h4>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl border border-blue-100 bg-white p-3">
                    <label className="text-xs font-black uppercase text-blue-800">
                      {editingMcqId ? "Edit MCQ" : "New MCQ"}
                    </label>
                    <input
                      className="mt-2 h-11 w-full rounded-xl border border-blue-200 px-3 text-sm font-bold outline-none"
                      value={mcqDraft.question}
                      onChange={(event) => updateMcqDraft({ question: event.target.value })}
                      placeholder="Write MCQ question"
                    />
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {mcqDraft.options.map((option, optionIndex) => (
                        <input
                          key={optionIndex}
                          className="h-10 rounded-lg border border-blue-100 px-3 text-sm font-semibold outline-none"
                          value={option}
                          onChange={(event) => updateMcqDraftOption(optionIndex, event.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                        />
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={addOrUpdateMcq} className="rounded-lg bg-blue-800 px-4 py-2 text-xs font-black uppercase text-white">
                        {editingMcqId ? "Update MCQ" : "Add MCQ"}
                      </button>
                      {editingMcqId ? (
                        <button type="button" onClick={() => { setMcqDraft(createMcq()); setEditingMcqId(""); }} className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-xs font-black uppercase text-blue-800">
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {mcqRows.length ? (
                    <div className="space-y-2">
                      {mcqRows.map((mcq, index) => (
                        <div key={mcq.id} className="rounded-xl border border-blue-100 bg-white p-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <p className="font-black text-slate-950">Question {index + 1}: {mcq.question}</p>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => editMcq(mcq)} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black uppercase text-blue-800">Edit</button>
                              <button type="button" onClick={() => deleteMcq(mcq.id)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-black uppercase text-rose-700">Delete</button>
                            </div>
                          </div>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {mcq.options.map((option, optionIndex) => (
                              <span key={optionIndex} className="rounded-lg border border-blue-100 px-3 py-2 text-sm font-semibold text-slate-700">
                                {String.fromCharCode(65 + optionIndex)}. {option}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-blue-200 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-500">
                      Added MCQs will appear here.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-black uppercase text-blue-900">Subjective Part</h4>
                </div>
                <div className="space-y-4">
                  {subjectiveRows.map((section, sectionIndex) => (
                    <div key={section.id} className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
                      <div className="grid gap-2 sm:grid-cols-3">
                        <input className="h-10 rounded-lg border border-blue-200 px-3 text-sm font-bold outline-none" value={section.heading} onChange={(event) => setSubjectiveRows((rows) => rows.map((row) => row.id === section.id ? { ...row, heading: event.target.value } : row))} />
                        <input className="h-10 rounded-lg border border-blue-200 px-3 text-sm font-bold outline-none" value={section.total} onChange={(event) => setSubjectiveRows((rows) => rows.map((row) => row.id === section.id ? { ...row, total: event.target.value } : row))} placeholder="Total questions" />
                        <input className="h-10 rounded-lg border border-blue-200 px-3 text-sm font-bold outline-none" value={section.attempt} onChange={(event) => setSubjectiveRows((rows) => rows.map((row) => row.id === section.id ? { ...row, attempt: event.target.value } : row))} placeholder="Attempt" />
                      </div>
                      <p className="mt-3 text-xs font-black uppercase text-blue-800">{section.heading}: write any {section.attempt} out of {section.total}</p>
                      <div className="mt-2 space-y-2">
                        {section.questions.map((question, questionIndex) => (
                          <input
                            key={questionIndex}
                            className="h-10 w-full rounded-lg border border-blue-100 px-3 text-sm font-semibold outline-none"
                            value={question}
                            onChange={(event) =>
                              setSubjectiveRows((rows) =>
                                rows.map((row) =>
                                  row.id === section.id
                                    ? { ...row, questions: row.questions.map((item, idx) => (idx === questionIndex ? event.target.value : item)) }
                                    : row
                                )
                              )
                            }
                            placeholder={`${questionIndex + 1}. Write question`}
                          />
                        ))}
                      </div>
                      <button type="button" onClick={() => setSubjectiveRows((rows) => rows.map((row) => row.id === section.id ? { ...row, questions: [...row.questions, ""] } : row))} className="mt-2 text-xs font-black uppercase text-blue-700">
                        + Add Question
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button type="button" onClick={savePaper} className="rounded-xl bg-blue-800 px-5 py-3 text-sm font-black uppercase text-white xl:col-span-2">Save Paper</button>
            </div>
          </div>
              </div>
            </div>
          ) : null}

          <div className={`rounded-2xl border p-5 ${panelClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-black text-slate-950">Paper History</h3>
              <button
                type="button"
                onClick={printAllPapers}
                disabled={!paperHistory.length}
                className="rounded-xl bg-blue-800 px-4 py-2 text-xs font-black uppercase text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Print All Papers
              </button>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-blue-100">
              {paperHistory.length ? (
                <>
                  <div className="hidden bg-blue-50 px-4 py-3 text-xs font-black uppercase text-blue-900 md:grid md:grid-cols-[1.2fr_1fr_1fr_auto] md:gap-3">
                    <span>Class & Section</span>
                    <span>Paper Type</span>
                    <span>Subject</span>
                    <span>Actions</span>
                  </div>
                  {paperHistory.map((paper) => (
                    <div key={paper.id} className="grid gap-3 border-t border-blue-50 px-4 py-3 text-sm md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center">
                      <span className="font-black text-slate-950">{paper.classLabel}</span>
                      <span className="font-semibold text-slate-600">{paper.term}</span>
                      <span className="font-semibold text-blue-900">{paper.book}</span>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setPreviewPaper(paper)} title="View paper" className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-800 transition hover:bg-blue-100">
                          <IconEye />
                        </button>
                        <button type="button" onClick={() => printPaper(paper)} title="Print paper" className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-800 transition hover:bg-blue-100">
                          <IconPrinter />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p className="px-4 py-6 text-sm font-semibold text-slate-500">Saved papers will appear here.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {mode === "DATE_SHEET" ? (
        <div className="space-y-5">
          {dateSheetReleaseAt ? (
            <div className="ml-auto w-fit rounded-2xl border border-blue-100 bg-white px-4 py-3 text-right shadow-sm">
              <p className="text-xs font-black uppercase text-blue-700">Date Sheet Release Countdown</p>
              <p className="text-sm font-black text-slate-950">{getCountdown(dateSheetReleaseAt)}</p>
            </div>
          ) : null}
          {dateSheetNotice ? (
            <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-900">
              <span>{dateSheetNotice}</span>
              <button type="button" className="text-xl leading-none text-blue-700" onClick={() => setDateSheetNotice("")}>×</button>
            </div>
          ) : null}
          {showDateSheetForm ? (
            <div
              className="fixed inset-y-0 right-0 left-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/25 p-3 backdrop-blur-sm lg:left-72"
              onMouseDown={(event) => {
                if (event.currentTarget === event.target) setShowDateSheetForm(false);
              }}
            >
              <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-blue-50 p-3 shadow-2xl">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-950">Create Date Sheet</h3>
                    <p className="text-[11px] font-semibold text-slate-600">Set term, release time, and edit dates directly in the sheet.</p>
                  </div>
                  <button type="button" onClick={() => setShowDateSheetForm(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-black text-blue-800 shadow-sm">x</button>
                </div>

                <div className={`rounded-xl border p-2.5 ${panelClass}`}>
                  <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
                    <ScrollableSelect
                      label="Exam Term"
                      placeholder="Select exam term"
                      value={dateSheetTerm}
                      options={EXAM_TERMS.map((term) => ({ value: term, label: term }))}
                      onChange={setDateSheetTerm}
                      dark={dark}
                      portal
                    />
                    <ModernDateTimePicker
                      label="Release Date & Time"
                      value={dateSheetReleaseAt}
                      onChange={setDateSheetReleaseAt}
                      dark={dark}
                      placeholder="Select release date & time"
                    />
                    <button type="button" onClick={saveDateSheet} className="h-9 rounded-lg bg-blue-800 px-4 text-[11px] font-black uppercase text-white">
                      {dateSheetSaved ? "Update" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        releaseDateSheet({
                          id: `${dateSheetTerm}-${selectedClassId}`,
                          term: dateSheetTerm,
                          className: selectedClass?.className || "",
                          section: selectedClass?.section || "A",
                          rows: dateSheetRows,
                          examStartDate,
                          gapDays,
                          paperTime,
                          reportingTime,
                          releaseAt: dateSheetReleaseAt,
                        })
                      }
                      className="h-9 rounded-lg bg-emerald-700 px-4 text-[11px] font-black uppercase text-white"
                    >
                      Release
                    </button>
                  </div>
                </div>

                <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-1">
                  <DateSheetPreview
                    selectedClass={selectedClass}
                    examTerm={dateSheetTerm}
                    rows={dateSheetRows}
                    releaseAt={dateSheetReleaseAt}
                    onRowChange={(index, patch) => setDateSheetRows((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row))}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className={`rounded-2xl border p-5 ${panelClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-black text-slate-950">Saved Date Sheets</h3>
              <button type="button" onClick={() => setShowDateSheetForm(true)} className="rounded-xl bg-blue-800 px-4 py-2 text-xs font-black uppercase text-white">
                Create Date Sheet
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {savedDateSheets.length ? savedDateSheets.map((sheet) => (
                <div key={sheet.id} className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="font-black text-blue-950">{sheet.term}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{sheet.classLabel}</p>
                  <p className="mt-2 text-xs font-black uppercase text-blue-800">Exam Time: {sheet.paperTime}</p>
                  <p className="text-xs font-semibold text-slate-500">Saved: {sheet.savedAt}</p>
                  <button
                    type="button"
                    onClick={() => releaseDateSheet(sheet)}
                    className="mt-3 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black uppercase text-white"
                  >
                    Release
                  </button>
                </div>
              )) : <p className="text-sm font-semibold text-slate-500">Saved date sheets will appear here category wise.</p>}
            </div>
          </div>
        </div>
      ) : null}

      {mode === "RESULT" ? (
        <div className="space-y-5">
          {resultReleaseAt ? (
            <div className="ml-auto w-fit rounded-2xl border border-blue-100 bg-white px-4 py-3 text-right shadow-sm">
              <p className="text-xs font-black uppercase text-blue-700">Result Release Countdown</p>
              <p className="text-sm font-black text-slate-950">{getCountdown(resultReleaseAt)}</p>
            </div>
          ) : null}
          {resultNotice ? (
            <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-900">
              <span>{resultNotice}</span>
              <button type="button" className="text-xl leading-none text-blue-700" onClick={() => setResultNotice("")}>×</button>
            </div>
          ) : null}
          {showResultForm ? (
            <div
              className="fixed inset-y-0 right-0 left-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/25 p-6 backdrop-blur-sm lg:left-72"
              onMouseDown={(event) => {
                if (event.currentTarget === event.target) setShowResultForm(false);
              }}
            >
              <div className="max-h-[calc(100vh-3rem)] w-full max-w-5xl overflow-y-auto rounded-2xl bg-blue-50 p-4 shadow-2xl">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-950">Create Result</h3>
                    <p className="mt-0.5 text-xs font-semibold text-slate-600">Select student, enter marks, and save result card.</p>
                  </div>
                  <button type="button" onClick={() => setShowResultForm(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-black text-blue-800 shadow-sm">x</button>
                </div>

          <div className={`rounded-2xl border p-4 ${panelClass}`}>
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6 xl:items-end">
              <ScrollableSelect
                label="Exam Term"
                placeholder="Select exam term"
                value={resultTerm}
                options={EXAM_TERMS.map((term) => ({ value: term, label: term }))}
                onChange={setResultTerm}
                dark={dark}
                portal
              />
              <ScrollableSelect
                label="Roll No / Student"
                placeholder="Select student"
                value={selectedStudentId}
                options={students.map((student) => ({
                  value: student._id || student.studentId,
                  label: String(student.rollNo || student.rollNumber || student.admissionNo || "-"),
                }))}
                onChange={setSelectedStudentId}
                dark={dark}
                portal
              />
              <ModernDateTimePicker
                label="Release Date & Time"
                value={resultReleaseAt}
                onChange={setResultReleaseAt}
                dark={dark}
                placeholder="Select release date & time"
              />
              <Field label="Search Roll Number">
                <input className={`${inputClass} w-full`} value={resultSearch} onChange={(event) => setResultSearch(event.target.value)} placeholder="Search roll number" />
              </Field>
              <button type="button" onClick={searchResult} className="self-end rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black uppercase text-blue-800">Search</button>
              <button type="button" onClick={saveResult} className="self-end rounded-xl bg-blue-800 px-5 py-3 text-sm font-black uppercase text-white">
                {savedResults.some((row) => row.id === `${selectedStudentId}-${resultTerm}`) ? "Update Result" : "Save Result"}
              </button>
              {selectedStudent ? (
                <button
                  type="button"
                  onClick={() =>
                    releaseResult({
                      id: `${selectedStudentId}-${resultTerm}`,
                      studentId: selectedStudent._id,
                      rollNo: selectedStudent.rollNo || selectedStudent.rollNumber || selectedStudent.admissionNo,
                      studentName: getStudentName(selectedStudent),
                      fatherName: getFatherName(selectedStudent),
                      term: resultTerm,
                      marks: resultMarks,
                      releaseAt: resultReleaseAt,
                    })
                  }
                  className="self-end rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black uppercase text-white"
                >
                  Release
                </button>
              ) : null}
            </div>
          </div>
          {selectedStudent ? (
            <ResultCardPreview selectedClass={selectedClass} student={selectedStudent} term={resultTerm} marks={resultMarks} releaseAt={resultReleaseAt} onMarkChange={updateResultMark} teacherSignature={teacherSignature} />
          ) : (
            <div className="rounded-2xl border border-blue-100 bg-white p-6 text-center text-sm font-bold text-slate-500">
              Select a student to create or update a result card.
            </div>
          )}
              </div>
            </div>
          ) : null}

          <div className={`rounded-2xl border p-5 ${panelClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-950">Saved Results</h3>
                <p className="mt-1 text-sm font-black text-blue-800">
                  Results completed: {savedResultCount} / {students.length}. Remaining: {Math.max(students.length - savedResultCount, 0)}.
                </p>
              </div>
              <button type="button" onClick={() => setShowResultForm(true)} className="rounded-xl bg-blue-800 px-4 py-2 text-xs font-black uppercase text-white">
                Create Result
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-blue-100">
              {savedResults.length ? (
                <>
                  <div className="hidden border-b border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black uppercase text-blue-900 md:grid md:grid-cols-[7rem_1fr_1fr_auto_auto] md:gap-3">
                    <span>Roll No</span>
                    <span>Student Name</span>
                    <span>Term</span>
                    <span>Print</span>
                    <span>Release</span>
                  </div>
                  {savedResults.map((result) => (
                    <div key={result.id} className="grid gap-3 border-b border-blue-50 px-4 py-3 text-sm last:border-b-0 md:grid-cols-[7rem_1fr_1fr_auto_auto]">
                      <span className="font-black text-blue-900">#{result.rollNo}</span>
                      <span className="font-bold text-slate-950">{getStudentDisplayName({ name: result.studentName, fatherName: result.fatherName })}</span>
                      <span className="font-semibold text-slate-500">{result.term}</span>
                      <button type="button" onClick={() => printResultCard(result)} title="Print result card" className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-800 transition hover:bg-blue-100">
                        <IconPrinter />
                      </button>
                      <button type="button" onClick={() => releaseResult(result)} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black uppercase text-white">
                        Release
                      </button>
                    </div>
                  ))}
                </>
              ) : (
                <p className="px-4 py-6 text-center text-sm font-semibold text-slate-500">Saved student results will appear here.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="result-print-root hidden">
        {printResult ? (
          <ResultCardPreview
            selectedClass={selectedClass}
            student={printResult.student}
            term={printResult.term}
            marks={printResult.marks || {}}
            releaseAt={printResult.releaseAt}
            onMarkChange={() => {}}
            editable={false}
            teacherSignature={teacherSignature}
          />
        ) : null}
      </div>

      <div className="paper-print-root hidden">
        {printPapers.map((paper) => (
          <div key={paper.id} className="paper-print-page">
            <PaperPreview paper={paper} />
          </div>
        ))}
      </div>

      {previewPaper ? (
        <div
          className="fixed inset-y-0 right-0 left-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/25 p-6 backdrop-blur-sm lg:left-72"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setPreviewPaper(null);
          }}
        >
          <div className="max-h-[calc(100vh-3rem)] w-full max-w-5xl overflow-y-auto rounded-2xl bg-blue-50 p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-slate-950">Paper Preview</h3>
              <button type="button" onClick={() => setPreviewPaper(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-black text-blue-800 shadow-sm">x</button>
            </div>
            <PaperPreview paper={previewPaper} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
