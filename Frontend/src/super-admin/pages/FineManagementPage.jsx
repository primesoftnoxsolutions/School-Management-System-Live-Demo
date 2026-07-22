import { useEffect, useState } from "react";
import api from "../services/api/client";
import FormModal from "../components/ui/FormModal";
import PageHeader from "../components/ui/PageHeader";
import ScrollableSelect from "../components/ui/ScrollableSelect";
import { FINE_TYPES } from "../constants/finance";
import { withStudentBranchParams } from "../utils/branch";

const emptyForm = {
  studentId: "",
  fineType: "LATE_FEE",
  amount: "",
  reason: "",
  dueDate: "",
};

export default function FineManagementPage({ role, dark = false, branchSection = "Boys" }) {
  const isAdmin = role === "SUPER_ADMIN";
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/fines", {
        params: { page: 1, limit: 50, status: statusFilter || undefined },
      });
      setItems(data.data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api
      .get("/students", { params: withStudentBranchParams({ page: 1, limit: 200 }, branchSection) })
      .then((r) => setStudents(r.data.data.items || []))
      .catch(() => setStudents([]));
    load();
  }, [statusFilter, branchSection]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/fines", form);
      setForm(emptyForm);
      setShowModal(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to issue fine");
    } finally {
      setSaving(false);
    }
  };

  const payFine = async (id) => {
    try {
      await api.post(`/fines/${id}/pay`, { paymentMethod: "CASH" });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to collect fine");
    }
  };

  const waiveFine = async (id) => {
    const reason = window.prompt("Waive reason:");
    if (!reason) return;
    try {
      await api.post(`/fines/${id}/waive`, { waivedReason: reason });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to waive fine");
    }
  };

  const selectedStudent = students.find((s) => s._id === form.studentId);

  return (
    <section className="space-y-6">
      <PageHeader title="Fine Management" subtitle="Issue, collect and waive student fines." actionLabel="Issue Fine" onAction={() => setShowModal(true)} dark={dark} />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className={`overflow-hidden rounded-2xl border p-0 ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white shadow-sm"}`}>
        <div className={`flex items-center gap-3 border-b px-5 py-4 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
          <h3 className={`font-semibold ${dark ? "text-white" : "text-slate-800"}`}>Fine Records</h3>
          <select className="ref-select ml-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="WAIVED">Waived</option>
          </select>
        </div>
        <table className="min-w-full text-sm">
          <thead className={`text-left ${dark ? "bg-[#1a1b26] text-[#9e9e9e]" : "bg-slate-50 text-slate-500"}`}>
            <tr>
              <th className="px-5 py-3">Student</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Reason</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className={`px-5 py-6 ${dark ? "text-[#9e9e9e]" : ""}`}>Loading...</td></tr>
            ) : items.length ? (
              items.map((item) => (
                <tr key={item._id} className={`border-t ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
                  <td className={`px-5 py-3 ${dark ? "text-white" : ""}`}>
                    {item.studentId ? `${item.studentId.firstName} ${item.studentId.lastName}` : "-"}
                  </td>
                  <td className={`px-5 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>{item.fineType}</td>
                  <td className={`px-5 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>Rs. {item.amount?.toLocaleString()}</td>
                  <td className={`px-5 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>{item.reason}</td>
                  <td className={`px-5 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>{item.status}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      {item.status === "PENDING" ? (
                        <button type="button" className="ref-btn-outline" onClick={() => payFine(item._id)}>
                          Collect
                        </button>
                      ) : null}
                      {item.status === "PENDING" && isAdmin ? (
                        <button type="button" className="ref-btn-danger" onClick={() => waiveFine(item._id)}>
                          Waive
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className={`px-5 py-6 ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>No fines found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <FormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        wide
        dark={dark}
        title="Issue Fine"
        subtitle="Quick fine entry with a cleaner compact layout."
      >
        <form onSubmit={onSubmit} className={`-mx-6 -mb-6 overflow-hidden text-[15px] ${dark ? "text-[#e2e8f0]" : "text-slate-950"}`}>
          <div className="space-y-5 px-6 py-6">
            <ScrollableSelect
              label="Select Student"
              placeholder="Choose student"
              value={form.studentId}
              options={[
                { value: "", label: "Choose student" },
                ...students.map((s) => ({
                  value: s._id,
                  label: `${s.firstName} ${s.lastName}`,
                })),
              ]}
              onChange={(value) => setForm({ ...form, studentId: value })}
              portal
              dark={dark}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <ScrollableSelect
                label="Fine Type"
                placeholder="Select fine type"
                value={form.fineType}
                options={FINE_TYPES.map((f) => ({ value: f.value, label: f.label }))}
                onChange={(value) => setForm({ ...form, fineType: value })}
                portal
                dark={dark}
              />
              <div>
                <label className={`mb-2 block text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                  Fine Amount <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  className="ref-input h-12 w-full"
                  placeholder="Enter amount"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  min="0"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={`mb-2 block text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                  Reason <span className="text-rose-500">*</span>
                </label>
                <input
                  className="ref-input h-12 w-full"
                  placeholder="Enter fine reason"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={`mb-2 block text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>Due Date</label>
                <input
                  type="date"
                  className="ref-input h-12 w-full"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${dark ? "border-white/[0.06] bg-[#1a1b26]" : "border-slate-100 bg-slate-50/70"}`}>
              <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${dark ? "text-[#9e9e9e]" : "text-slate-400"}`}>Selected Student</p>
              <p className={`mt-2 font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                {selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : "No student selected"}
              </p>
              <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                {selectedStudent ? `${selectedStudent.className} ${selectedStudent.section || "A"}` : "Choose a student to continue"}
              </p>
            </div>
          </div>

          <div className={`flex flex-col gap-3 border-t px-6 py-5 sm:flex-row sm:items-center sm:justify-end ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-100 bg-white"}`}>
            <button
              type="button"
              className={`h-12 rounded-2xl border px-6 text-sm font-semibold transition ${
                dark
                  ? "border-white/[0.06] bg-[#1a1b26] text-[#e2e8f0] hover:bg-white/[0.04]"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
              }`}
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving..." : "Issue Fine"}
            </button>
          </div>
        </form>
      </FormModal>
    </section>
  );
}
