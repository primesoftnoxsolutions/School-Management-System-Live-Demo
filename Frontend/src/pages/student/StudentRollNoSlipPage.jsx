import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../../services/api/client";
import WaitingReleaseState from "../../components/ui/WaitingReleaseState";
import { resolveStudentPhotoUrl } from "../../utils/mediaUrl";

function SchoolBadge() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-700 shadow-[0_6px_14px_rgba(0,0,0,0.16)]">
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
    <div className="grid grid-cols-[6.5rem_0.5rem_minmax(0,1fr)] items-center gap-1 text-[11px] font-bold text-blue-950">
      <span>{label}</span>
      <span>:</span>
      <span className="min-h-5 truncate border-b border-blue-400 px-1.5 text-slate-950">{value || ""}</span>
    </div>
  );
}

function ReleasedRollSlipCard({ document, user }) {
  const rows = Array.isArray(document?.payload?.rows) ? document.payload.rows : [];
  const photoUrl = resolveStudentPhotoUrl(user?.studentPhotoUrl || user?.photoUrl);
  const studentName = user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Student";
  const fatherName = user?.fatherName || user?.guardianName || "";
  const rollNo = user?.rollNumber || user?.rollNo || "-";
  const classLabel = `${user?.className || "-"} - ${user?.section || "A"}`;

  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-lg border-2 border-blue-700 bg-white shadow-[0_10px_28px_rgba(37,99,235,0.12)]">
      <div className="bg-blue-800 px-3 py-2 text-white">
        <div className="grid grid-cols-[3rem_1fr_3rem] items-center gap-2">
          <SchoolBadge />
          <div className="text-center">
            <h3 className="text-lg font-black uppercase leading-none tracking-wide sm:text-xl">Insaaf Grammer High School</h3>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em]">Roll No. Slip</p>
          </div>
          <SchoolBadge />
        </div>
      </div>

      <div className="px-3 py-3">
        <div className="grid items-start gap-3 md:grid-cols-[minmax(0,1fr)_4.5rem]">
          <div className="grid gap-x-4 gap-y-1 md:grid-cols-2">
            <div className="space-y-1">
              <SlipField label="Roll No." value={rollNo} />
              <SlipField label="Student Name" value={studentName} />
              <SlipField label="Father Name" value={fatherName} />
              <SlipField label="Class" value={classLabel} />
            </div>
            <div className="space-y-1">
              <SlipField label="Registration ID" value={user?.admissionNo || "-"} />
              <SlipField label="Exam Starts" value={rows[0]?.dateLabel || rows[0]?.date || ""} />
              <SlipField label="Term" value={document?.term || document?.payload?.term || "Examination"} />
            </div>
          </div>
          <div className="flex h-16 w-16 items-center justify-center justify-self-end overflow-hidden rounded border border-blue-600 bg-white text-center text-[9px] font-black uppercase text-blue-800">
            {photoUrl ? <img src={photoUrl} alt="Candidate" className="h-full w-full object-cover" /> : <span>Candidate<br />Photo</span>}
          </div>
        </div>

        <div className="mt-3 overflow-hidden rounded-md border border-blue-400">
          <div className="bg-blue-800 py-0.5 text-center text-xs font-black uppercase text-white">Date Sheet</div>
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
                <tr key={`${row.subject}-${index}`}>
                  <td className="border border-blue-300 px-1 py-0.5 font-bold">{index + 1}.</td>
                  <td className="border border-blue-300 px-1 py-0.5 font-semibold uppercase">{row.subject}</td>
                  <td className="border border-blue-300 px-1 py-0.5 uppercase">{row.day}</td>
                  <td className="border border-blue-300 px-1 py-0.5 uppercase">{row.dateLabel || row.date}</td>
                  <td className="border border-blue-300 px-1 py-0.5">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 grid items-end gap-3 text-[10px] font-bold text-blue-950 md:grid-cols-[1fr_9rem_9rem]">
          <div className="rounded-md border border-blue-300 p-2">
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
            <div className="mb-1 border-b border-blue-900 pb-3" />
            Teacher Signature
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentRollNoSlipPage({ dark = false }) {
  const user = useSelector((state) => state.auth.user);
  const [rollNoSlip, setRollNoSlip] = useState(null);
  const [loading, setLoading] = useState(true);
  const studentName = user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Student";
  const className = `${user?.className || "-"} ${user?.section || ""}`.trim();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/academic-documents/my", {
          params: { documentType: "ROLL_SLIP" },
        });
        if (!cancelled) setRollNoSlip(data.data || null);
      } catch {
        if (!cancelled) setRollNoSlip(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?._id, user?.id]);

  return (
    <section className="space-y-6 py-5">
      <div className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-amber-50 p-6 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-violet-500">Roll No Slip</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className={`text-3xl font-black ${dark ? "text-white" : "text-slate-950"}`}>Released Roll No Slip</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {studentName} - {className}
            </p>
          </div>
          <div className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-violet-600 shadow-sm">{rollNoSlip ? "Released" : "Waiting for release"}</div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">Loading roll no slip...</div>
      ) : rollNoSlip ? (
        <ReleasedRollSlipCard document={rollNoSlip} user={user} />
      ) : (
        <WaitingReleaseState
          accent="violet"
          title="Roll no slip is not released yet"
          message="When the teacher creates and releases roll no slips, this student's slip will automatically appear here."
        />
      )}
    </section>
  );
}
