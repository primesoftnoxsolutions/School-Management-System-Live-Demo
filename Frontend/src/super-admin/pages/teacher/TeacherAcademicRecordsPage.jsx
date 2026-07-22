import { useEffect, useState } from "react";
import api from "../../services/api/client";
import AppointmentLetterModal from "../../components/teachers/AppointmentLetterModal";

const emptyForm = {
  studentId: "",
  className: "",
  section: "A",
  subject: "",
  examType: "",
  marks: "",
  maxMarks: "100",
  grade: "",
  remarks: "",
};

export default function TeacherAcademicRecordsPage({ dark = false }) {
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [items, setItems] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [showAppointmentLetter, setShowAppointmentLetter] = useState(false);

  const loadClasses = async () => {
    try {
      const { data } = await api.get("/teacher-panel/class-options");
      setClassOptions(data.data || []);
    } catch {
      setClassOptions([]);
    }
  };

  const loadStudents = async (className, section) => {
    if (!className) {
      setStudents([]);
      return;
    }
    try {
      const { data } = await api.get("/teacher-panel/students", {
        params: { className, section: section || "A" },
      });
      setStudents(data.data || []);
    } catch {
      setStudents([]);
    }
  };

  const load = async (nextPage = page, nextSearch = search) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/teacher-panel/academic-records", {
        params: { page: nextPage, limit: 10, search: nextSearch },
      });
      setItems(data.data.items || []);
      setPagination({ totalPages: data.data.totalPages || 1, total: data.data.total || 0 });
      setPage(data.data.page || nextPage);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load academic records");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
    load(1, "");
  }, []);

  useEffect(() => {
    loadStudents(form.className, form.section);
  }, [form.className, form.section]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
  };

  const onClassSelect = (value) => {
    const selected = classOptions.find((c) => c._id === value);
    if (selected) {
      setForm({
        ...form,
        className: selected.className,
        section: selected.section || "A",
        subject: selected.subject,
        studentId: "",
      });
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, marks: Number(form.marks), maxMarks: Number(form.maxMarks) };
      if (editId) {
        await api.put(`/teacher-panel/academic-records/${editId}`, payload);
      } else {
        await api.post("/teacher-panel/academic-records", payload);
      }
      resetForm();
      await load(1, search);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save academic record");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (item) => {
    setEditId(item._id);
    setForm({
      studentId: item.studentId?._id || item.studentId,
      className: item.className,
      section: item.section || "A",
      subject: item.subject,
      examType: item.examType,
      marks: String(item.marks),
      maxMarks: String(item.maxMarks),
      grade: item.grade || "",
      remarks: item.remarks || "",
    });
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this academic record?")) return;
    try {
      await api.delete(`/teacher-panel/academic-records/${id}`);
      if (editId === id) resetForm();
      await load(page, search);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete record");
    }
  };

  const cardClass = dark ? "rounded-2xl border border-white/[0.06] bg-[#161722]" : "ref-card";
  const inputClass = dark
    ? "w-full rounded-xl border border-white/[0.08] bg-[#1a1b26] px-3 py-2.5 text-sm text-white outline-none focus:border-[#7c4dff]/50"
    : "ref-input";
  const tableHeadClass = dark ? "bg-[#1a1b26] text-left text-[#9e9e9e]" : "bg-slate-50 text-left text-slate-500";
  const tableCellClass = dark ? "text-white" : "text-slate-700";
  const mutedClass = dark ? "text-[#9e9e9e]" : "text-slate-500";
  const borderClass = dark ? "border-white/[0.06]" : "border-slate-100";
  const primaryBtnClass = dark
    ? "rounded-xl bg-[#7c4dff] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#875cff] disabled:opacity-60"
    : "ref-btn-primary";
  const outlineBtnClass = dark
    ? "rounded-xl border border-white/[0.08] bg-transparent px-4 py-2.5 text-sm font-medium text-[#d7d2ff] hover:bg-white/[0.04]"
    : "ref-btn-outline";
  const dangerBtnClass = dark
    ? "rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/15"
    : "ref-btn-danger";

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={`text-2xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>Academic</h2>
          <p className={`text-sm ${mutedClass}`}>Add, edit and manage student marks and grades.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAppointmentLetter(true)}
          className={primaryBtnClass}
        >
          Appointment Letter
        </button>
      </div>

      {error ? <p className={`text-sm ${dark ? "text-[#e91e63]" : "text-rose-600"}`}>{error}</p> : null}

      <form onSubmit={onSubmit} className={`${cardClass} grid grid-cols-1 gap-3 p-5 md:grid-cols-3`}>
        <select
          className={inputClass}
          value={classOptions.find((c) => c.className === form.className && c.section === form.section)?._id || ""}
          onChange={(e) => onClassSelect(e.target.value)}
          required={!editId}
        >
          <option value="">Select class</option>
          {classOptions.map((c) => (
            <option key={c._id} value={c._id}>
              {c.className} - {c.section} ({c.subject})
            </option>
          ))}
        </select>
        <select
          className={inputClass}
          value={form.studentId}
          onChange={(e) => setForm({ ...form, studentId: e.target.value })}
          required={!editId}
          disabled={!form.className}
        >
          <option value="">Select student</option>
          {students.map((s) => (
            <option key={s._id} value={s._id}>
              {s.firstName} {s.lastName}
            </option>
          ))}
        </select>
        <input
          className={inputClass}
          placeholder="Exam type (Midterm, Final...)"
          value={form.examType}
          onChange={(e) => setForm({ ...form, examType: e.target.value })}
          required
        />
        <input
          className={inputClass}
          placeholder="Subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          required
        />
        <input
          type="number"
          className={inputClass}
          placeholder="Marks"
          value={form.marks}
          onChange={(e) => setForm({ ...form, marks: e.target.value })}
          required
          min="0"
        />
        <input
          type="number"
          className={inputClass}
          placeholder="Max marks"
          value={form.maxMarks}
          onChange={(e) => setForm({ ...form, maxMarks: e.target.value })}
          required
          min="1"
        />
        <input
          className={inputClass}
          placeholder="Grade (A, B, C...)"
          value={form.grade}
          onChange={(e) => setForm({ ...form, grade: e.target.value })}
        />
        <input
          className={`${inputClass} md:col-span-2`}
          placeholder="Remarks"
          value={form.remarks}
          onChange={(e) => setForm({ ...form, remarks: e.target.value })}
        />
        <div className="flex gap-2 md:col-span-3">
          <button type="submit" className={primaryBtnClass} disabled={saving}>
            {saving ? "Saving..." : editId ? "Update Record" : "Add Record"}
          </button>
          {editId ? (
            <button type="button" className={outlineBtnClass} onClick={resetForm}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className={`${cardClass} overflow-hidden p-0`}>
        <div className={`flex flex-wrap items-center gap-3 border-b px-5 py-4 ${borderClass}`}>
          <h3 className={`text-base font-semibold ${dark ? "text-white" : "text-slate-800"}`}>
            Records ({pagination.total})
          </h3>
          <input
            className={`${inputClass} ml-auto w-full max-w-xs`}
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(1, search)}
          />
          <button type="button" className={outlineBtnClass} onClick={() => load(1, search)}>
            Search
          </button>
        </div>
        <table className="min-w-full text-sm">
          <thead className={tableHeadClass}>
            <tr>
              <th className="px-5 py-3 font-medium">Student</th>
              <th className="px-5 py-3 font-medium">Subject</th>
              <th className="px-5 py-3 font-medium">Exam</th>
              <th className="px-5 py-3 font-medium">Marks</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className={`px-5 py-6 ${mutedClass}`}>
                  Loading...
                </td>
              </tr>
            ) : items.length ? (
              items.map((item) => (
                <tr key={item._id} className={`border-t ${borderClass}`}>
                  <td className={`px-5 py-3 ${tableCellClass}`}>
                    {item.studentId
                      ? `${item.studentId.firstName} ${item.studentId.lastName}`
                      : "-"}
                  </td>
                  <td className={`px-5 py-3 ${tableCellClass}`}>{item.subject}</td>
                  <td className={`px-5 py-3 ${tableCellClass}`}>{item.examType}</td>
                  <td className={`px-5 py-3 ${tableCellClass}`}>
                    {item.marks}/{item.maxMarks} {item.grade ? `(${item.grade})` : ""}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button type="button" className={outlineBtnClass} onClick={() => onEdit(item)}>
                        Edit
                      </button>
                      <button type="button" className={dangerBtnClass} onClick={() => onDelete(item._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className={`px-5 py-6 ${mutedClass}`}>
                  No academic records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AppointmentLetterModal
        open={showAppointmentLetter}
        onClose={() => setShowAppointmentLetter(false)}
        dark={dark}
      />
    </section>
  );
}
