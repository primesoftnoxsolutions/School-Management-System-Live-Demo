import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import api from "../../services/api/client";
import WaitingReleaseState from "../../components/ui/WaitingReleaseState";

const SUBJECTS = [
  "English",
  "Urdu",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Islamic Studies",
  "Pakistan Studies",
  "Computer Science",
];

const SUBJECT_SHORT = {
  English: "ENGLISH",
  Urdu: "URDU",
  Mathematics: "MATHS",
  Physics: "PHYSICS",
  Chemistry: "CHEMISTRY",
  Biology: "BIOLOGY",
  "Islamic Studies": "ISL. STUDIES",
  "Pakistan Studies": "PAK. STUDIES",
  "Computer Science": "COMP. SCIENCE",
};

function sameId(a, b) {
  return String(a || "") === String(b || "");
}

function pct(value, total = 100) {
  if (!total) return "0.00%";
  return `${((Number(value || 0) / Number(total)) * 100).toFixed(2)}%`;
}

function gradeFromPercentage(percentage) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}

function getStudentName(user = {}) {
  const cleanLastName =
    String(user.lastName || "").trim() === "-" ||
    (user.lastName && user.fatherName && String(user.lastName).trim().toLowerCase() === String(user.fatherName).trim().toLowerCase())
      ? ""
      : user.lastName || "";
  return `${user.firstName || ""} ${cleanLastName}`.trim() || user.fullName || user.name || "Student";
}

function getFatherName(user = {}) {
  return user.fatherName || user.guardianName || "-";
}

function formatResultDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

function LogoMark() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-b-2xl rounded-t-lg border-2 border-white bg-white text-center shadow-inner">
      <div className="flex h-11 w-10 flex-col items-center justify-center rounded-b-xl rounded-t-md border-2 border-[#06268a] text-[#06268a]">
        <div className="text-lg font-black leading-none">★</div>
        <div className="mt-1 text-[9px] font-black leading-none">BOOK</div>
        <div className="mt-1 h-0.5 w-6 rounded-full bg-[#06268a]" />
      </div>
    </div>
  );
}

function FieldLine({ label, value }) {
  return (
    <div className="grid grid-cols-[118px_12px_1fr] items-end gap-1 border-b border-[#143597]/70 pb-0.5">
      <span className="text-[11px] font-black uppercase text-[#06268a]">{label}</span>
      <span className="text-center text-[11px] font-black text-[#06268a]">:</span>
      <span className="text-xs font-black text-slate-950">{value}</span>
    </div>
  );
}

