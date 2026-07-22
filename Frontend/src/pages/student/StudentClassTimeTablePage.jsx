import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import api from "../../services/api/client";
import {
  extractSubjectFromCell,
  normalizeTimeTableForLookup,
  toTimeTableClassColumn,
} from "../../super-admin/constants/timeTable";

function parseTeacherFromCell(cellValue) {
  const raw = String(cellValue || "").trim();
  if (!raw) return "";
  const match = /^(.*?)\s*\([^)]+\)\s*$/.exec(raw);
  return match?.[1]?.trim() || "";
}

export default function StudentClassTimeTablePage({ dark = false }) {
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeTable, setTimeTable] = useState(null);

  const className = user?.className || user?.class || "";
  const section = user?.section || "A";
  const branch = user?.branch === "Girls" ? "Girls" : "Boys";
  const column = toTimeTableClassColumn(className);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/timetables", { params: { branch } });
        if (cancelled) return;
        setTimeTable(normalizeTimeTableForLookup(data.data));
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Failed to load class time table");
          setTimeTable(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [branch]);

  const rows = useMemo(() => {
    if (!timeTable || !column) return [];
    const classTeacher = String(timeTable.classTeachers?.[column] || "").trim();
    return (timeTable.periods || [])
      .map((period) => {
        const cell = String(period.assignments?.[column] || "").trim();
        if (!cell) return null;
        return {
          number: period.number,
          start: period.start,
          end: period.end,
          subject: extractSubjectFromCell(cell) || cell,
          teacher: parseTeacherFromCell(cell) || classTeacher || "—",
        };
      })
      .filter(Boolean);
  }, [timeTable, column]);

  const pageClass = dark ? "text-white" : "text-slate-900";
  const muted = dark ? "text-[#9e9e9e]" : "text-slate-500";
  const panel = dark ? "border-white/[0.08] bg-[#161722]" : "border-slate-200 bg-white";

  return (
    <section className="space-y-5">
      <div>
        <h2 className={`text-2xl font-bold ${pageClass}`}>Class Time Table</h2>
        <p className={`mt-1 text-sm ${muted}`}>
          {className || "Class"} - {section} · {branch} Campus
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      {loading ? (
        <div className={`rounded-2xl border px-4 py-10 text-center text-sm ${panel} ${muted}`}>Loading time table...</div>
      ) : !timeTable ? (
        <div className={`rounded-2xl border px-4 py-10 text-center text-sm ${panel} ${muted}`}>
          No saved time table found for your campus yet.
        </div>
      ) : !column ? (
        <div className={`rounded-2xl border px-4 py-10 text-center text-sm ${panel} ${muted}`}>
          Your class is not mapped to the campus time table grid.
        </div>
      ) : !rows.length ? (
        <div className={`rounded-2xl border px-4 py-10 text-center text-sm ${panel} ${muted}`}>
          No lectures scheduled for your class yet.
        </div>
      ) : (
        <div className={`overflow-hidden rounded-2xl border ${panel}`}>
          <table className="min-w-full text-sm">
            <thead className={dark ? "bg-[#102a5c] text-white" : "bg-[#0b3a8d] text-white"}>
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Lecture</th>
                <th className="px-4 py-3 text-left font-semibold">Time</th>
                <th className="px-4 py-3 text-left font-semibold">Subject</th>
                <th className="px-4 py-3 text-left font-semibold">Teacher</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.number} className={dark ? "border-t border-white/[0.06]" : "border-t border-slate-200"}>
                  <td className={`px-4 py-3 font-semibold ${pageClass}`}>{row.number}</td>
                  <td className={`px-4 py-3 ${muted}`}>
                    {row.start} - {row.end}
                  </td>
                  <td className={`px-4 py-3 ${pageClass}`}>{row.subject}</td>
                  <td className={`px-4 py-3 ${muted}`}>{row.teacher}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
