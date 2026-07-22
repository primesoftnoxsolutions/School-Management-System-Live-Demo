import { useEffect, useState } from "react";
import api from "../services/api/client";
import FormModal from "../components/ui/FormModal";
import PageHeader from "../components/ui/PageHeader";
import ScrollableSelect from "../components/ui/ScrollableSelect";
import { PAYMENT_METHODS, REFUND_STATUS, REFUND_TYPES } from "../constants/finance";
import { withStudentBranchParams } from "../utils/branch";

function IconRefund({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M7 3l-4 4 4 4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 17H3M17 21l4-4-4-4" />
    </svg>
  );
}

function IconNote({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13H7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6M9 17h6" />
    </svg>
  );
}

const emptyForm = {
  studentId: "",
  refundType: "FEES",
  amount: "",
  reason: "",
  refundMethod: "CASH",
  remarks: "",
};

export default function FeeRefundPage({ role, dark = false, branchSection = "Boys" }) {
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

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
        const { data } = await api.get("/students", {
          params: withStudentBranchParams({ page: 1, limit: 200 }, branchSection),
        });
        setStudents(data.data.items || []);
      } catch {
        setStudents([]);
      }
      await load();
    };
    boot();
  }, [branchSection]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/fee-refunds", form);
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
        dark={dark}
      />

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className={`overflow-x-auto rounded-2xl border p-0 ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white shadow-sm"}`}>
        <table className="min-w-full text-sm">
          <thead className={`text-left ${dark ? "bg-[#1a1b26] text-[#9e9e9e]" : "bg-slate-50 text-slate-500"}`}>
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
              <tr>
                <td colSpan={7} className={`px-5 py-6 ${dark ? "text-[#9e9e9e]" : ""}`}>Loading...</td>
              </tr>
            ) : items.length ? (
              items.map((item) => (
                <tr key={item._id} className={`border-t ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
                  <td className={`px-5 py-3 ${dark ? "text-white" : ""}`}>{item.refundNo}</td>
                  <td className={`px-5 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>{item.studentId ? `${item.studentId.firstName} ${item.studentId.lastName}` : "-"}</td>
                  <td className={`px-5 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>{refundTypeLabel(item.refundType)}</td>
                  <td className={`px-5 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>Rs. {item.amount?.toLocaleString()}</td>
                  <td className={`px-5 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>{item.reason}</td>
                  <td className={`px-5 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>{item.status}</td>
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
              <tr>
                <td colSpan={7} className={`px-5 py-6 ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>No refund records.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <FormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        wide
        dark={dark}
        title={
          <span className="flex items-center gap-4">
            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${dark ? "border-rose-500/30 bg-rose-500/10 text-rose-400" : "border-rose-100 bg-rose-50 text-rose-600"}`}>
              <IconRefund className="h-5 w-5" />
            </span>
            <span>
              <span className={`block text-[22px] font-bold ${dark ? "text-white" : "text-slate-950"}`}>Create Refund</span>
              <span className={`block text-sm font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Quick refund request entry.</span>
            </span>
          </span>
        }
      >
        <form onSubmit={onSubmit} className={`-mx-6 -mb-6 overflow-hidden text-[15px] ${dark ? "text-[#e2e8f0]" : "text-slate-950"}`}>
          <div className="space-y-5 px-6 py-6">
            <div className="grid gap-4">
              <ScrollableSelect
                label="Select Student"
                placeholder="Choose student"
                value={form.studentId}
                options={[
                  { value: "", label: "Choose student" },
                  ...students.map((s) => ({
                    value: s._id,
                    label: `${s.firstName} ${s.lastName} | ${s.className} ${s.section || "A"}`,
                  })),
                ]}
                onChange={(value) => setForm({ ...form, studentId: value })}
                portal
                dark={dark}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <ScrollableSelect
                  label="Refund Type"
                  placeholder="Select refund type"
                  value={form.refundType}
                  options={REFUND_TYPES.map((r) => ({ value: r.value, label: r.label }))}
                  onChange={(value) => setForm({ ...form, refundType: value })}
                  portal
                  dark={dark}
                />

                <ScrollableSelect
                  label="Refund Method"
                  placeholder="Select method"
                  value={form.refundMethod}
                  options={PAYMENT_METHODS.map((p) => ({ value: p.value, label: p.label }))}
                  onChange={(value) => setForm({ ...form, refundMethod: value })}
                  portal
                  dark={dark}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={`mb-2 block text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                    Refund Amount <span className="text-rose-500">*</span>
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

                <div>
                  <label className={`mb-2 block text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>Remarks</label>
                  <input
                    className="ref-input h-12 w-full"
                    placeholder="Optional remarks"
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className={`mb-2 block text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                  Reason <span className="text-rose-500">*</span>
                </label>
                <input
                  className="ref-input h-12 w-full"
                  placeholder="Enter refund reason"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  required
                />
              </div>

              <div className={`rounded-2xl border p-4 ${dark ? "border-white/[0.06] bg-[#1a1b26]" : "border-slate-100 bg-slate-50/70"}`}>
                <div className={`flex items-center gap-2 ${dark ? "text-[#e2e8f0]" : "text-slate-700"}`}>
                  <IconNote className="h-4 w-4" />
                  <p className="text-sm font-semibold">Selected Student</p>
                </div>
                <p className={`mt-2 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>
                  {students.find((s) => s._id === form.studentId)
                    ? `${students.find((s) => s._id === form.studentId).firstName} ${students.find((s) => s._id === form.studentId).lastName} | ${students.find((s) => s._id === form.studentId).className} ${students.find((s) => s._id === form.studentId).section || "A"}`
                    : "No student selected"}
                </p>
              </div>
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
              className="h-12 rounded-2xl bg-gradient-to-r from-rose-600 to-fuchsia-600 px-7 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:from-rose-700 hover:to-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving..." : "Submit Refund Request"}
            </button>
          </div>
        </form>
      </FormModal>
    </section>
  );
}