function ResultToggle({ mode, setMode }) {
  return (
    <div className="flex justify-end py-3">
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {[
          ["student", "Your Result"],
          ["class", "Class Result"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`rounded-lg px-4 py-2 text-sm font-black transition ${
              mode === value ? "bg-[#4f46e5] text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function buildSubjectRows(marks = {}) {
  return SUBJECTS.map((subject) => {
    const obtained = Number(marks[subject] || 0);
    return {
      subject,
      short: SUBJECT_SHORT[subject] || subject,
      total: 100,
      obtained,
      percentage: obtained,
      grade: gradeFromPercentage(obtained),
    };
  });
}

function ClassResultReport({ items = [], currentStudentId, className, term }) {
  const rows = useMemo(
    () =>
      items.map((item) => {
        const marksMap = item.payload?.marks || {};
        const marks = SUBJECTS.map((subject) => Number(marksMap[subject] || 0));
        const total = marks.reduce((sum, mark) => sum + mark, 0);
        return {
          id: item.student?._id || item._id,
          rollNo: item.student?.rollNumber || item.student?.admissionNo || "-",
          name: getStudentName(item.student || {}),
          marks,
          total,
        };
      }),
    [items]
  );

  const classAverage = useMemo(() => {
    if (!rows.length) return "0.00%";
    const total = rows.reduce((sum, row) => sum + row.total, 0);
    return pct(total / rows.length, 900);
  }, [rows]);

  return (
    <div className="pb-4">
      <div className="w-full rounded-xl border-[3px] border-[#06268a] bg-white p-1 text-slate-950 shadow-xl">
        <div className="rounded-t-lg bg-[#06268a] px-4 py-2 text-white">
          <div className="grid grid-cols-[70px_1fr_70px] items-center gap-3">
            <LogoMark />
            <div className="text-center">
              <h1 className="text-3xl font-black uppercase leading-none tracking-[0.08em] xl:text-4xl">Insaaf Grammer High School</h1>
              <div className="mx-auto mt-2 w-fit rounded-md border-2 border-white px-5 py-1 text-lg font-black uppercase leading-none xl:text-xl">
                Teacher Class Wise Result Report
              </div>
            </div>
            <LogoMark />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-2 px-4 py-3">
          <FieldLine label="Class" value={className || "-"} />
          <FieldLine label="Examination" value={term || "Examination"} />
          <FieldLine label="Academic Session" value="2024-2025" />
          <FieldLine label="Released Results" value={String(rows.length)} />
        </div>

        <table className="w-full table-fixed border-collapse text-center text-[11px]">
          <thead>
            <tr className="bg-[#06268a] text-white">
              <th rowSpan={2} className="w-[5.5%] border border-[#667bc1] px-1 py-1 font-black">
                ROLL
                <br />
                NO.
              </th>
              <th rowSpan={2} className="w-[13%] border border-[#667bc1] px-1 py-1 font-black">
                STUDENT NAME
              </th>
              <th colSpan={9} className="border border-[#667bc1] px-1 py-1 text-sm font-black">
                SUBJECTS MARKS (OUT OF 100)
              </th>
              <th rowSpan={2} className="w-[8%] border border-[#667bc1] px-1 py-1 font-black">
                TOTAL
                <br />
                (900)
              </th>
              <th rowSpan={2} className="w-[8%] border border-[#667bc1] px-1 py-1 font-black">
                PERCENT
                <br />
                (%)
              </th>
            </tr>
            <tr className="bg-[#06268a] text-white">
              {SUBJECTS.map((subject) => (
                <th key={subject} className="border border-[#667bc1] px-0.5 py-1 text-[10px] font-black leading-tight">
                  {SUBJECT_SHORT[subject] || subject}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const highlighted = sameId(row.id, currentStudentId);
              return (
                <tr key={row.id} className={highlighted ? "bg-[#fff5bf]" : "bg-white"}>
                  <td className="border border-[#667bc1] px-1 py-1 font-black">{row.rollNo}</td>
                  <td className={`border border-[#667bc1] px-1.5 py-1 text-left font-black ${highlighted ? "text-[#06268a]" : ""}`}>{row.name}</td>
                  {row.marks.map((mark, index) => (
                    <td key={`${row.id}-${SUBJECTS[index]}`} className="border border-[#667bc1] px-1 py-1 font-bold">
                      {mark}
                    </td>
                  ))}
                  <td className="border border-[#667bc1] px-1 py-1 font-black">{row.total}</td>
                  <td className="border border-[#667bc1] px-1 py-1 font-black">{pct(row.total, 900)}</td>
                </tr>
              );
            })}
            <tr className="bg-[#06268a] text-white">
              <td colSpan={11} className="border border-[#667bc1] px-4 py-1.5 text-left text-sm font-black uppercase">
                Class Overall Percentage
              </td>
              <td colSpan={2} className="border border-[#667bc1] px-4 py-1.5 text-sm font-black">
                {classAverage}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-20 px-8 py-3 text-center text-xs font-black uppercase text-[#06268a]">
          <div>
            <div className="mx-auto mb-1 h-px w-56 bg-[#06268a]" />
            Signature of Teacher
          </div>
          <div>
            <div className="mx-auto mb-1 h-px w-56 bg-[#06268a]" />
            Signature of Principal
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentResultCard({ document, user }) {
  const marks = document?.payload?.marks || {};
  const rows = buildSubjectRows(marks);
  const totalMarks = rows.reduce((sum, row) => sum + row.total, 0);
  const obtained = rows.reduce((sum, row) => sum + row.obtained, 0);
  const percentageValue = totalMarks ? (obtained / totalMarks) * 100 : 0;
  const overallGrade = gradeFromPercentage(percentageValue);
  const studentName = getStudentName(user);
  const className = `${user?.className || "-"}${user?.section ? ` ${user.section}` : ""}`;

  return (
    <div className="pb-4">
      <div className="w-full rounded-xl border-[3px] border-[#06268a] bg-white p-4 text-slate-950 shadow-xl">
        <div className="grid grid-cols-[70px_1fr_70px] items-start gap-3">
          <LogoMark />
          <div className="text-center text-[#06268a]">
            <h1 className="text-3xl font-black uppercase leading-none tracking-[0.06em] xl:text-4xl">Insaaf Grammer High School</h1>
            <div className="mx-auto mt-2 w-fit rounded-md bg-[#06268a] px-10 py-1 text-2xl font-black uppercase leading-none text-white">Result Card</div>
            <p className="mt-1 text-sm font-black uppercase">Academic Session: 2024-2025</p>
            <p className="mx-auto mt-1 w-fit rounded bg-[#06268a] px-5 py-0.5 text-xs font-black uppercase text-white">{document?.term || "Examination"}</p>
          </div>
          <LogoMark />
        </div>

        <div className="mt-3 rounded-lg border border-[#143597] px-4 py-2.5">
          <div className="grid grid-cols-2 gap-x-12 gap-y-2">
            <FieldLine label="Student Name" value={studentName} />
            <FieldLine label="Roll No." value={user?.rollNo || user?.rollNumber || "-"} />
            <FieldLine label="Father Name" value={getFatherName(user)} />
            <FieldLine label="Registration ID" value={user?.admissionNo || "-"} />
            <FieldLine label="Class" value={className} />
            <FieldLine label="Date of Result" value={formatResultDate(document?.releasedAt || document?.releaseAt)} />
          </div>
        </div>

        <table className="mt-2 w-full table-fixed border-collapse text-center text-xs">
          <thead className="bg-[#06268a] text-white">
            <tr>
              <th className="w-[10%] border border-[#667bc1] px-2 py-1.5 font-black">SR. NO.</th>
              <th className="w-[25%] border border-[#667bc1] px-2 py-1.5 font-black">SUBJECTS</th>
              <th className="border border-[#667bc1] px-2 py-1.5 font-black">TOTAL MARKS</th>
              <th className="border border-[#667bc1] px-2 py-1.5 font-black">MARKS OBTAINED</th>
              <th className="border border-[#667bc1] px-2 py-1.5 font-black">PERCENTAGE (%)</th>
              <th className="border border-[#667bc1] px-2 py-1.5 font-black">GRADE</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((subject, index) => (
              <tr key={subject.subject}>
                <td className="border border-[#9caae3] px-2 py-1.5 font-bold">{index + 1}</td>
                <td className="border border-[#9caae3] px-2 py-1.5 font-bold uppercase">{subject.subject}</td>
                <td className="border border-[#9caae3] px-2 py-1.5">{subject.total}</td>
                <td className="border border-[#9caae3] px-2 py-1.5">{subject.obtained}</td>
                <td className="border border-[#9caae3] px-2 py-1.5">{pct(subject.obtained, subject.total)}</td>
                <td className="border border-[#9caae3] px-2 py-1.5 font-bold">{subject.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="mt-2 w-full table-fixed border-collapse text-center text-xs">
          <thead>
            <tr className="bg-[#06268a] text-white">
              <th colSpan={5} className="border border-[#667bc1] px-3 py-1.5 text-sm font-black uppercase">
                Result Summary
              </th>
            </tr>
            <tr className="text-[#06268a]">
              <th className="border border-[#9caae3] px-2 py-1.5 font-black">TOTAL MARKS</th>
              <th className="border border-[#9caae3] px-2 py-1.5 font-black">TOTAL MARKS OBTAINED</th>
              <th className="border border-[#9caae3] px-2 py-1.5 font-black">OVERALL PERCENTAGE</th>
              <th className="border border-[#9caae3] px-2 py-1.5 font-black">OVERALL GRADE</th>
              <th className="border border-[#9caae3] px-2 py-1.5 font-black">RESULT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-[#9caae3] px-2 py-2 font-bold">{totalMarks}</td>
              <td className="border border-[#9caae3] px-2 py-2 font-bold">{obtained}</td>
              <td className="border border-[#9caae3] px-2 py-2 font-bold">{percentageValue.toFixed(2)}%</td>
              <td className="border border-[#9caae3] px-2 py-2 font-bold">{overallGrade}</td>
              <td className="border border-[#9caae3] px-2 py-2 font-bold">{overallGrade === "F" ? "FAIL" : "PASS"}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-5 grid grid-cols-2 gap-20 px-10 text-center text-xs font-black uppercase text-[#06268a]">
          <div>
            <div className="mx-auto mb-1 h-px w-44 bg-[#06268a]" />
            Principal
          </div>
          <div>
            <div className="mx-auto mb-1 h-px w-56 bg-[#06268a]" />
            Class Teacher Signature
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentResultsPage() {
  const user = useSelector((state) => state.auth.user);
  const [mode, setMode] = useState("student");
  const [loading, setLoading] = useState(true);
  const [myResult, setMyResult] = useState(null);
  const [classResult, setClassResult] = useState({ items: [], term: "", className: "", section: "" });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [mineRes, classRes] = await Promise.all([
          api.get("/academic-documents/my", { params: { documentType: "RESULT_CARD" } }),
          api.get("/academic-documents/my/class-result-cards"),
        ]);
        if (cancelled) return;
        setMyResult(mineRes.data?.data || null);
        setClassResult(classRes.data?.data || { items: [], term: "", className: "", section: "" });
      } catch {
        if (cancelled) return;
        setMyResult(null);
        setClassResult({ items: [], term: "", className: "", section: "" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?._id, user?.id]);

  const classLabel = `${classResult.className || user?.className || "-"}${classResult.section || user?.section ? ` ${classResult.section || user?.section}` : ""}`;
  const hasClassResults = Array.isArray(classResult.items) && classResult.items.length > 0;

  return (
    <section>
      <ResultToggle mode={mode} setMode={setMode} />

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">Loading results...</div>
      ) : mode === "class" ? (
        hasClassResults ? (
          <ClassResultReport
            items={classResult.items}
            currentStudentId={user?._id || user?.id}
            className={classLabel}
            term={classResult.term}
          />
        ) : (
          <WaitingReleaseState
            accent="indigo"
            title="Class result is not released yet"
            message="When your teacher releases result cards for the class, the class-wise result will appear here automatically."
          />
        )
      ) : myResult ? (
        <StudentResultCard document={myResult} user={user} />
      ) : (
        <WaitingReleaseState
          accent="indigo"
          title="Your result is not released yet"
          message="When your teacher releases your result card, it will appear here automatically. No dummy result is shown before release."
        />
      )}
    </section>
  );
}
