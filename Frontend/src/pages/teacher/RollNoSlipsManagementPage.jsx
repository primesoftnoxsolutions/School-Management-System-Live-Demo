import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import api from "../../services/api/client";
import ModernDateTimePicker from "../../components/ui/ModernDateTimePicker";
import ScrollableSelect from "../../components/ui/ScrollableSelect";
import { resolveStudentPhotoUrl } from "../../utils/mediaUrl";
import { fetchTeacherSignature } from "../../utils/teacherSignature";
import { notifyAcademicDocumentsUpdated } from "../../utils/academicDocumentsSync";

const SUBJECTS = [
  "ENGLISH",
  "URDU",
  "MATHEMATICS",
  "PHYSICS",
  "CHEMISTRY",
  "BIOLOGY",
  "ISLAMIC STUDIES",
  "PAKISTAN STUDIES",
  "COMPUTER SCIENCE",
  "GENERAL SCIENCE",
];

const createDefaultRows = () =>
  SUBJECTS.map((subject, index) => {
    const date = addDays(toInputDate(), index * 2);
    return {
      subject,
      date,
      day: formatDay(date).toUpperCase(),
      dateLabel: formatDate(date).toUpperCase(),
      time: "08:30",
    };
  });

const toInputDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (dateValue, days) => {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toInputDate(date);
};

const formatDate = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const formatDay = (value) => new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long" });

