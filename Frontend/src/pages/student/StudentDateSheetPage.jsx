import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../../services/api/client";
import WaitingReleaseState from "../../components/ui/WaitingReleaseState";

export default function StudentDateSheetPage({ dark = false }) {
  const user = useSelector((state) => state.auth.user);
  const [dateSheet, setDateSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const studentName = user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Student";
  const className = `${user?.className || "-"} ${user?.section || ""}`.trim();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/academic-documents/my", {
          params: { documentType: "DATE_SHEET" },
        });
        if (!cancelled) setDateSheet(data.data || null);
      } catch {
        if (!cancelled) setDateSheet(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?._id, user?.id]);

  const rows = Array.isArray(dateSheet?.payload?.rows) ? dateSheet.payload.rows : [];

  return (
    <section className="space-y-6 py-5">
      <div className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-violet-50 p-6 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-500">Date Sheet</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className={`text-3xl font-black ${dark ? "text-white" : "text-slate-950"}`}>Released Date Sheet</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {studentName} - {className}
            </p>
          </div>
          <div className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-sky-600 shadow-sm">{dateSheet ? "Released" : "Waiting for release"}</div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">Loading date sheet...</div>
      ) : dateSheet ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase text-slate-500">{dateSheet.term || "Exam"}</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3">Sr.</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Day</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.subject}-${index}`} className="border-t border-slate-100">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3 font-semibold">{row.subject}</td>
                    <td className="px-4 py-3">{row.day}</td>
                    <td className="px-4 py-3">{row.dateLabel || row.date}</td>
                    <td className="px-4 py-3">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <WaitingReleaseState
          accent="sky"
          title="Date sheet is not released yet"
          message="When the teacher creates and releases the date sheet, it will automatically appear here for this student portal."
        />
      )}
    </section>
  );
}
