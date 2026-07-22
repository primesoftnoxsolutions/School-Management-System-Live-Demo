import { useCallback, useEffect, useState } from "react";
import api from "../../services/api/client";
import ModernDatePicker from "../ui/ModernDatePicker";

function toDateInputValue(date = new Date()) {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function getAssignmentColumns(assignedClasses = []) {
  if (!assignedClasses.length) {
    return { className: "—", section: "—" };
  }

  const classNames = [...new Set(assignedClasses.map((row) => row.className).filter(Boolean))];
  const sections = [...new Set(assignedClasses.map((row) => row.section || "A").filter(Boolean))];

  return {
    className: classNames.join(", ") || "—",
    section: sections.join(", ") || "—",
  };
}

function AttendanceActionButton({ label, tone, active, disabled, onClick, dark }) {
  const tones = {
    present: active
      ? dark
        ? "border-[#4caf50]/40 bg-[#4caf50]/20 text-[#4caf50]"
        : "border-emerald-300 bg-emerald-100 text-emerald-800"
      : dark
        ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e] hover:border-[#4caf50]/30 hover:text-[#4caf50]"
        : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700",
    absent: active
      ? dark
        ? "border-[#e91e63]/40 bg-[#e91e63]/20 text-[#e91e63]"
        : "border-rose-300 bg-rose-100 text-rose-800"
      : dark
        ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e] hover:border-[#e91e63]/30 hover:text-[#e91e63]"
        : "border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:text-rose-700",
    leave: active
      ? dark
        ? "border-[#26a69a]/40 bg-[#26a69a]/20 text-[#26a69a]"
        : "border-sky-300 bg-sky-100 text-sky-800"
      : dark
        ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e] hover:border-[#26a69a]/30 hover:text-[#26a69a]"
        : "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex shrink-0 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${tones[tone]}`}
    >
      {label}
    </button>
  );
}

export default function TeacherAttendanceModal({
  dark = false,
  date,
  onDateChange,
  onAttendanceChange,
  refreshKey = 0,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState(null);
  const [error, setError] = useState("");
  const today = toDateInputValue();

  const loadRows = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    setError("");
    try {
      const [teachersRes, attendanceRes] = await Promise.all([
        api.get("/teachers", { params: { page: 1, limit: 100 } }),
        api.get("/teacher-attendance", { params: { date } }),
      ]);

      const teachers = teachersRes.data?.data?.items || [];
      const attendanceItems = attendanceRes.data?.data?.items || [];
      const statusMap = new Map(
        attendanceItems.map((item) => [
          String(item.teacherId),
          { status: item.status, source: item.source || null },
        ])
      );

      setRows(
        teachers.map((teacher) => {
          const marked = statusMap.get(String(teacher._id));
          return {
            teacherId: teacher._id,
            fullName: teacher.fullName,
            isActive: teacher.isActive !== false,
            status: marked?.status || "UNMARKED",
            source: marked?.source || null,
            ...getAssignmentColumns(teacher.assignedClasses),
          };
        })
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load teacher attendance");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadRows();
  }, [loadRows, refreshKey]);

  const markAttendance = async (teacherId, status) => {
    setMarkingId(teacherId);
    setError("");
    try {
      await api.post("/teacher-attendance/mark", {
        teacherId,
        status,
        date,
      });
      setRows((prev) =>
        prev.map((row) =>
          row.teacherId === teacherId ? { ...row, status, source: "ADMIN" } : row
        )
      );
      onAttendanceChange?.();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark attendance");
      await loadRows();
    } finally {
      setMarkingId(null);
    }
  };

  const thClass = dark
    ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e]"
    : "border-slate-100 bg-slate-50/80 text-slate-500";

  return (
    <div className="space-y-4">
      <ModernDatePicker
        label="Attendance date"
        value={date}
        max={today}
        dark={dark}
        onChange={onDateChange}
      />

      {error ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            dark ? "border-[#e91e63]/30 bg-[#e91e63]/10 text-[#e91e63]" : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className={`py-8 text-center text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
          Loading teachers...
        </p>
      ) : !rows.length ? (
        <p className={`py-8 text-center text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
          No teachers found. Create teachers first.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-transparent">
          <table className="min-w-full text-sm">
            <thead>
              <tr className={`border-b text-left text-[11px] font-semibold uppercase tracking-wider ${thClass}`}>
                <th className="px-4 py-3">Teacher Name</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isMarking = markingId === row.teacherId;
                const lockedByTeacher = row.source === "TEACHER";
                const canMark = row.isActive && !lockedByTeacher && !isMarking;

                return (
                  <tr
                    key={row.teacherId}
                    className={dark ? "border-b border-white/[0.06]" : "border-b border-slate-100"}
                  >
                    <td className={`px-4 py-3 font-medium ${dark ? "text-white" : "text-slate-800"}`}>
                      {row.fullName}
                      {!row.isActive ? (
                        <span className={`ml-2 text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-400"}`}>
                          (Inactive)
                        </span>
                      ) : null}
                      {lockedByTeacher ? (
                        <span className={`ml-2 text-xs ${dark ? "text-amber-300" : "text-amber-600"}`}>
                          Marked by teacher
                        </span>
                      ) : null}
                    </td>
                    <td className={`px-4 py-3 ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>{row.className}</td>
                    <td className={`px-4 py-3 ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>{row.section}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-nowrap justify-end gap-2 overflow-x-auto">
                        <AttendanceActionButton
                          label="Present"
                          tone="present"
                          dark={dark}
                          active={row.status === "PRESENT" || row.status === "LATE"}
                          disabled={!canMark}
                          onClick={() => markAttendance(row.teacherId, "PRESENT")}
                        />
                        <AttendanceActionButton
                          label="Absent"
                          tone="absent"
                          dark={dark}
                          active={row.status === "ABSENT"}
                          disabled={!canMark}
                          onClick={() => markAttendance(row.teacherId, "ABSENT")}
                        />
                        <AttendanceActionButton
                          label="On Leave"
                          tone="leave"
                          dark={dark}
                          active={row.status === "LEAVE"}
                          disabled={!canMark}
                          onClick={() => markAttendance(row.teacherId, "LEAVE")}
                        />
                      </div>
                      {isMarking ? (
                        <p className={`mt-1 text-right text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-400"}`}>
                          Saving...
                        </p>
                      ) : lockedByTeacher ? (
                        <p className={`mt-1 text-right text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-400"}`}>
                          Locked — teacher already marked
                        </p>
                      ) : !row.isActive ? (
                        <p className={`mt-1 text-right text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-400"}`}>
                          Inactive teacher
                        </p>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
