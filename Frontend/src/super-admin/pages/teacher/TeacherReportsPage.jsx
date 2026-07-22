import { useEffect, useState } from "react";
import api from "../../services/api/client";

const emptyForm = {
  title: "",
  reportType: "GENERAL",
  summary: "",
  periodFrom: "",
  periodTo: "",
};

export default function TeacherReportsPage() {
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  const load = async (nextPage = page, nextSearch = search) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/teacher-panel/reports", {
        params: { page: nextPage, limit: 10, search: nextSearch },
      });
      setItems(data.data.items || []);
      setPagination({ totalPages: data.data.totalPages || 1, total: data.data.total || 0 });
      setPage(data.data.page || nextPage);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reports");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1, "");
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editId) {
        await api.put(`/teacher-panel/reports/${editId}`, form);
      } else {
        await api.post("/teacher-panel/reports", form);
      }
      resetForm();
      await load(1, search);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save report");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (item) => {
    setEditId(item._id);
    setForm({
      title: item.title,
      reportType: item.reportType || "GENERAL",
      summary: item.summary,
      periodFrom: item.periodFrom ? new Date(item.periodFrom).toISOString().slice(0, 10) : "",
      periodTo: item.periodTo ? new Date(item.periodTo).toISOString().slice(0, 10) : "",
    });
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      await api.delete(`/teacher-panel/reports/${id}`);
      if (editId === id) resetForm();
      await load(page, search);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete report");
    }
  };

  const downloadReport = (item) => {
    const content = [
      `Title: ${item.title}`,
      `Type: ${item.reportType}`,
      `Period: ${item.periodFrom ? new Date(item.periodFrom).toLocaleDateString() : "-"} to ${item.periodTo ? new Date(item.periodTo).toLocaleDateString() : "-"}`,
      "",
      item.summary,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${item.title.replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Reports</h2>
        <p className="text-sm text-slate-500">Create, edit and download your teaching reports.</p>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <form onSubmit={onSubmit} className="ref-card grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
        <input
          className="ref-input md:col-span-2"
          placeholder="Report title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <select
          className="ref-input"
          value={form.reportType}
          onChange={(e) => setForm({ ...form, reportType: e.target.value })}
        >
          <option value="GENERAL">General</option>
          <option value="ATTENDANCE">Attendance</option>
          <option value="ACADEMIC">Academic</option>
          <option value="CLASS">Class</option>
        </select>
        <input
          type="date"
          className="ref-input"
          value={form.periodFrom}
          onChange={(e) => setForm({ ...form, periodFrom: e.target.value })}
        />
        <input
          type="date"
          className="ref-input"
          value={form.periodTo}
          onChange={(e) => setForm({ ...form, periodTo: e.target.value })}
        />
        <textarea
          className="ref-input min-h-24 md:col-span-2"
          placeholder="Report summary and details..."
          value={form.summary}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
          required
        />
        <div className="flex gap-2 md:col-span-2">
          <button type="submit" className="ref-btn-primary" disabled={saving}>
            {saving ? "Saving..." : editId ? "Update Report" : "Create Report"}
          </button>
          {editId ? (
            <button type="button" className="ref-btn-outline" onClick={resetForm}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="ref-card overflow-hidden p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-800">My Reports ({pagination.total})</h3>
          <input
            className="ref-input ml-auto w-full max-w-xs"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(1, search)}
          />
          <button type="button" className="ref-btn-outline" onClick={() => load(1, search)}>
            Search
          </button>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : items.length ? (
              items.map((item) => (
                <tr key={item._id} className="border-t border-slate-100">
                  <td className="px-5 py-3 text-slate-700">{item.title}</td>
                  <td className="px-5 py-3 text-slate-700">{item.reportType}</td>
                  <td className="px-5 py-3 text-slate-700">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="ref-btn-outline" onClick={() => downloadReport(item)}>
                        Download
                      </button>
                      <button type="button" className="ref-btn-outline" onClick={() => onEdit(item)}>
                        Edit
                      </button>
                      <button type="button" className="ref-btn-danger" onClick={() => onDelete(item._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-slate-500">
                  No reports yet. Create your first report above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
