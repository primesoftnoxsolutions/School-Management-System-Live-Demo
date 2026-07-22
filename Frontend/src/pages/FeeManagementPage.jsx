import { useEffect, useState } from "react";
import api from "../services/api/client";
import FormModal from "../components/ui/FormModal";
import FeeReceiptSlip from "../components/finance/FeeReceiptSlip";
import PageHeader from "../components/ui/PageHeader";
import TablePagination from "../components/ui/TablePagination";
import { CLASS_OPTIONS, SECTION_OPTIONS, getClassSectionOptions } from "../constants/classes";
import { FEE_TYPES, PAYMENT_METHODS, labelFeeType } from "../constants/finance";

const emptyPay = {
  className: "",
  section: "",
  studentId: "",
  assignmentId: "",
  feeType: "TUITION",
  amount: "",
  discount: "0",
  fineAmount: "0",
  paymentMethod: "CASH",
  chequeNo: "",
  transactionRef: "",
  month: "",
  academicYear: new Date().getFullYear().toString(),
  remarks: "",
  paidAt: new Date().toISOString().slice(0, 10),
};

const formatClassSection = (className, section) => {
  if (!className) return "-";
  const short = className.replace(/^Grade\s*/i, "");
  return `${short}_${section || "A"}`;
};

export default function FeeManagementPage({ role, title = "Fee Management", subtitle }) {
  const [classFilter, setClassFilter] = useState("");
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [payForm, setPayForm] = useState(emptyPay);
  const [slip, setSlip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [studentPendingFees, setStudentPendingFees] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });

  const filterParts = classFilter ? classFilter.split("|") : [];
  const className = filterParts[0] || "";
  const section = filterParts[1] || "";
  const classStudents = classFilter
    ? students.filter((s) => s.className === className && (s.section || "A") === section)
    : [];
  const modalStudents = students.filter((s) => {
    const matchesClass = payForm.className ? s.className === payForm.className : true;
    const matchesSection = payForm.section ? (s.section || "A") === payForm.section : true;
    return matchesClass && matchesSection;
  });

  const studentAssignments = studentPendingFees.filter(
    (a) => a.studentId?._id === payForm.studentId && ["PENDING", "PARTIAL"].includes(a.status)
  );

  const loadStudentPendingFees = async (studentId) => {
    if (!studentId) {
      setStudentPendingFees([]);
      return;
    }
    try {
      const { data } = await api.get("/fees/assignments", {
        params: { studentId, pendingOnly: "true", limit: 50 },
      });
      setStudentPendingFees(data.data.items || []);
    } catch {
      setStudentPendingFees([]);
    }
  };

  const loadStudents = async () => {
    try {
      const { data } = await api.get("/students", { params: { page: 1, limit: 500, status: "ACTIVE" } });
      setStudents(data.data.items || []);
    } catch {
      setStudents([]);
    }
  };

  const loadPayments = async (nextPage = 1) => {
    setLoading(true);
    setError("");
    try {
      const params = { page: nextPage, limit: pagination.limit };
      if (classFilter) {
        params.className = className;
        params.section = section;
      }
      const { data } = await api.get("/fees/payments", { params });
      setPayments(data.data.items || []);
      setPagination({
        total: data.data.total || 0,
        totalPages: data.data.totalPages || 1,
        limit: data.data.limit || 20,
      });
      setPage(data.data.page || nextPage);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPending = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/fees/assignments", {
        params: {
          page: 1,
          limit: 100,
          className,
          section,
          pendingOnly: "true",
        },
      });
      setAssignments(data.data.items || []);
    } catch {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (classFilter) {
      loadPending();
    } else {
      loadPayments(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter]);

  const onReceive = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { className: _className, section: _section, ...paymentPayload } = payForm;
      const { data } = await api.post("/fees/payments", paymentPayload);
      setSlip(data.data.slip);
      setPayForm({ ...emptyPay, paidAt: new Date().toISOString().slice(0, 10) });
      setShowReceiveModal(false);
      if (classFilter) await loadPending();
      else await loadPayments(page);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to receive payment");
    } finally {
      setSaving(false);
    }
  };

  const viewSlip = async (id) => {
    try {
      const { data } = await api.get(`/fees/payments/${id}/slip`);
      setSlip(data.data);
    } catch {
      setError("Failed to load receipt slip");
    }
  };

  const openReceiveForStudent = (studentId) => {
    const selectedStudent = students.find((s) => s._id === studentId);
    setPayForm({
      ...emptyPay,
      className: selectedStudent?.className || "",
      section: selectedStudent?.section || "",
      studentId,
      paidAt: new Date().toISOString().slice(0, 10),
    });
    loadStudentPendingFees(studentId);
    setShowReceiveModal(true);
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title={title}
        subtitle={
          subtitle || (classFilter ? "Pending fees for selected class." : "Payment history — select a class to view pending fees.")
        }
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="ref-select min-w-[180px]"
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All classes (Payment History)</option>
              {getClassSectionOptions().map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <button type="button" className="ref-btn-primary" onClick={() => setShowReceiveModal(true)}>
              Receive Fee
            </button>
          </div>
        }
      />

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="ref-card overflow-hidden p-0">
        {classFilter ? (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Class</th>
                <th className="px-5 py-3 font-medium">Fee</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Pending</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-8 text-slate-500">Loading pending fees...</td></tr>
              ) : assignments.length ? (
                assignments.map((a) => (
                  <tr key={a._id} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-medium">
                      {a.studentId ? `${a.studentId.firstName} ${a.studentId.lastName}` : "-"}
                    </td>
                    <td className="px-5 py-3">
                      {formatClassSection(a.studentId?.className, a.studentId?.section)}
                    </td>
                    <td className="px-5 py-3">{a.title}</td>
                    <td className="px-5 py-3">{labelFeeType(a.feeType)}</td>
                    <td className="px-5 py-3 font-semibold text-orange-600">
                      Rs. {(a.amount - a.paidAmount).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">{a.status}</td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        className="ref-btn-outline text-xs"
                        onClick={() => openReceiveForStudent(a.studentId?._id)}
                      >
                        Receive
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="px-5 py-8 text-slate-500">No pending fees for this class.</td></tr>
              )}
            </tbody>
          </table>
        ) : (
          <>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Receipt</th>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Class</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Received Date</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-5 py-8 text-slate-500">Loading payment history...</td></tr>
                ) : payments.length ? (
                  payments.map((p) => (
                    <tr key={p._id} className="border-t border-slate-100">
                      <td className="px-5 py-3 font-medium">{p.receiptNo}</td>
                      <td className="px-5 py-3">
                        {p.studentId ? `${p.studentId.firstName} ${p.studentId.lastName}` : "-"}
                      </td>
                      <td className="px-5 py-3">
                        {formatClassSection(p.studentId?.className, p.studentId?.section)}
                      </td>
                      <td className="px-5 py-3">{labelFeeType(p.feeType)}</td>
                      <td className="px-5 py-3 font-semibold">Rs. {p.netAmount?.toLocaleString()}</td>
                      <td className="px-5 py-3">{new Date(p.paidAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <button type="button" className="ref-btn-outline text-xs" onClick={() => viewSlip(p._id)}>
                          View Slip
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={7} className="px-5 py-8 text-slate-500">No payments yet.</td></tr>
                )}
              </tbody>
            </table>
            <TablePagination
              page={page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPrev={() => loadPayments(Math.max(page - 1, 1))}
              onNext={() => loadPayments(Math.min(page + 1, pagination.totalPages))}
            />
          </>
        )}
      </div>

      <FormModal open={showReceiveModal} title="Receive Fee" onClose={() => setShowReceiveModal(false)} wide>
        <form onSubmit={onReceive} className="space-y-5">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
            <p className="text-sm font-bold text-slate-900">Fee Receiving Details</p>
            <p className="mt-1 text-xs text-slate-500">Select class and section first to quickly find the student.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <select
            className="ref-input"
            value={payForm.className}
            onChange={(e) => setPayForm({ ...payForm, className: e.target.value, studentId: "", assignmentId: "" })}
          >
            <option value="">Select class</option>
            {CLASS_OPTIONS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select
            className="ref-input"
            value={payForm.section}
            onChange={(e) => setPayForm({ ...payForm, section: e.target.value, studentId: "", assignmentId: "" })}
          >
            <option value="">Select section</option>
            {SECTION_OPTIONS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select
            className="ref-input md:col-span-2"
            value={payForm.studentId}
            onChange={(e) => {
              const nextId = e.target.value;
              setPayForm({ ...payForm, studentId: nextId, assignmentId: "" });
              loadStudentPendingFees(nextId);
            }}
            required
          >
            <option value="">Select student *</option>
            {(classFilter ? classStudents : modalStudents).map((s) => (
              <option key={s._id} value={s._id}>
                {s.firstName} {s.lastName} — {s.className} {s.section || "A"}
              </option>
            ))}
          </select>
          {payForm.studentId && studentAssignments.length ? (
            <select
              className="ref-input md:col-span-2"
              value={payForm.assignmentId}
              onChange={(e) => {
                const a = studentAssignments.find((x) => x._id === e.target.value);
                setPayForm({
                  ...payForm,
                  assignmentId: e.target.value,
                  amount: a ? String(a.amount - a.paidAmount) : payForm.amount,
                  feeType: a?.feeType || payForm.feeType,
                  month: a?.month || payForm.month,
                });
              }}
            >
              <option value="">Link pending fee (optional)</option>
              {studentAssignments.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.title} — Pending Rs. {(a.amount - a.paidAmount).toLocaleString()}
                </option>
              ))}
            </select>
          ) : null}
          <select className="ref-input" value={payForm.feeType} onChange={(e) => setPayForm({ ...payForm, feeType: e.target.value })}>
            {FEE_TYPES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <input type="number" className="ref-input" placeholder="Amount *" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} required min="0" />
          <input type="number" className="ref-input" placeholder="Discount" value={payForm.discount} onChange={(e) => setPayForm({ ...payForm, discount: e.target.value })} min="0" />
          <input type="number" className="ref-input" placeholder="Late fine" value={payForm.fineAmount} onChange={(e) => setPayForm({ ...payForm, fineAmount: e.target.value })} min="0" />
          <select className="ref-input" value={payForm.paymentMethod} onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
            {PAYMENT_METHODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <input type="date" className="ref-input" value={payForm.paidAt} onChange={(e) => setPayForm({ ...payForm, paidAt: e.target.value })} />
          <input className="ref-input md:col-span-2" placeholder="Remarks" value={payForm.remarks} onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })} />
          </div>
          <button type="submit" className="ref-btn-primary w-full" disabled={saving}>
            {saving ? "Processing..." : "Receive Fee & Generate Slip"}
          </button>
        </form>
      </FormModal>

      {slip ? <FeeReceiptSlip slip={slip} onClose={() => setSlip(null)} /> : null}
    </section>
  );
}
