import { useCallback, useEffect, useState } from "react";
import api from "../../services/api/client";
import { SUBJECT_OPTIONS } from "../../constants/classes";
import ConfirmDialog from "../ui/ConfirmDialog";

function subjectSortIndex(subject) {
  const idx = SUBJECT_OPTIONS.indexOf(subject || "Class Teacher");
  return idx === -1 ? SUBJECT_OPTIONS.length : idx;
}

function formatAssignment(assignedClasses = []) {
  if (!assignedClasses.length) return "Not assigned";
  const groups = new Map();

  assignedClasses.forEach((row) => {
    const className = row.className || "";
    const section = row.section || "A";
    const key = `${className}|${section}`;
    if (!groups.has(key)) {
      groups.set(key, { className, section, subjects: [] });
    }
    const group = groups.get(key);
    if (row.subject && !group.subjects.includes(row.subject)) {
      group.subjects.push(row.subject);
    }
  });

  return [...groups.values()]
    .map((group) => {
      const subjects = group.subjects.sort((a, b) => subjectSortIndex(a) - subjectSortIndex(b));
      return `${group.className} ${group.section}, ${subjects.join(", ") || "Class Teacher"}`;
    })
    .join(" | ");
}

export default function TeacherRemoveModal({ dark = false, onRemoved }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [pendingTeacher, setPendingTeacher] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/teachers", { params: { page: 1, limit: 100 } });
      setRows(data.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load teachers");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const confirmRemove = async () => {
    if (!pendingTeacher) return;

    const teacher = pendingTeacher;
    setRemovingId(teacher._id);
    setError("");
    try {
      await api.delete(`/teachers/${teacher._id}`);
      setRows((prev) => prev.filter((row) => row._id !== teacher._id));
      setPendingTeacher(null);
      onRemoved?.(teacher.fullName);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove teacher");
    } finally {
      setRemovingId(null);
    }
  };

  const filtered = rows.filter((teacher) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return teacher.fullName?.toLowerCase().includes(q) || teacher.email?.toLowerCase().includes(q);
  });

  const thClass = dark
    ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e]"
    : "border-slate-100 bg-slate-50/80 text-slate-500";

  return (
    <div className="space-y-4">
      <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
        Remove a teacher from school. Their account will be deactivated and removed from this list.
      </p>

      <input
        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none ${
          dark
            ? "border-white/[0.06] bg-[#1a1b26] text-white placeholder:text-[#9e9e9e] focus:border-[#7c4dff]/40"
            : "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-indigo-400"
        }`}
        placeholder="Search teacher by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
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
        <p className={`py-8 text-center text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Loading teachers...</p>
      ) : !filtered.length ? (
        <p className={`py-8 text-center text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
          {rows.length ? "No teachers match your search." : "No teachers to remove."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl">
          <table className="min-w-full text-sm">
            <thead>
              <tr className={`border-b text-left text-[11px] font-semibold uppercase tracking-wider ${thClass}`}>
                <th className="px-4 py-3">Teacher Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Assigned Class</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((teacher) => (
                <tr
                  key={teacher._id}
                  className={dark ? "border-b border-white/[0.06]" : "border-b border-slate-100"}
                >
                  <td className={`px-4 py-3 font-medium ${dark ? "text-white" : "text-slate-800"}`}>
                    {teacher.fullName}
                  </td>
                  <td className={`px-4 py-3 ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>{teacher.email}</td>
                  <td className={`px-4 py-3 ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>
                    {formatAssignment(teacher.assignedClasses)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={removingId === teacher._id}
                      onClick={() => setPendingTeacher(teacher)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                        dark
                          ? "border-[#e91e63]/30 bg-[#e91e63]/10 text-[#e91e63] hover:bg-[#e91e63]/15"
                          : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                      }`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 11h-6" />
                      </svg>
                      {removingId === teacher._id ? "Removing..." : "Remove"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingTeacher)}
        dark={dark}
        danger
        title="Remove teacher from school?"
        message={
          pendingTeacher
            ? `Remove ${pendingTeacher.fullName} from school? This will deactivate their account and remove class assignments.`
            : ""
        }
        confirmLabel="Yes, Remove"
        cancelLabel="Cancel"
        loading={Boolean(removingId)}
        onCancel={() => {
          if (!removingId) setPendingTeacher(null);
        }}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
