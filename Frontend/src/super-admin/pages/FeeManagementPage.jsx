import { useEffect, useState } from "react";
import api from "../services/api/client";
import FormModal from "../components/ui/FormModal";
import FeeReceiptSlip from "../components/finance/FeeReceiptSlip";
import FeeScheduleModal from "../components/finance/FeeScheduleModal";
import PageHeader from "../components/ui/PageHeader";
import TablePagination from "../components/ui/TablePagination";
import ScrollableSelect from "../components/ui/ScrollableSelect";
import { CLASS_OPTIONS, SECTION_OPTIONS } from "../constants/classes";
import { labelFeeType } from "../constants/finance";
import { IconEye, IconPrint } from "../../components/icons/NavIcons";
import { withStudentBranchParams } from "../utils/branch";

const PAYMENT_METHOD_OPTIONS = [
  { value: "CASH", label: "Cash" },
  { value: "ONLINE", label: "Online" },
];

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
];

const emptyPay = {
  studentId: "",
  paymentMethod: "",
  remarks: "",
};

const formatClassSection = (className, section) => {
  if (!className) return "-";
  return `${className} - ${section || "A"}`;
};

const getFeeBucket = (fee) => {
  if (fee.kind === "FINE" || fee.feeType === "FINE") return "FINE";
  return fee.feeType === "TUITION" ? "MONTHLY" : fee.feeType || "OTHER";
};

const getFeeLabel = (fee) => {
  if (fee.kind === "FINE" || fee.feeType === "FINE") return "Fine";
  if (fee.feeType === "TUITION") return fee.month ? `Monthly Fee (${fee.month})` : "Monthly Fee";
  if (fee.feeType === "ADMISSION") return "Admission Fee";
  if (fee.feeType === "ANNUAL") return "Annual Fee";
  return labelFeeType(fee.feeType);
};

const getFeeTypeBadge = (fee) => {
  if (fee.kind === "FINE" || fee.feeType === "FINE") {
    return { label: "Fine", className: "border-rose-200 bg-rose-50 text-rose-700" };
  }
  if (fee.feeType === "TUITION") {
    return { label: "Monthly", className: "border-blue-200 bg-blue-50 text-blue-700" };
  }
  if (fee.feeType === "ADMISSION") {
    return { label: "Admission", className: "border-violet-200 bg-violet-50 text-violet-700" };
  }
  if (fee.feeType === "ANNUAL") {
    return { label: "Annual", className: "border-green-200 bg-green-50 text-green-700" };
  }
  return { label: labelFeeType(fee.feeType), className: "border-slate-200 bg-slate-50 text-slate-700" };
};

const formatPeriod = (fee) => (fee.kind === "FINE" ? "Fine" : fee.month || fee.academicYear || "-");

const formatDate = (date) => {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusMeta = (status) => {
  const value = (status || "").toUpperCase();
  if (value === "PAID") {
    return { label: "Paid", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  }
  return { label: "Pending", className: "border-amber-200 bg-amber-50 text-amber-700" };
};

const getPendingItemKey = (item) => `${item.kind || "FEE"}:${item._id}`;

const getPendingItemAmount = (item) =>
  item.kind === "FINE" ? Math.max(Number(item.amount || 0), 0) : Math.max(Number(item.amount || 0) - Number(item.paidAmount || 0), 0);

function StudentAvatar({ student }) {
  const initials = `${student?.firstName?.[0] || ""}${student?.lastName?.[0] || ""}`.toUpperCase();
  if (student?.studentPhotoUrl) {
    return (
      <img
        src={student.studentPhotoUrl}
        alt={initials}
        className="h-12 w-12 rounded-full object-cover ring-2 ring-white"
      />
    );
  }
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
      {initials || "?"}
    </div>
  );
}

const formatDueDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const isOverdue = (date) => date && new Date(date) < new Date();

const IconReceipt = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 3h10v18l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2V3Z" />
    <path d="M9.5 8h5M9.5 12h5M9.5 16h3" />
  </svg>
);

const IconUser = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.2" />
    <path d="M5 20c1.1-3.4 3.4-5.1 7-5.1s5.9 1.7 7 5.1" />
  </svg>
);

