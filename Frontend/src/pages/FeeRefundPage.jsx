import { useEffect, useState } from "react";
import api from "../services/api/client";
import FormModal from "../components/ui/FormModal";
import PageHeader from "../components/ui/PageHeader";
import ScrollableSelect from "../components/ui/ScrollableSelect";
import { CLASS_OPTIONS, SECTION_OPTIONS } from "../constants/classes";
import { PAYMENT_METHODS, REFUND_STATUS, REFUND_TYPES } from "../constants/finance";

const emptyForm = {
  className: "",
  section: "",
  studentId: "",
  refundType: "FEES",
  amount: "",
  reason: "",
  refundMethod: "CASH",
  remarks: "",
};

export default function FeeRefundPage({ role, dark = false }) {
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const filteredStudents = students.filter((s) => {
    const matchesClass = form.className ? s.className === form.className : true;
    const matchesSection = form.section ? (s.section || "A") === form.section : true;
    return matchesClass && matchesSection;
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/fee-refunds", { params: { page: 1, limit: 50 } });
      setItems(data.data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const boot = async () => {
      try {
        const { data } = await api.get("/students", { params: { page: 1, limit: 200 } });
        setStudents(data.data.items || []);
      } catch {
        setStudents([]);
      }
      await load();
    };
    boot();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { className: _className, section: _section, ...refundPayload } = form;
      await api.post("/fee-refunds", refundPayload);
      setForm(emptyForm);
      setShowModal(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create refund");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/fee-refunds/${id}/status`, { status });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  const refundTypeLabel = (value) => REFUND_TYPES.find((r) => r.value === value)?.label || value;

  return (
    <section className="space-y-6">
      <PageHeader
        title="Fee Refund"
        subtitle="Request, approve and process student fee refunds."
        actionLabel="Create Refund"
        onAction={() => setShowModal(true)}
      />

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="ref-card overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Refund No</th>
              <th className="px-5 py-3 font-medium">Student</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Reason</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-6">Loading...</td></tr>
            ) : items.length ? (
              items.map((item) => (
                <tr key={item._id} className="border-t border-slate-100">
                  <td className="px-5 py-3">{item.refundNo}</td>
                  <td className="px-5 py-3">
                    {item.studentId ? `${item.studentId.firstName} ${item.studentId.lastName}` : "-"}
                  </td>
                  <td className="px-5 py-3">{refundTypeLabel(item.refundType)}</td>
                  <td className="px-5 py-3">Rs. {item.amount?.toLocaleString()}</td>
                  <td className="px-5 py-3">{item.reason}</td>
                  <td className="px-5 py-3">{item.status}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {REFUND_STATUS.filter((s) => s !== item.status).map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="ref-btn-outline text-xs"
                          onClick={() => updateStatus(item._id, s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="px-5 py-6 text-slate-500">No refund records.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <FormModal open={showModal} title="Create Refund" onClose={() => setShowModal(false)} wide>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
            <p className="text-sm font-bold text-slate-900">Refund Details</p>
            <p className="mt-1 text-xs text-slate-500">Select class and section to narrow the student list.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <ScrollableSelect
            label="Class"
            placeholder="Select class"
            value={form.className}
            options={[
              { value: "", label: "Select class" },
              ...CLASS_OPTIONS.map((c) => ({ value: c, label: c })),
            ]}
            onChange={(value) => setForm({ ...form, className: value, studentId: "" })}
            dark={dark}
            portal
          />
          <ScrollableSelect
            label="Section"
            placeholder="Select section"
            value={form.section}
            options={[
              { value: "", label: "Select section" },
              ...SECTION_OPTIONS.map((s) => ({ value: s, label: s })),
            ]}
            onChange={(value) => setForm({ ...form, section: value, studentId: "" })}
            dark={dark}
            portal
          />
          <div className="md:col-span-2">
            <ScrollableSelect
              label="Student"
              placeholder="Select student *"
              value={form.studentId}
              options={[
                { value: "", label: "Select student *" },
                ...filteredStudents.map((s) => ({
                  value: s._id,
                  label: `${s.firstName} ${s.lastName} - ${s.className} ${s.section || "A"}`,
                })),
              ]}
              onChange={(value) => setForm({ ...form, studentId: value })}
              required
              dark={dark}
              portal
            />
          </div>
          <ScrollableSelect
            label="Refund Type"
            placeholder="Select refund type"
            value={form.refundType}
            options={REFUND_TYPES.map((r) => ({ value: r.value, label: r.label }))}
            onChange={(value) => setForm({ ...form, refundType: value })}
            required
            dark={dark}
            portal
          />
          <input
            type="number"
            className="ref-input"
            placeholder="Refund amount *"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
            min="0"
          />
          <input
            className="ref-input md:col-span-2"
            placeholder="Reason *"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            required
          />
          <ScrollableSelect
            label="Refund Method"
            placeholder="Select method"
            value={form.refundMethod}
            options={PAYMENT_METHODS.map((p) => ({ value: p.value, label: p.label }))}
            onChange={(value) => setForm({ ...form, refundMethod: value })}
            dark={dark}
            portal
          />
          <input
            className="ref-input"
            placeholder="Remarks (optional)"
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
          />
          </div>
          <button type="submit" className="ref-btn-primary w-full" disabled={saving}>
            {saving ? "Saving..." : "Submit Refund Request"}
          </button>
        </form>
      </FormModal>
    </section>
  );
}
