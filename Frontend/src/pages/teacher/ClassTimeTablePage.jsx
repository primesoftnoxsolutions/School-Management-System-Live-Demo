import { Fragment, useEffect, useMemo, useState } from "react";
import api from "../../services/api/client";
import ScrollableSelect from "../../components/ui/ScrollableSelect";
import {
  DEFAULT_BREAK,
  extractSubjectFromCell,
  normalizeTimeTableForLookup,
  toTimeTableClassColumn,
} from "../../super-admin/constants/timeTable";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

function SchoolBadge() {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-blue-700 shadow-sm">
      <svg viewBox="0 0 64 64" className="h-14 w-14" fill="none" aria-hidden="true">
        <path d="M32 5 52 12v17c0 13-8.4 23.2-20 29C20.4 52.2 12 42 12 29V12l20-7Z" fill="#ffffff" stroke="#0b55c8" strokeWidth="2.4" />
        <path d="M32 12 46 17v12c0 8.6-5.8 16.2-14 21-8.2-4.8-14-12.4-14-21V17l14-5Z" fill="#eff6ff" stroke="#0b55c8" strokeWidth="1.8" />
        <path d="M24 27c0-2.2 1.8-4 4-4h8c2.2 0 4 1.8 4 4v12H24V27Z" fill="#0b55c8" />
        <path d="M28 29h8M28 34h8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        <path d="M18 43c-2.4-2-4.1-5-5-8M46 43c2.4-2 4.1-5 5-8" stroke="#0b55c8" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function namesMatch(a, b) {
  const left = String(a || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const right = String(b || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (!left || !right) return false;
  if (left === right) return true;
  // Match first+last when middle names differ
  const leftParts = left.split(" ").filter(Boolean);
  const rightParts = right.split(" ").filter(Boolean);
  if (leftParts.length >= 2 && rightParts.length >= 2) {
    if (leftParts[0] === rightParts[0] && leftParts[leftParts.length - 1] === rightParts[rightParts.length - 1]) {
      return true;
    }
  }
  return left.includes(right) || right.includes(left);
}

function cellMentionsTeacher(cellValue, teacherName) {
  const cell = String(cellValue || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const name = String(teacherName || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (!cell || !name) return false;
  if (cell.includes(name)) return true;
  const parts = name.split(" ").filter((part) => part.length > 2);
  if (parts.length >= 2) {
    return parts.every((part) => cell.includes(part));
  }
  return false;
}

function buildTeacherCampusGrid({ timeTable, teacherName, classColumns }) {
  const periods = timeTable?.periods || [];
  return periods.map((period) => {
    const matches = classColumns
      .map((col) => {
        const headerTeacher = String(timeTable.classTeachers?.[col] || "").trim();
        const cellValue = String(period.assignments?.[col] || "").trim();
        const isHeaderMatch = namesMatch(headerTeacher, teacherName);
        const isCellMatch = cellMentionsTeacher(cellValue, teacherName);
        if (!isHeaderMatch && !isCellMatch) return null;
        if (!cellValue && !isHeaderMatch) return null;

        const subject = extractSubjectFromCell(cellValue) || (isHeaderMatch ? "Class Teacher" : cellValue);
        const displayTeacher = isCellMatch
          ? teacherName
          : headerTeacher || teacherName;

        return {
          classColumn: col,
          subject,
          teacher: displayTeacher,
          raw: cellValue,
        };
      })
      .filter(Boolean);

    return {
      number: period.number,
      start: period.start,
      end: period.end,
      matches,
    };
  });
}

export default function ClassTimeTablePage({ dark = false }) {
  const [teacherName, setTeacherName] = useState("");
  const [branch, setBranch] = useState("Boys");
  const [timeTable, setTimeTable] = useState(null);
  const [classOptions, setClassOptions] = useState([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let resolvedBranch = "Boys";

    const loadMeta = async () => {
      setLoading(true);
      setError("");
      try {
        const [panelRes, classesRes] = await Promise.all([
          api.get("/teachers/my-panel"),
          api.get("/teacher-panel/classes", { params: { page: 1, limit: 100 } }),
        ]);
        if (cancelled) return;

        const panel = panelRes.data?.data || {};
        const name = panel?.teacher?.fullName || "";
        setTeacherName(name);

        const classItems = classesRes.data?.data?.items || [];
        const branchFromPanel = panel?.branch === "Girls" || panel?.branch === "Boys" ? panel.branch : "";
        const branchFromClass = classItems.find((item) => item.branch === "Boys" || item.branch === "Girls")?.branch;
        resolvedBranch = branchFromPanel || branchFromClass || "Boys";
        setBranch(resolvedBranch);

        const seen = new Set();
        const options = [];
        classItems.forEach((item) => {
          const key = `${item.className}__${item.section || "A"}`;
          if (!seen.has(key)) {
            seen.add(key);
            options.push({
              key,
              className: item.className,
              section: item.section || "A",
              column: toTimeTableClassColumn(item.className),
            });
          }
        });
        setClassOptions(options);
        if (!options.length) {
          setError("No classes assigned. Ask Super Admin to assign a class first.");
        }

        const { data } = await api.get("/timetables", { params: { branch: resolvedBranch } });
        if (cancelled) return;
        setTimeTable(normalizeTimeTableForLookup(data?.data));
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || "Failed to load class timetable");
        setTimeTable(null);
        setClassOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const refreshTimetable = async () => {
      try {
        const { data } = await api.get("/timetables", { params: { branch: resolvedBranch } });
        if (cancelled) return;
        setTimeTable(normalizeTimeTableForLookup(data?.data));
      } catch {
        // silent poll — keep last good grid
      }
    };

    loadMeta();
    const poll = window.setInterval(refreshTimetable, 5000);
    const onFocus = () => refreshTimetable();
    window.addEventListener("focus", onFocus);
    const onVisibility = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (!selectedKey && classOptions.length) {
      setSelectedKey(classOptions[0].key);
    }
  }, [classOptions, selectedKey]);

  const selectedClass = classOptions.find((option) => option.key === selectedKey) || null;

  const relevantColumns = useMemo(() => {
    if (!timeTable) return [];
    const fromAssignments = classOptions.map((option) => option.column).filter(Boolean);
    const fromMatches = Object.keys(timeTable.classTeachers || {}).filter((col) => {
      const header = timeTable.classTeachers[col];
      if (namesMatch(header, teacherName)) return true;
      return (timeTable.periods || []).some((period) => cellMentionsTeacher(period.assignments?.[col], teacherName));
    });
    return [...new Set([...fromAssignments, ...fromMatches])];
  }, [timeTable, classOptions, teacherName]);

  const grid = useMemo(() => {
    if (!timeTable) return [];
    return buildTeacherCampusGrid({
      timeTable,
      teacherName,
      classColumns: relevantColumns.length ? relevantColumns : selectedClass?.column ? [selectedClass.column] : [],
    });
  }, [timeTable, teacherName, relevantColumns, selectedClass]);

  const breakAfter = Number(timeTable?.breakTime?.afterPeriod || DEFAULT_BREAK.afterPeriod);
  const breakLabel = timeTable?.breakTime?.label || DEFAULT_BREAK.label;
  const breakStart = timeTable?.breakTime?.start || DEFAULT_BREAK.start;
  const breakEnd = timeTable?.breakTime?.end || DEFAULT_BREAK.end;

  const filteredByClass = useMemo(() => {
    if (!selectedClass?.column) return grid;
    return grid.map((period) => ({
      ...period,
      matches: (period.matches || []).filter((item) => item.classColumn === selectedClass.column),
    }));
  }, [grid, selectedClass]);

  if (loading) {
    return <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Loading class timetable...</p>;
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>Class Time Table</h2>
          <p className={`mt-1 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
            Campus timetable for {branch} Campus — your assigned classes and periods.
          </p>
        </div>

        <div className="min-w-[220px]">
          <ScrollableSelect
            label="Class"
            placeholder="No class assigned"
            value={selectedKey}
            options={classOptions.map((option) => ({
              value: option.key,
              label: `${option.className} - Section ${option.section}`,
            }))}
            onChange={setSelectedKey}
            dark={dark}
            portal
          />
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {!timeTable ? (
        <div className={`rounded-xl border px-4 py-8 text-center text-sm font-semibold ${dark ? "border-white/10 text-[#9e9e9e]" : "border-slate-200 text-slate-500"}`}>
          No saved campus timetable yet. Ask admin to save the Time Table for {branch} campus.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border-4 border-blue-600 bg-white shadow-[0_18px_44px_rgba(37,99,235,0.14)]">
          <div className="relative overflow-hidden border-2 border-white bg-white">
            <div className="pointer-events-none absolute left-0 top-0 h-28 w-64 rounded-br-[100%] bg-blue-600" />
            <div className="pointer-events-none absolute left-4 top-2 h-24 w-80 rounded-br-[100%] border-t-4 border-white" />
            <div className="pointer-events-none absolute right-0 top-0 h-28 w-64 rounded-bl-[100%] bg-blue-600" />
            <div className="pointer-events-none absolute right-4 top-2 h-24 w-80 rounded-bl-[100%] border-t-4 border-white" />

            <div className="relative z-10 grid grid-cols-[5rem_1fr_5rem] items-start gap-4 px-5 pt-3">
              <SchoolBadge />
              <div className="text-center">
                <h3 className="text-4xl font-black uppercase leading-none tracking-wide text-blue-950">
                  Teacher Wise Class Timetable
                </h3>
                <div className="mx-auto mt-2 max-w-xs bg-blue-700 px-6 py-1 text-2xl font-black uppercase text-white [clip-path:polygon(8%_0,92%_0,100%_100%,0_100%)]">
                  Class: {selectedClass ? selectedClass.className : "-"}
                </div>
                <div className="mt-2 flex items-center justify-center gap-3 text-sm font-extrabold text-white">
                  <span className="h-1 w-24 rounded-full bg-blue-700" />
                  <span className="rounded-md bg-blue-700 px-8 py-1">
                    Class Teacher Incharge: {teacherName || "Teacher"}
                  </span>
                  <span className="h-1 w-24 rounded-full bg-blue-700" />
                </div>
              </div>
              <div />
            </div>

            <div className="relative z-10 px-3 pb-5 pt-3">
              <table className="w-full table-fixed border-collapse text-center text-blue-950">
                <thead>
                  <tr className="bg-blue-800 text-white">
                    <th className="w-[9%] border border-blue-400 px-2 py-3 text-sm font-black uppercase">Period</th>
                    <th className="w-[14%] border border-blue-400 px-2 py-3 text-sm font-black uppercase">Time</th>
                    {DAYS.map((day) => (
                      <th key={day} className="border border-blue-400 px-2 py-3 text-sm font-black uppercase">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredByClass.map((period) => {
                    const cell = period.matches?.[0] || null;
                    return (
                      <Fragment key={period.number}>
                        {Number(period.number) === Number(breakAfter) + 1 ? (
                          <tr key={`break-${period.number}`} className="bg-blue-50">
                            <td colSpan={8} className="border border-blue-300 px-3 py-2 text-xl font-black uppercase text-blue-800">
                              {breakLabel} {breakStart} - {breakEnd}
                            </td>
                          </tr>
                        ) : null}
                        <tr className="h-[72px]">
                          <td className="border border-blue-300 bg-blue-50 px-2 py-2 text-2xl font-black text-blue-700">
                            {period.number}
                          </td>
                          <td className="border border-blue-300 px-2 py-2 text-sm font-black">
                            {period.start} - {period.end}
                          </td>
                          {DAYS.map((day) => (
                            <td key={`${period.number}-${day}`} className="border border-blue-300 px-2 py-2 align-middle">
                              {cell ? (
                                <div className="space-y-1">
                                  <p className="text-sm font-black leading-tight">{cell.subject}</p>
                                  <p className="text-[11px] font-bold leading-tight text-blue-700">{cell.classColumn}</p>
                                </div>
                              ) : (
                                <span className="text-xl font-black text-blue-950">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>

              <div className="mx-auto mt-5 flex max-w-xl items-center justify-center rounded-md border border-blue-200 bg-white px-4 py-3 text-center text-sm font-semibold text-blue-950">
                Note: Schedule is synced from the admin campus Time Table ({branch}).
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