const getStudentName = (student = {}) => student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim() || "-";
const getFatherName = (student = {}) => student.fatherName || student.guardianName || "";
const getStudentDisplayName = (student = {}) => {
  const name = getStudentName(student);
  const fatherName = getFatherName(student);
  return fatherName ? `${name} / ${fatherName}` : name;
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

function SchoolBadge() {
  return (
    <div className="school-badge flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-700 shadow-[0_6px_14px_rgba(0,0,0,0.16)]">
      <svg viewBox="0 0 64 64" className="h-8 w-8" fill="none" aria-hidden="true">
        <path d="M32 5 52 12v17c0 13-8.4 23.2-20 29C20.4 52.2 12 42 12 29V12l20-7Z" fill="#ffffff" stroke="#0b55c8" strokeWidth="2.4" />
        <path d="M32 12 46 17v12c0 8.6-5.8 16.2-14 21-8.2-4.8-14-12.4-14-21V17l14-5Z" fill="#eff6ff" stroke="#0b55c8" strokeWidth="1.8" />
        <path d="M24 27c0-2.2 1.8-4 4-4h8c2.2 0 4 1.8 4 4v12H24V27Z" fill="#0b55c8" />
        <path d="M28 29h8M28 34h8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function SlipField({ label, value }) {
  return (
    <div className="slip-field grid grid-cols-[6.5rem_0.5rem_minmax(0,1fr)] items-center gap-1 text-[11px] font-bold text-blue-950">
      <span>{label}</span>
      <span>:</span>
      <span className="slip-value min-h-5 truncate border-b border-blue-400 px-1.5 text-slate-950">{value || ""}</span>
    </div>
  );
}

export default function RollNoSlipsManagementPage({ dark = false }) {
  const user = useSelector((state) => state.auth.user);
  const [teacherSignature, setTeacherSignature] = useState("");
  const [classOptions, setClassOptions] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState([]);
  const [showGenerator, setShowGenerator] = useState(false);
  const [dateSheetRows, setDateSheetRows] = useState(() => createDefaultRows());
  const [releaseAt, setReleaseAt] = useState("");
  const [savedSetup, setSavedSetup] = useState(null);
  const [generated, setGenerated] = useState(false);
  const [slipsSaved, setSlipsSaved] = useState(false);
  const [releaseNotice, setReleaseNotice] = useState("");
  const [printStudents, setPrintStudents] = useState([]);
  const [nowTick, setNowTick] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [releasing, setReleasing] = useState(false);
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

  const dateSheet = savedSetup?.rows || dateSheetRows;
  const firstStudent = students[0] || null;

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTeacherSignature(user).then(setTeacherSignature);
  }, [user]);

  useEffect(() => {
    const loadClasses = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/teacher-panel/class-options");
        setClassOptions(data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load roll slip classes");
        setClassOptions([]);
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, []);

  useEffect(() => {
    if (!selectedClassId && classSectionOptions.length) {
      setSelectedClassId(classSectionOptions[0]._id);
    }
  }, [classSectionOptions, selectedClassId]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClass) {
        setStudents([]);
        return;
      }

      setStudentsLoading(true);
      setGenerated(false);
      try {
        const { data } = await api.get("/teacher-panel/students", {
          params: { className: selectedClass.className, section: selectedClass.section || "A" },
        });
        setStudents(data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load students for roll slip");
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    };

    loadStudents();
  }, [selectedClass]);

  const saveSetup = () => {
    setSavedSetup({ rows: dateSheetRows, releaseAt });
    setGenerated(false);
    setSlipsSaved(false);
    setReleaseNotice("");
  };

  const openGenerator = () => {
    setShowGenerator(true);
  };

  const closeGenerator = () => {
    setShowGenerator(false);
  };

  const printSlip = (student) => {
    setPrintStudents(student ? [student] : []);
    window.setTimeout(() => window.print(), 50);
  };

  const printAllSlips = () => {
    if (!generated) startGenerating();
    setPrintStudents(students);
    window.setTimeout(() => window.print(), 50);
  };

  const startGenerating = () => {
    if (!savedSetup) saveSetup();
    setGenerated(true);
  };

  const releaseRollSlips = async () => {
    if (!selectedClass || !students.length) {
      setError("Select a class with students before releasing roll slips.");
      return;
    }
    const rows = savedSetup?.rows || dateSheetRows;
    setReleasing(true);
    setError("");
    try {
      await api.post("/academic-documents/release/roll-slips", {
        className: selectedClass.className,
        section: selectedClass.section || "A",
        term: "Examination",
        rows,
        releaseAt: savedSetup?.releaseAt || releaseAt || null,
        studentIds: students.map((student) => student._id).filter(Boolean),
      });
      notifyAcademicDocumentsUpdated({
        documentType: "ROLL_SLIP",
        className: selectedClass.className,
        section: selectedClass.section || "A",
      });
      setSlipsSaved(true);
      setReleaseNotice("Roll slips released. Students can now view them in their portal.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to release roll slips");
    } finally {
      setReleasing(false);
    }
  };

  const updateTemplateRow = (index, patch) => {
    setDateSheetRows((rows) =>
      rows.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        const next = { ...row, ...patch };
        if (patch.date) {
          next.day = formatDay(patch.date).toUpperCase();
          next.dateLabel = formatDate(patch.date).toUpperCase();
        }
        return next;
      })
    );
  };

  const renderSlip = (student, studentIndex, editable = false) => {
    if (!student) return null;
    const rollNo = student.rollNumber || student.rollNo || String(Math.max(studentIndex + 1, 1)).padStart(2, "0");
    const studentName = getStudentName(student);
    const photoUrl = resolveStudentPhotoUrl(student.studentPhotoUrl);
    const rows = editable ? dateSheetRows : dateSheet;

    return (
      <div key={student._id || "template"} className="roll-slip-card mx-auto max-w-4xl overflow-hidden rounded-lg border-2 border-blue-700 bg-white shadow-[0_10px_28px_rgba(37,99,235,0.12)]">
        <div className="overflow-hidden rounded-md border-2 border-white bg-white text-blue-950">
          <div className="roll-slip-header relative bg-blue-800 px-3 py-1.5 text-white">
            <div className="relative z-10 grid grid-cols-[3rem_1fr_3rem] items-center gap-2">
              <SchoolBadge />
              <div className="text-center">
                <h3 className="text-lg font-black uppercase leading-none tracking-wide sm:text-xl">Insaaf Grammer High School</h3>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em]">Roll No. Slip</p>
              </div>
              <SchoolBadge />
            </div>
          </div>

          <div className="roll-slip-body px-3 py-2">
            <div className="roll-slip-info-grid grid items-start gap-3 md:grid-cols-[minmax(0,1fr)_4.5rem]">
              <div className="roll-slip-fields grid gap-x-4 gap-y-1 md:grid-cols-2">
                <div className="space-y-1">
                  <SlipField label="Roll No." value={rollNo} />
                  <SlipField label="Student Name" value={studentName} />
                  <SlipField label="Father Name" value={getFatherName(student)} />
                  <SlipField label="Class" value={selectedClass ? `${selectedClass.className} - ${selectedClass.section || "A"}` : ""} />
                </div>
                <div className="space-y-1">
                  <SlipField label="Registration ID" value={student.admissionNo || student._id} />
                  <SlipField label="Exam Starts" value={rows[0]?.dateLabel || ""} />
                  <SlipField label="Release Time" value={savedSetup?.releaseAt ? new Date(savedSetup.releaseAt).toLocaleString() : releaseAt ? new Date(releaseAt).toLocaleString() : "Not scheduled"} />
                </div>
              </div>

              <div className="candidate-photo flex h-16 w-16 items-center justify-center justify-self-end overflow-hidden rounded border border-blue-600 bg-white text-center text-[9px] font-black uppercase text-blue-800">
                {photoUrl ? <img src={photoUrl} alt="Candidate" className="h-full w-full object-cover" /> : <span>Candidate<br />Photo</span>}
              </div>
            </div>

            <div className="date-sheet-wrap mt-2 overflow-hidden rounded-md border border-blue-400">
              <div className="date-sheet-title bg-blue-800 py-0.5 text-center text-xs font-black uppercase text-white">Date Sheet</div>
              <table className="w-full table-fixed border-collapse text-center text-[11px] text-blue-950">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="w-[10%] border border-blue-300 px-1 py-0.5 font-black uppercase">Sr. No.</th>
                    <th className="border border-blue-300 px-1 py-0.5 font-black uppercase">Subject</th>
                    <th className="border border-blue-300 px-1 py-0.5 font-black uppercase">Day</th>
                    <th className="border border-blue-300 px-1 py-0.5 font-black uppercase">Date</th>
                    <th className="border border-blue-300 px-1 py-0.5 font-black uppercase">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.subject} className="h-5">
                      <td className="border border-blue-300 px-1 py-0.5 font-bold">{index + 1}.</td>
                      <td className="border border-blue-300 px-1 py-0.5 font-semibold uppercase">{row.subject}</td>
                      <td className="border border-blue-300 px-1 py-0.5 uppercase">{row.day}</td>
                      <td
                        className={`border border-blue-300 px-1 py-0.5 uppercase ${editable ? "cursor-text bg-blue-50/60 font-bold outline-none" : ""}`}
                        contentEditable={editable}
                        suppressContentEditableWarning
                        onBlur={(event) => {
                          if (!editable) return;
                          const parsed = new Date(event.currentTarget.textContent);
                          if (!Number.isNaN(parsed.getTime())) updateTemplateRow(index, { date: toInputDate(parsed) });
                        }}
                      >
                        {row.dateLabel}
                      </td>
                      <td
                        className={`border border-blue-300 px-1 py-0.5 ${editable ? "cursor-text bg-blue-50/60 font-bold outline-none" : ""}`}
                        contentEditable={editable}
                        suppressContentEditableWarning
                        onBlur={(event) => editable && updateTemplateRow(index, { time: event.currentTarget.textContent.trim() || row.time })}
                      >
                        {row.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="roll-slip-footer mt-2 grid items-end gap-3 text-[10px] font-bold text-blue-950 md:grid-cols-[1fr_9rem_9rem]">
              <div className="instructions-box rounded-md border border-blue-300 p-2">
                <p className="font-black uppercase text-blue-800">Instructions</p>
                <p className="mt-0.5">Bring this roll no slip and school ID card on every paper day.</p>
                <p>Reach the examination hall 30 minutes before paper time.</p>
                <p>Mobile phones and unfair means are strictly prohibited.</p>
              </div>
              <div className="text-center font-black uppercase">
                <div className="mb-1 border-b border-blue-900 pb-3" />
                Principal Signature
              </div>
              <div className="text-center font-black uppercase">
                {teacherSignature ? (
                  <>
                    <img src={teacherSignature} alt="Teacher signature" className="teacher-sign-img mx-auto mb-0.5 h-7 max-w-[110px] object-contain" />
                    <div className="mb-1 border-b border-blue-900" />
                  </>
                ) : (
                  <div className="mb-1 border-b border-blue-900 pb-3" />
                )}
                Teacher Signature
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Loading roll no slips...</p>;
  }

  return (
    <section className="relative space-y-5">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 5mm; }
          html, body {
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          body * { visibility: hidden !important; }
          .roll-slip-print-root, .roll-slip-print-root * { visibility: visible !important; }
          .roll-slip-print-root {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 287mm !important;
            padding: 0 !important;
            background: white !important;
          }
          .roll-slip-print-page {
            break-after: page;
            page-break-after: always;
            width: 287mm !important;
            height: 200mm !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            display: block !important;
            overflow: visible !important;
          }
          .roll-slip-print-page:last-child { break-after: auto; page-break-after: auto; }
          .roll-slip-card {
            width: 287mm !important;
            max-width: 287mm !important;
            height: auto !important;
            max-height: 200mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: 2px solid #1d4ed8 !important;
            border-radius: 10px !important;
            overflow: visible !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .roll-slip-card > div {
            border: 0 !important;
            border-radius: 0 !important;
            overflow: visible !important;
            display: flex !important;
            flex-direction: column !important;
            height: auto !important;
            max-height: 196mm !important;
          }
          .roll-slip-card,
          .roll-slip-card * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .roll-slip-card .roll-slip-header {
            background: #1e40af !important;
            background-image: none !important;
            padding: 7px 12px !important;
            flex: 0 0 auto !important;
          }
          .roll-slip-card .roll-slip-header > div {
            grid-template-columns: 2.5rem 1fr 2.5rem !important;
            gap: 8px !important;
          }
          .roll-slip-card .roll-slip-header h3 {
            font-size: 20px !important;
            line-height: 1.1 !important;
            color: #ffffff !important;
          }
          .roll-slip-card .roll-slip-header p {
            font-size: 10px !important;
            letter-spacing: 0.14em !important;
            color: #ffffff !important;
            margin-top: 2px !important;
          }
          .roll-slip-card .roll-slip-body {
            padding: 6px 10px 6px !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 5px !important;
            flex: 1 1 auto !important;
          }
          .roll-slip-card .roll-slip-info-grid {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) 64px !important;
            gap: 10px !important;
            flex: 0 0 auto !important;
          }
          .roll-slip-card .roll-slip-fields {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 4px 20px !important;
          }
          .roll-slip-card .roll-slip-fields > div {
            display: flex !important;
            flex-direction: column !important;
            gap: 3px !important;
          }
          .roll-slip-card .slip-field {
            display: grid !important;
            grid-template-columns: 6.5rem 0.45rem minmax(0, 1fr) !important;
            gap: 4px !important;
            font-size: 10px !important;
          }
          .roll-slip-card .slip-field .slip-value {
            min-height: 14px !important;
            padding: 0 4px !important;
          }
          .roll-slip-card .candidate-photo {
            width: 64px !important;
            height: 74px !important;
            font-size: 8px !important;
          }
          .roll-slip-card .date-sheet-wrap {
            margin-top: 0 !important;
            flex: 0 0 auto !important;
            overflow: visible !important;
          }
          .roll-slip-card .date-sheet-title {
            background: #1e40af !important;
            padding: 3px 0 !important;
            font-size: 11px !important;
            color: #ffffff !important;
          }
          .roll-slip-card table {
            width: 100% !important;
            font-size: 9.5px !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
          }
          .roll-slip-card thead { background: #eff6ff !important; }
          .roll-slip-card th,
          .roll-slip-card td {
            padding: 1.5px 4px !important;
            line-height: 1.15 !important;
          }
          .roll-slip-card tbody tr { height: auto !important; }
          .roll-slip-card .roll-slip-footer {
            display: grid !important;
            visibility: visible !important;
            margin-top: 4px !important;
            gap: 10px !important;
            grid-template-columns: minmax(0, 1.4fr) 8.5rem 8.5rem !important;
            font-size: 9px !important;
            flex: 0 0 auto !important;
            align-items: end !important;
            color: #172554 !important;
          }
          .roll-slip-card .roll-slip-footer > * { visibility: visible !important; }
          .roll-slip-card .roll-slip-footer .instructions-box {
            padding: 5px 7px !important;
            border: 1px solid #93c5fd !important;
          }
          .roll-slip-card .school-badge {
            width: 38px !important;
            height: 38px !important;
          }
          .roll-slip-card .school-badge svg {
            width: 30px !important;
            height: 30px !important;
          }
          .roll-slip-card .teacher-sign-img {
            height: 24px !important;
            max-width: 110px !important;
          }
        }
      `}</style>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>Roll No Slips Management</h2>
          <p className={`mt-1 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
            Generate roll no slips for the complete selected class.
          </p>
        </div>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
          {savedSetup?.releaseAt ? (
            <div className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-right shadow-sm">
              <p className="text-xs font-black uppercase text-blue-700">Release Countdown</p>
              <p className="text-sm font-black text-slate-950">{getCountdown(savedSetup.releaseAt, nowTick)}</p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={openGenerator}
            className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-black uppercase text-white shadow-sm transition hover:bg-blue-800"
          >
            Generate Slip
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {studentsLoading ? <p className="text-sm text-slate-500">Loading students...</p> : null}
      {releaseNotice ? null : null}

      <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black uppercase text-blue-950">Roll No Slips Name</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {selectedClass ? `${selectedClass.className} - Section ${selectedClass.section || "A"}` : "Select a class to view students."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase text-blue-800">
              {students.length} Students
            </span>
            <button type="button" onClick={printAllSlips} className="flex items-center gap-2 rounded-xl bg-blue-800 px-4 py-2 text-xs font-black uppercase text-white">
              <IconPrinter />
              <span>Print All Slips</span>
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-blue-100">
          {students.length ? (
            <>
              <div className="hidden border-b border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black uppercase text-blue-900 md:grid md:grid-cols-[6rem_1fr_1fr_auto_auto] md:gap-3">
                <span>Roll No</span>
                <span>Student Name</span>
                <span>Registration</span>
                <span>Status</span>
                <span>Action</span>
              </div>
              {students.map((student, index) => (
                <div key={student._id || student.admissionNo || index} className="grid gap-3 border-b border-blue-50 px-4 py-3 text-sm last:border-b-0 md:grid-cols-[6rem_1fr_1fr_auto_auto]">
                  <span className="font-black text-blue-900">#{student.rollNumber || student.rollNo || String(index + 1).padStart(2, "0")}</span>
                  <span className="font-bold text-slate-950">{getStudentDisplayName(student)}</span>
                  <span className="font-semibold text-slate-500">{student.admissionNo || student._id}</span>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-black uppercase ${generated ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {generated ? "Slip Ready" : "Pending"}
                  </span>
                  <button type="button" onClick={() => printSlip(student)} title="Print slip" className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-800 transition hover:bg-blue-100">
                    <IconPrinter />
                  </button>
                </div>
              ))}
            </>
          ) : (
            <p className="px-4 py-6 text-center text-sm font-semibold text-slate-500">No students found for this class.</p>
          )}
        </div>
      </div>

      {showGenerator ? (
        <div
          className="fixed inset-y-0 right-0 left-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/25 p-6 backdrop-blur-sm lg:left-72"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) closeGenerator();
          }}
        >
          <div className="w-full max-w-7xl rounded-2xl bg-blue-50 p-4 shadow-2xl">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-950">Generate Roll No Slips</h3>
                <p className="mt-0.5 text-xs font-semibold text-slate-600">Select class, save setup, then generate slips.</p>
              </div>
              <button type="button" onClick={closeGenerator} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-black text-blue-800 shadow-sm">x</button>
            </div>

            <div className="rounded-xl border border-blue-200 bg-white p-3 shadow-sm">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
                <ScrollableSelect
                  label="Class & Section"
                  placeholder={classSectionOptions.length ? "Select class" : "No class assigned"}
                  value={selectedClassId}
                  options={classSectionOptions.map((option) => ({
                    value: option._id,
                    label: `${option.className} - Section ${option.section || "A"}`,
                  }))}
                  onChange={setSelectedClassId}
                  dark={dark}
                  portal
                />

                <ModernDateTimePicker
                  label="Portal Release Date & Time"
                  value={releaseAt}
                  onChange={setReleaseAt}
                  dark={dark}
                  placeholder="Select release date & time"
                />

                <div className="flex gap-2">
                  <button type="button" onClick={saveSetup} className="h-10 flex-1 rounded-lg border border-blue-200 bg-blue-50 px-4 text-xs font-black uppercase text-blue-700">
                    Save
                  </button>
                  <button type="button" onClick={startGenerating} className="h-10 flex-1 rounded-lg bg-blue-700 px-4 text-xs font-black uppercase text-white">
                    Start
                  </button>
                </div>
              </div>

              <p className="mt-2 text-xs font-semibold text-slate-500">
                Edit the Date and Time cells directly in the first slip below. Saving copies the same date sheet to every student slip.
                {savedSetup?.releaseAt ? ` Release scheduled: ${new Date(savedSetup.releaseAt).toLocaleString()}.` : ""}
              </p>
            </div>

            {!generated ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-bold text-slate-600">First student slip template. Edit date/time cells, then Save and Start.</p>
                {renderSlip(firstStudent, 0, true)}
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={releaseRollSlips}
                    disabled={releasing}
                    className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-black uppercase text-white disabled:opacity-60"
                  >
                    {releasing ? "Releasing..." : slipsSaved ? "Released to Portal" : "Release All Slips"}
                  </button>
                </div>
                {releaseNotice ? <p className="text-right text-xs font-semibold text-emerald-700">{releaseNotice}</p> : null}
                <div className="max-h-[calc(100vh-10rem)] space-y-3 overflow-y-auto pr-1">
                  {students.map((student, studentIndex) => renderSlip(student, studentIndex, false))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="roll-slip-print-root hidden">
        {(printStudents.length ? printStudents : []).map((student, index) => (
          <div key={student._id || student.admissionNo || index} className="roll-slip-print-page">
            {renderSlip(student, students.findIndex((item) => item._id === student._id))}
          </div>
        ))}
      </div>
    </section>
  );
}