const IconInfo = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 10.8v5M12 7.7h.01" />
  </svg>
);

const IconCard = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M3 10h18M7 15h3" />
  </svg>
);

const IconCash = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 9h.01M18 15h.01" />
  </svg>
);

const IconGlobe = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21M12 3C9.8 5.4 8.7 8.4 8.7 12S9.8 18.6 12 21" />
  </svg>
);

const IconChevron = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const IconSlip = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 3h10v18l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2V3Z" />
    <path d="M9 8h6M9 12h6M9 16h4" />
  </svg>
);

export default function FeeManagementPage({ role, title = "Fee Management", subtitle, dark = false, branchSection = "Boys" }) {
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("PAID");
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [payForm, setPayForm] = useState(emptyPay);
  const [slip, setSlip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showFeeScheduleModal, setShowFeeScheduleModal] = useState(false);
  const [studentPendingFees, setStudentPendingFees] = useState([]);
  const [selectedPendingIds, setSelectedPendingIds] = useState([]);
  const [pendingFeeViewFilter, setPendingFeeViewFilter] = useState("ALL");
  const [portfolioStudent, setPortfolioStudent] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [studentMenuOpen, setStudentMenuOpen] = useState(false);
  const [feeMenuOpen, setFeeMenuOpen] = useState(false);
  const [paymentMenuOpen, setPaymentMenuOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });

  const filteredStudents = students.filter((student) => {
    if (classFilter && student.className !== classFilter) return false;
    if (sectionFilter && (student.section || "A") !== sectionFilter) return false;
    return true;
  });
  const modalStudents = students;
  const visibleModalStudents = classFilter || sectionFilter ? filteredStudents : modalStudents;
  const selectedStudent = modalStudents.find((student) => student._id === payForm.studentId);
  const selectedPaymentMethod = PAYMENT_METHOD_OPTIONS.find((option) => option.value === payForm.paymentMethod);

  const visiblePendingFees =
    pendingFeeViewFilter === "ALL"
      ? studentPendingFees
      : studentPendingFees.filter((fee) => getFeeBucket(fee) === pendingFeeViewFilter);

  const selectedPendingFees = studentPendingFees.filter((fee) => selectedPendingIds.includes(getPendingItemKey(fee)));
  const grandTotal = selectedPendingFees.reduce(
    (sum, fee) => sum + getPendingItemAmount(fee),
    0
  );

  const loadStudentPendingFees = async (studentId) => {
    if (!studentId) {
      setStudentPendingFees([]);
      setSelectedPendingIds([]);
      return;
    }
    try {
      const [assignmentRes, fineRes] = await Promise.all([
        api.get("/fees/assignments", { params: { studentId, pendingOnly: "true", limit: 50 } }),
        api.get("/fines", { params: { studentId, status: "PENDING", limit: 50 } }),
      ]);
      const assignmentItems = (assignmentRes.data.data.items || []).map((item) => ({ ...item, kind: "FEE" }));
      const fineItems = (fineRes.data.data.items || []).map((item) => ({
        ...item,
        kind: "FINE",
        title: item.reason || "Fine",
        feeType: "FINE",
        paidAmount: 0,
      }));
      const items = [...assignmentItems, ...fineItems];
      setStudentPendingFees(items);
      setSelectedPendingIds(items.map((item) => getPendingItemKey(item)));
    } catch {
      setStudentPendingFees([]);
      setSelectedPendingIds([]);
    }
  };

  const loadStudents = async () => {
    try {
      const { data } = await api.get("/students", {
        params: withStudentBranchParams({ page: 1, limit: 500, status: "ACTIVE" }, branchSection),
      });
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
        params.className = classFilter;
      }
      if (sectionFilter) {
        params.section = sectionFilter;
      }
      const { data } = await api.get("/fees/payments", { params });
      setPayments(data.data.items || []);
      setPagination({
        total: data.data.total || 0,
        totalPages: data.data.totalPages || 1,
        limit: data.data.limit || 20,
      });
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPending = async (nextPage = page) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/fees/assignments", {
        params: {
          page: nextPage,
          limit: pagination.limit,
          className: classFilter,
          section: sectionFilter,
          pendingOnly: "true",
        },
      });
      setAssignments(data.data.items || []);
      setPagination({
        total: data.data.total || 0,
        totalPages: data.data.totalPages || 1,
        limit: data.data.limit || pagination.limit,
      });
    } catch {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchSection]);

  useEffect(() => {
    if (statusFilter === "PENDING") {
      loadPending();
    } else {
      loadPayments(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter, sectionFilter, statusFilter, page]);

  const onReceive = async (e) => {
    e.preventDefault();
    if (!payForm.studentId) {
      setError("Please select a student");
      return;
    }
    if (!selectedPendingFees.length) {
      setError("Please select at least one pending fee");
      return;
    }
    if (!payForm.paymentMethod) {
      setError("Please select payment method");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const selectedAssignmentIds = selectedPendingFees.filter((fee) => fee.kind !== "FINE").map((fee) => fee._id);
      const selectedFineIds = selectedPendingFees.filter((fee) => fee.kind === "FINE").map((fee) => fee._id);
      const { data } = await api.post("/fees/payments", {
        studentId: payForm.studentId,
        assignmentIds: selectedAssignmentIds,
        fineIds: selectedFineIds,
        amount: grandTotal,
        paymentMethod: payForm.paymentMethod,
        remarks: payForm.remarks,
      });
      setSlip(data.data.slip);
      setPayForm(emptyPay);
      setStudentPendingFees([]);
      setSelectedPendingIds([]);
      setPendingFeeViewFilter("ALL");
      setShowReceiveModal(false);
      if (statusFilter === "PENDING") await loadPending();
      else await loadPayments(page);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to receive payment");
    } finally {
      setSaving(false);
    }
  };

  const openSlip = async (id, shouldPrint = false) => {
    try {
      const { data } = await api.get(`/fees/payments/${id}/slip`);
      setSlip(data.data);
      if (shouldPrint) {
        window.setTimeout(() => window.print(), 75);
      }
    } catch {
      setError("Failed to load receipt slip");
    }
  };

  const openPortfolio = async (student) => {
    if (!student?._id) return;
    setPortfolioStudent(student);
    setPortfolioData(null);
    setPortfolioLoading(true);
    try {
      const [studentRes, portfolioRes] = await Promise.all([
        api.get(`/students/${student._id}`),
        api.get(`/students/${student._id}/fee-portfolio`),
      ]);
      setPortfolioStudent((current) => ({ ...(current || student), ...(studentRes.data?.data || {}) }));
      setPortfolioData(portfolioRes.data?.data || null);
    } catch {
      setPortfolioData(null);
    } finally {
      setPortfolioLoading(false);
    }
  };

  const closePortfolio = () => {
    setPortfolioStudent(null);
    setPortfolioData(null);
    setPortfolioLoading(false);
  };

  const portfolioProfile = portfolioData?.student || portfolioStudent;
  const portfolioSummary = portfolioData?.summary || null;
  const portfolioRecords = portfolioData?.feeRecords || [];

  const streamLabel = (student) => {
    if (!student?.academicStream) return "-";
    if (student.streamDetail) return `${student.academicStream} (${student.streamDetail})`;
    return student.academicStream;
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle || (statusFilter === "PENDING" ? "Pending fee assignments for the selected class and section." : "Payment history for the selected class and section.")}
        dark={dark}
        extra={
          <div className="grid w-full gap-3 sm:grid-cols-3 xl:w-auto xl:min-w-[660px]">
            <ScrollableSelect
              label="Select Class"
              placeholder="All Classes"
              value={classFilter}
              options={[{ value: "", label: "All Classes" }, ...CLASS_OPTIONS.map((className) => ({ value: className, label: className }))]}
              onChange={(value) => {
                setClassFilter(value);
                setPage(1);
              }}
              portal
              dark={dark}
            />
            <ScrollableSelect
              label="Select Section"
              placeholder="All Sections"
              value={sectionFilter}
              options={[{ value: "", label: "All Sections" }, ...SECTION_OPTIONS.map((section) => ({ value: section, label: section }))]}
              onChange={(value) => {
                setSectionFilter(value);
                setPage(1);
              }}
              portal
              dark={dark}
            />
            <ScrollableSelect
              label="Status"
              placeholder="Paid"
              value={statusFilter}
              options={STATUS_OPTIONS}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              portal
              dark={dark}
            />
          </div>
        }
        afterAction={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="ref-btn-outline whitespace-nowrap"
              onClick={() => setShowFeeScheduleModal(true)}
            >
              Fee Schedule
            </button>
            <button
              type="button"
              className="ref-btn-primary whitespace-nowrap"
              onClick={() => {
                setPayForm(emptyPay);
                setStudentPendingFees([]);
                setSelectedPendingIds([]);
                setPendingFeeViewFilter("ALL");
                setPaymentMenuOpen(true);
                setShowReceiveModal(true);
              }}
            >
              Receive Fee
            </button>
          </div>
        }
      />

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="ref-card overflow-hidden p-0">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Receipt</th>
              <th className="px-5 py-3 font-medium">Student Name</th>
              <th className="px-5 py-3 font-medium">Class+Section</th>
              <th className="px-5 py-3 font-medium">Fee Type</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Received Date</th>
              <th className="px-5 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-slate-500">
                  {statusFilter === "PENDING" ? "Loading pending fees..." : "Loading payment history..."}
                </td>
              </tr>
            ) : (statusFilter === "PENDING" ? assignments : payments).length ? (
              (statusFilter === "PENDING" ? assignments : payments).map((row) => {
                const student = row.studentId || {};
                const isPaid = statusFilter !== "PENDING";
                const statusMeta = getStatusMeta(isPaid ? "PAID" : row.status);
                const amountValue = isPaid ? row.netAmount || 0 : Math.max(Number(row.amount || 0) - Number(row.paidAmount || 0), 0);
                return (
                  <tr key={row._id} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-medium text-slate-900">{isPaid ? row.receiptNo : "-"}</td>
                    <td className="px-5 py-3 text-slate-700">{student.firstName ? `${student.firstName} ${student.lastName}` : "-"}</td>
                    <td className="px-5 py-3 text-slate-700">{formatClassSection(student.className, student.section)}</td>
                    <td className="px-5 py-3 text-slate-700">{isPaid ? labelFeeType(row.feeType) : row.title}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-900">Rs. {Number(amountValue || 0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-slate-700">{isPaid ? formatDate(row.paidAt) : "-"}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                            isPaid
                              ? "border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                              : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
                          }`}
                          onClick={() => (isPaid ? openSlip(row._id, false) : null)}
                          disabled={!isPaid}
                          title="View slip"
                          aria-label="View slip"
                        >
                          <IconSlip className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                            "border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                          }`}
                          onClick={() => openPortfolio(student)}
                          title="View student portfolio"
                          aria-label="View student portfolio"
                        >
                          <IconEye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                            isPaid
                              ? "border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                              : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
                          }`}
                          onClick={() => (isPaid ? openSlip(row._id, true) : null)}
                          disabled={!isPaid}
                          title="Print slip"
                          aria-label="Print slip"
                        >
                          <IconPrint className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-slate-500">
                  {statusFilter === "PENDING" ? "No pending fees found for this class." : "No payments yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <TablePagination
          page={page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPrev={() => setPage(Math.max(page - 1, 1))}
          onNext={() => setPage(Math.min(page + 1, pagination.totalPages))}
        />
      </div>

      <FormModal
        open={showReceiveModal}
        title={
          <span className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-blue-100 bg-blue-50 text-blue-600">
              <IconReceipt className="h-4 w-4" />
            </span>
            <span className="text-lg font-bold text-slate-950">Collect Pending Fees</span>
          </span>
        }
        onClose={() => setShowReceiveModal(false)}
        maxWidthClass="max-w-4xl"
      >
        <form onSubmit={onReceive} className="-mx-6 -mb-6 text-sm text-slate-950">
          <div className="space-y-3 px-6 pb-4">
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="relative">
                <label className="mb-1 block text-sm font-semibold text-slate-950">
                  Select Student <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  className="flex h-12 w-full items-center gap-3 rounded-md border border-slate-300 bg-white px-3.5 text-left shadow-sm transition hover:border-blue-300"
                  onClick={() => {
                    setStudentMenuOpen((open) => !open);
                    setFeeMenuOpen(false);
                    setPaymentMenuOpen(false);
                  }}
                >
                  <IconUser className="h-5 w-5 shrink-0 text-blue-600" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-950">
                      {selectedStudent
                        ? `${selectedStudent.firstName} ${selectedStudent.lastName} (${selectedStudent.admissionNo || selectedStudent.rollNumber || "No ID"})`
                        : "Select Student"}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {selectedStudent
                        ? `${selectedStudent.className?.replace(/^Grade\s*/i, "Class ") || "Class"} - ${selectedStudent.section || "A"}   |   Roll No. ${selectedStudent.rollNumber || "-"}`
                        : "Student Names, Class + Section"}
                    </span>
                  </span>
                  <IconChevron className="h-4 w-4 shrink-0 text-slate-500" />
                </button>
                {studentMenuOpen ? (
                  <div className="absolute left-0 right-0 top-[68px] z-40 max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white py-1.5 shadow-xl">
                    {visibleModalStudents.map((student) => (
                      <button
                        key={student._id}
                        type="button"
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm hover:bg-blue-50"
                        onClick={() => {
                          setPayForm({ ...emptyPay, studentId: student._id });
                          setSelectedPendingIds([]);
                          loadStudentPendingFees(student._id);
                          setStudentMenuOpen(false);
                          setPaymentMenuOpen(true);
                        }}
                      >
                        <IconUser className="h-4 w-4 text-blue-600" />
                        <span>
                          <span className="block font-semibold text-slate-950">
                            {student.firstName} {student.lastName}
                          </span>
                          <span className="text-xs text-slate-500">
                            {student.className} - {student.section || "A"}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <label className="mb-1 block text-sm font-semibold text-slate-950">
                  Select View Fees <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  className="flex h-12 w-full items-center gap-3 rounded-md border border-slate-300 bg-white px-3.5 text-left shadow-sm transition hover:border-blue-300"
                  onClick={() => {
                    setFeeMenuOpen((open) => !open);
                    setStudentMenuOpen(false);
                    setPaymentMenuOpen(false);
                  }}
                  disabled={!payForm.studentId}
                >
                  <IconReceipt className="h-5 w-5 shrink-0 text-blue-600" />
                  <span className="flex-1 truncate text-sm font-semibold text-slate-950">
                    {pendingFeeViewFilter === "ALL"
                      ? "All Pending Fees"
                      : pendingFeeViewFilter === "FINE"
                        ? "Fine"
                        : `${pendingFeeViewFilter.charAt(0)}${pendingFeeViewFilter.slice(1).toLowerCase()} Fee`}
                  </span>
                  <IconChevron className="h-4 w-4 shrink-0 text-slate-500" />
                </button>
                {feeMenuOpen ? (
                  <div className="absolute left-0 right-0 top-[68px] z-40 overflow-hidden rounded-md border border-slate-200 bg-white py-1.5 shadow-xl">
                    {[
                      ["ALL", "All Pending Fees"],
                      ["MONTHLY", "Monthly Fee"],
                      ["ANNUAL", "Annual Fee"],
                      ["ADMISSION", "Admission Fee"],
                      ["FINE", "Fine"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm font-medium hover:bg-blue-50"
                        onClick={() => {
                          setPendingFeeViewFilter(value);
                          setFeeMenuOpen(false);
                        }}
                      >
                        <IconReceipt className="h-4 w-4 text-blue-600" />
                        {label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex min-h-[40px] items-center gap-2.5 rounded-md border border-blue-200 bg-blue-50/70 px-3.5 text-sm text-slate-950">
              <IconInfo className="h-4 w-4 shrink-0 text-blue-600" />
              <span>Below is the list of all pending fees for the selected student.</span>
            </div>

            <div className="overflow-hidden rounded-md border border-slate-300 bg-white">
              <div className="max-h-[220px] overflow-y-auto">
                <table className="min-w-full table-fixed text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-left text-slate-950">
                    <tr className="h-10 border-b border-slate-200">
                      <th className="w-[5%] px-3 font-semibold">#</th>
                      <th className="w-[12%] px-3 font-semibold">Fee Type</th>
                      <th className="w-[25%] px-3 font-semibold">Fee Name</th>
                      <th className="w-[20%] px-3 font-semibold">For Period / Session</th>
                      <th className="w-[16%] px-3 font-semibold">Due Date</th>
                      <th className="w-[14%] px-3 font-semibold">Amount (₹)</th>
                      <th className="w-[8%] px-3 text-center font-semibold">Select</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!payForm.studentId ? (
                      <tr>
                        <td colSpan={7} className="h-[120px] px-3 text-center text-slate-500">
                          Select a student to view pending fees.
                        </td>
                      </tr>
                    ) : visiblePendingFees.length ? (
                      visiblePendingFees.map((fee, index) => {
                        const badge = getFeeTypeBadge(fee);
                        const itemKey = getPendingItemKey(fee);
                        const checked = selectedPendingIds.includes(itemKey);
                        const pendingAmount = getPendingItemAmount(fee);
                        return (
                          <tr key={fee._id} className="h-11 border-b border-slate-200 last:border-b-0">
                            <td className="px-3 text-slate-950">{index + 1}</td>
                            <td className="px-3">
                              <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-3 text-slate-950">{fee.kind === "FINE" ? fee.title || fee.reason || "Fine" : fee.title || getFeeLabel(fee)}</td>
                            <td className="px-3 text-center text-slate-950">{formatPeriod(fee)}</td>
                            <td className="px-3">
                              <span className={isOverdue(fee.dueDate) ? "text-red-600" : "text-slate-950"}>
                                {formatDueDate(fee.dueDate)}
                                {isOverdue(fee.dueDate) ? <span className="block text-xs">(Overdue)</span> : null}
                              </span>
                            </td>
                            <td className="px-3 font-semibold text-emerald-700">₹ {pendingAmount.toLocaleString()}.00</td>
                            <td className="px-3 text-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                                checked={checked}
                                onChange={() => {
                                  setSelectedPendingIds((current) =>
                                    checked ? current.filter((id) => id !== itemKey) : [...current, itemKey]
                                  );
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="h-[120px] px-3 text-center text-slate-500">
                          No pending fees found for this student.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex min-h-[52px] items-center justify-end rounded-md border border-emerald-100 bg-emerald-50/70 px-3.5">
              <div className="mr-8 text-left">
                <p className="text-base font-bold text-slate-950">Grand Total</p>
                <p className="text-xs text-slate-500">( {selectedPendingFees.length} item(s) selected )</p>
              </div>
              <div className="min-w-[130px] text-right text-xl font-bold text-emerald-700">
                ₹ {grandTotal.toLocaleString()}.00
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="relative">
                <label className="mb-1 block text-sm font-semibold text-slate-950">
                  Select Payment Method <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  className={`flex h-10 w-full items-center gap-3 rounded-md border bg-white px-3.5 text-left shadow-sm transition ${
                    paymentMenuOpen ? "border-blue-500 ring-1 ring-blue-500" : "border-slate-300 hover:border-blue-300"
                  }`}
                  onClick={() => {
                    setPaymentMenuOpen((open) => !open);
                    setStudentMenuOpen(false);
                    setFeeMenuOpen(false);
                  }}
                >
                  <IconCard className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className={`flex-1 truncate text-sm ${selectedPaymentMethod ? "font-semibold text-slate-950" : "text-slate-500"}`}>
                    {selectedPaymentMethod?.label || "Select Payment Method"}
                  </span>
                  <IconChevron className="h-4 w-4 shrink-0 text-slate-500" />
                </button>
                {paymentMenuOpen ? (
                  <div className="absolute left-0 right-0 top-[66px] z-50 overflow-hidden rounded-md border border-slate-200 bg-white py-1.5 shadow-xl">
                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className="flex h-10 w-full items-center gap-3 px-3.5 text-left text-sm font-medium text-slate-950 hover:bg-blue-50"
                        onClick={() => {
                          setPayForm({ ...payForm, paymentMethod: option.value });
                          setPaymentMenuOpen(false);
                        }}
                      >
                        {option.value === "CASH" ? (
                          <IconCash className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <IconGlobe className="h-4 w-4 text-blue-600" />
                        )}
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-950">Notes (Optional)</label>
                <input
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3.5 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter notes (optional)..."
                  value={payForm.remarks}
                  onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3">
            <button
              type="button"
              className="h-10 min-w-[100px] rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-100"
              onClick={() => setShowReceiveModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 min-w-[160px] rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving || !selectedPendingFees.length || !payForm.paymentMethod}
            >
              {saving ? "Processing..." : "Receive Payment"}
            </button>
          </div>
        </form>
      </FormModal>

      {portfolioStudent ? (
        <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-[2px]">
          <div className="modal-panel-enter w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-4">
                <StudentAvatar student={portfolioProfile} />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {portfolioProfile?.firstName || portfolioStudent.firstName} {portfolioProfile?.lastName || portfolioStudent.lastName}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {portfolioProfile?.admissionNo || portfolioStudent.admissionNo || portfolioStudent.rollNumber || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 px-6 py-5 text-sm md:grid-cols-2">
              {[
                ["Father", portfolioProfile?.fatherName || portfolioProfile?.guardianName || "-"],
                ["Mobile", portfolioProfile?.guardianPhone || portfolioProfile?.phoneNumber || "-"],
                ["CNIC", portfolioProfile?.cnicBForm || "-"],
                ["Class", formatClassSection(portfolioProfile?.className, portfolioProfile?.section)],
                ["Stream", streamLabel(portfolioProfile)],
                ["Address", portfolioProfile?.address || "-"],
              ].map(([label, value]) => (
                <div key={label} className={label === "Address" ? "md:col-span-2" : ""}>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="font-medium text-slate-800">{value}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 px-6 py-5">
              <h4 className="text-sm font-semibold text-slate-800">Fee Summary</h4>
              {portfolioLoading ? (
                <p className="mt-3 text-sm text-slate-500">Loading fee records...</p>
              ) : portfolioData ? (
                <>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Monthly Fee</p>
                      <p className="font-bold text-slate-800">Rs. {portfolioSummary?.monthlyFee?.toLocaleString() || 0}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Admission Fee</p>
                      <p className="font-bold text-slate-800">Rs. {portfolioSummary?.admissionFee?.toLocaleString() || 0}</p>
                    </div>
                    <div className="rounded-lg bg-orange-50 p-3">
                      <p className="text-xs text-orange-600">Total Pending</p>
                      <p className="font-bold text-orange-700">Rs. {portfolioSummary?.totalPending?.toLocaleString() || 0}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-3">
                      <p className="text-xs text-emerald-600">Total Paid</p>
                      <p className="font-bold text-emerald-700">Rs. {portfolioSummary?.totalPaid?.toLocaleString() || 0}</p>
                    </div>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-left text-slate-500">
                        <tr>
                          <th className="px-4 py-2 font-medium">Month / Fee</th>
                          <th className="px-4 py-2 font-medium">Type</th>
                          <th className="px-4 py-2 font-medium">Amount</th>
                          <th className="px-4 py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolioRecords.length ? (
                          portfolioRecords.map((row) => (
                            <tr key={row.id} className="border-t border-slate-100">
                              <td className="px-4 py-2 text-slate-700">{row.month || row.title}</td>
                              <td className="px-4 py-2 text-slate-700">{labelFeeType(row.feeType)}</td>
                              <td className="px-4 py-2 text-slate-700">Rs. {Number(row.amount || 0).toLocaleString()}</td>
                              <td className="px-4 py-2">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${row.status === "PAID" ? "bg-emerald-50 text-emerald-700" : row.status === "PARTIAL" ? "bg-orange-50 text-orange-700" : "bg-orange-50 text-orange-700"}`}>
                                  {row.status === "PAID" ? "Paid" : row.status === "PARTIAL" ? "Partial" : "Pending"}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-slate-500">
                              No fee records yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Fee data not available.</p>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 px-6 py-4">
              <button type="button" className="ref-btn-primary" onClick={closePortfolio}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {slip ? <FeeReceiptSlip slip={slip} onClose={() => setSlip(null)} /> : null}

      <FeeScheduleModal
        open={showFeeScheduleModal}
        onClose={() => setShowFeeScheduleModal(false)}
        dark={dark}
        branchSection={branchSection}
      />
    </section>
  );
}
