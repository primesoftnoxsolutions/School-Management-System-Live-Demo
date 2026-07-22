import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import api from "../services/api/client";
import FormModal from "../components/ui/FormModal";
import ModernDatePicker from "../components/ui/ModernDatePicker";
import PageHeader from "../components/ui/PageHeader";
import TablePagination from "../components/ui/TablePagination";
import ScrollableSelect from "../components/ui/ScrollableSelect";
import { IconEye, IconPrint } from "../../components/icons/NavIcons";
import { MONTHS, PAYMENT_METHODS, labelPayment } from "../constants/finance";

const emptyForm = {
  staffId: "",
  month: MONTHS[new Date().getMonth()],
  year: new Date().getFullYear(),
  basicSalary: "",
  paySalary: "",
  allowances: "0",
  deductions: "0",
  bonus: "0",
  paymentMethod: "BANK",
  transactionRef: "",
  remarks: "",
};

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid / Cleared" },
  { value: "PARTIAL", label: "Partially Paid" },
];

const POLL_MS = 8000;

const IconSlip = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 3h10v18l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2V3Z" />
    <path d="M9 8h6M9 12h6M9 16h4" />
  </svg>
);

const formatDate = (date) => {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const currency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getStatusMeta = (status) => {
  if (status === "PAID") return { label: "Paid / Cleared", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  if (status === "PARTIAL") return { label: "Partially Paid", className: "border-blue-200 bg-blue-50 text-blue-700" };
  return { label: "Pending", className: "border-amber-200 bg-amber-50 text-amber-700" };
};

const getPaidSalary = (item) => Number(item?.totalPaidSalary ?? (item?.status === "PAID" ? item.netSalary : 0) ?? 0);
const getRemainingSalary = (item) =>
  Math.max(Number(item?.remainingSalary ?? Number(item?.basicSalary || 0) - getPaidSalary(item)), 0);
const getEntryRemainingSalary = (item) =>
  Math.max(Number(item?.remainingAtPayment ?? item?.remainingSalary ?? Number(item?.basicSalary || 0) - Number(item?.paySalary || 0)), 0);
const getDisplayStatus = (item) => item?.displayStatus || (getRemainingSalary(item) > 0 ? "PENDING" : "PAID");

function DashboardCard({ label, value, dark }) {
  return (
    <div className={`rounded-2xl border p-4 ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white shadow-sm"}`}>
      <p className={`text-xs font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{label}</p>
      <p className={`mt-1 text-lg font-bold ${dark ? "text-white" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function SummaryTile({ label, value, className, dark = false }) {
  return (
    <div className={`rounded-xl px-4 py-3 ${className}`}>
      <p className={`text-xs font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function SalarySummary({ item, dark = false }) {
  if (!item) return null;
  const paidSalary = getPaidSalary(item);
  const remainingSalary = getRemainingSalary(item);
  const paymentRows = Array.isArray(item.salaryPayments) ? item.salaryPayments : [];
  const rows = [
    { title: `${item.month} ${item.year}`, type: "Basic Salary", amount: item.basicSalary, status: "Earning" },
    ...paymentRows.map((payment, index) => ({
      title: formatDate(payment.paidAt),
      type: `Paid Salary ${index + 1}`,
      amount: payment.netSalary,
      status: "PAID",
    })),
    ...(item.status !== "PAID"
      ? [{ title: `${item.month} ${item.year}`, type: "Pending Pay Salary", amount: item.netSalary, status: "PENDING" }]
      : []),
    { title: `${item.month} ${item.year}`, type: "Remaining Salary", amount: remainingSalary, status: getDisplayStatus(item) },
  ];

  return (
    <div className={`space-y-4 text-sm ${dark ? "text-[#e2e8f0]" : "text-slate-700"}`}>
      <div>
        <h3 className={`text-base font-bold ${dark ? "text-white" : "text-slate-900"}`}>Salary Summary</h3>
        <p className={`mt-1 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
          {item.staffName} | {item.designation || item.staffRole} | {item.employeeCode || "-"}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile label="Basic Salary" value={currency(item.basicSalary)} className={dark ? "bg-[#1a1b26] text-white" : "bg-slate-50 text-slate-900"} dark={dark} />
        <SummaryTile label="Pay Salary" value={currency(item.paySalary ?? item.netSalary)} className={dark ? "bg-[#1a1b26] text-white" : "bg-slate-50 text-slate-900"} dark={dark} />
        <SummaryTile label="Remaining Salary" value={currency(remainingSalary)} className="bg-orange-50 text-orange-700" dark={dark} />
        <SummaryTile label="Total Paid" value={currency(paidSalary)} className="bg-emerald-50 text-emerald-700" dark={dark} />
      </div>
      <div className={`overflow-hidden rounded-xl border ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
        <table className="min-w-full text-sm">
          <thead className={`text-left ${dark ? "bg-[#1a1b26] text-[#9e9e9e]" : "bg-slate-50 text-slate-500"}`}>
            <tr>
              <th className="px-4 py-3 font-semibold">Month / Salary</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const statusMeta =
                row.status === "PAID" || row.status === "Earning"
                  ? { label: row.status === "PAID" ? "Paid" : "Earning", className: "bg-emerald-50 text-emerald-700" }
                  : { label: "Pending", className: "bg-orange-50 text-orange-700" };
              return (
                <tr key={`${row.type}-${row.title}`} className={`border-t ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
                  <td className={`px-4 py-3 font-medium ${dark ? "text-[#e2e8f0]" : "text-slate-700"}`}>{row.title}</td>
                  <td className={`px-4 py-3 ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>{row.type}</td>
                  <td className={`px-4 py-3 font-semibold ${dark ? "text-white" : "text-slate-800"}`}>{currency(row.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SalaryReceipt({ item, dark = false }) {
  if (!item) return null;
  return (
    <div className={`overflow-hidden rounded-2xl border text-sm ${dark ? "border-white/[0.06] bg-[#1a1b26] text-[#e2e8f0]" : "border-slate-200 bg-white text-slate-700"}`}>
      <div className="bg-slate-950 px-6 py-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Payslip / Paid Salary Receipt</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-2xl font-bold">{item.staffName}</h3>
            <p className="text-sm text-slate-300">
              {item.designation || item.staffRole} · {item.employeeCode || "-"} · {item.campus || "Campus N/A"}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-slate-300">{item.month} {item.year}</p>
            <p className="text-xl font-bold text-emerald-300">{currency(item.netSalary)}</p>
            <p className="mt-1 text-xs text-slate-400">Payslip: {item.payslipNo || "-"}</p>
          </div>
        </div>
      </div>
      <div className={`grid gap-0 border-b sm:grid-cols-4 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
        <ReceiptMetric label="Basic Salary" value={currency(item.basicSalary)} dark={dark} />
        <ReceiptMetric label="Paid Date" value={formatDate(item.paidAt)} dark={dark} />
        <ReceiptMetric label="Payment Method" value={labelPayment(item.paymentMethod)} dark={dark} />
        <ReceiptMetric label="Processed By" value={item.processedByName || "-"} dark={dark} />
      </div>
      <div className="space-y-3 p-6">
        <ReceiptRow label="Allowances" value={currency(item.allowances)} dark={dark} />
        <ReceiptRow label="Pay Salary" value={currency(item.paySalary ?? item.netSalary)} dark={dark} />
        <ReceiptRow label="Bonus" value={currency(item.bonus)} dark={dark} />
        <ReceiptRow label="Deductions" value={`- ${currency(item.deductions)}`} dark={dark} />
        <ReceiptRow label="Transaction Ref" value={item.transactionRef || "-"} dark={dark} />
        <div className={`border-t pt-3 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
          <ReceiptRow label="Net Paid Salary" value={currency(item.netSalary)} strong dark={dark} />
        </div>
        <ReceiptRow label="Remaining Salary" value={currency(getRemainingSalary(item))} dark={dark} />
      </div>
    </div>
  );
}

function ReceiptMetric({ label, value, dark = false }) {
  return (
    <div className={`border-b px-6 py-4 sm:border-b-0 sm:border-r last:sm:border-r-0 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
      <p className={`text-xs font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-400"}`}>{label}</p>
      <p className={`mt-1 font-bold ${dark ? "text-white" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function ReceiptRow({ label, value, strong = false, dark = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? (dark ? "font-bold text-white" : "font-bold text-slate-950") : dark ? "text-[#9e9e9e]" : "text-slate-500"}>{label}</span>
      <span className={strong ? "text-xl font-bold text-emerald-500" : dark ? "font-semibold text-white" : "font-semibold text-slate-800"}>{value}</span>
    </div>
  );
}

export default function PayrollPage({ role, dark = false, branchSection = "Boys" }) {
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [receiptItem, setReceiptItem] = useState(null);
  const [summaryItem, setSummaryItem] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

  const groupedItems = useMemo(() => {
    const groups = new Map();
    items.forEach((item, index) => {
      const key = `${item.staffId}-${item.month}-${item.year}`;
      const paidSalary = Number(item.status === "PAID" ? item.paySalary ?? item.netSalary ?? 0 : 0);
      const paidNetSalary = Number(item.status === "PAID" ? item.netSalary || 0 : 0);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          index,
          staffId: item.staffId,
          staffName: item.staffName,
          staffRole: item.staffRole,
          employeeCode: item.employeeCode,
          department: item.department,
          designation: item.designation,
          campus: item.campus,
          month: item.month,
          year: item.year,
          basicSalary: Number(item.basicSalary || 0),
          allowances: Number(item.allowances || 0),
          deductions: Number(item.deductions || 0),
          totalNetSalary: Number(item.netSalary || 0),
          totalPaidSalary: paidSalary,
          totalPaidNetSalary: paidNetSalary,
          remainingSalary: getRemainingSalary(item),
          status: getDisplayStatus(item),
          paymentMethod: item.paymentMethod,
          paidAt: item.paidAt,
          payslipNo: item.payslipNo,
          processedByName: item.processedByName,
          transactionRef: item.transactionRef,
          entries: [item],
        });
        return;
      }
      const group = groups.get(key);
      group.totalNetSalary += Number(item.netSalary || 0);
      group.totalPaidSalary += paidSalary;
      group.totalPaidNetSalary += paidNetSalary;
      group.remainingSalary = Math.min(group.remainingSalary, getRemainingSalary(item));
      group.status = group.remainingSalary > 0 && group.totalPaidSalary > 0 ? "PARTIAL" : group.remainingSalary > 0 ? "PENDING" : "PAID";
      group.entries.push(item);
    });

    return [...groups.values()]
      .map((group) => ({
        ...group,
        entries: group.entries.sort((a, b) => new Date(b.createdAt || b.paidAt || 0) - new Date(a.createdAt || a.paidAt || 0)),
      }))
      .sort((a, b) => a.index - b.index);
  }, [items]);

  const pendingEmployeeSummary = useMemo(() => {
    if (statusFilter !== "PENDING" && statusFilter !== "PARTIAL") return [];
    const map = new Map();
    groupedItems.forEach((group) => {
      if (group.status !== "PENDING" && group.status !== "PARTIAL") return;
      const key = String(group.staffId);
      if (!map.has(key)) {
        map.set(key, {
          staffName: group.staffName,
          employeeCode: group.employeeCode,
          designation: group.designation || group.staffRole,
          campus: group.campus || "-",
          months: [],
          totalOutstanding: 0,
        });
      }
      const row = map.get(key);
      row.months.push(`${group.month} ${group.year}`);
      row.totalOutstanding += Number(group.remainingSalary || 0);
    });
    return [...map.values()];
  }, [groupedItems, statusFilter]);

  const loadDashboard = useCallback(async () => {
    try {
      const { data } = await api.get("/payroll/dashboard");
      setDashboard(data.data || null);
    } catch {
      // Keep previous dashboard values if refresh fails.
    }
  }, []);

  const load = useCallback(
    async (nextPage = page) => {
      setLoading(true);
      try {
        const { data } = await api.get("/payroll", {
          params: {
            page: nextPage,
            limit: 10,
            search: search.trim() || undefined,
            status: statusFilter || undefined,
            from: fromDate || undefined,
            to: toDate || undefined,
          },
        });
        setItems(data.data.items || []);
        setExpandedRows({});
        setPagination({ total: data.data.total || 0, totalPages: data.data.totalPages || 1 });
        setError("");
      } catch {
        setItems([]);
        setPagination({ total: 0, totalPages: 1 });
      } finally {
        setLoading(false);
      }
    },
    [page, search, statusFilter, fromDate, toDate]
  );

  useEffect(() => {
    api
      .get("/payroll/staff")
      .then((r) => {
        const list = r.data.data || [];
        setStaff(
          list.filter((item) => {
            const itemBranch = String(item.branch || item.campus || "").trim();
            if (!branchSection) return true;
            if (itemBranch !== "Boys" && itemBranch !== "Girls") return true;
            return itemBranch === branchSection;
          })
        );
      })
      .catch(() => setStaff([]));
  }, [branchSection]);

  useEffect(() => {
    load(page);
    loadDashboard();
  }, [load, loadDashboard, page]);

  useEffect(() => {
    const timer = setInterval(() => {
      load(page);
      loadDashboard();
    }, POLL_MS);
    const onFocus = () => {
      load(page);
      loadDashboard();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [load, loadDashboard, page]);

  const netPreview = Math.max(
    Number(form.paySalary || 0) + Number(form.allowances || 0) + Number(form.bonus || 0) - Number(form.deductions || 0),
    0
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/payroll", form);
      setForm(emptyForm);
      setShowModal(false);
      setPage(1);
      await Promise.all([load(1), loadDashboard()]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create payroll");
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (id) => {
    try {
      await api.post(`/payroll/${id}/pay`);
      await Promise.all([load(page), loadDashboard()]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark paid");
    }
  };

  const printReceipt = (item) => {
    if (!item || item.status !== "PAID") return;
    const remainingSalary = getRemainingSalary(item);
    const receiptHtml = `
      <html>
        <head>
          <title>Payslip ${escapeHtml(item.payslipNo || "")}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 32px; background: #f8fafc; }
            .receipt { max-width: 760px; margin: 0 auto; overflow: hidden; border: 1px solid #e2e8f0; border-radius: 18px; background: #fff; }
            .hero { background: #020617; color: #fff; padding: 28px; }
            .hero p { margin: 0; color: #bfdbfe; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
            h1 { margin: 10px 0 4px; font-size: 28px; }
            .muted { color: #cbd5e1; margin: 0; }
            .amount { margin-top: 16px; color: #6ee7b7; font-size: 28px; font-weight: 800; }
            .metrics { display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 1px solid #e2e8f0; }
            .metric { padding: 16px 18px; border-right: 1px solid #e2e8f0; }
            .metric:last-child { border-right: 0; }
            .label { color: #64748b; font-size: 12px; margin-bottom: 6px; }
            .value { font-weight: 700; font-size: 13px; }
            .body { padding: 26px; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; }
            .total { border-top: 1px solid #e2e8f0; margin-top: 8px; padding-top: 14px; font-size: 20px; color: #047857; font-weight: 800; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="hero">
              <p>Insaaf Grammar High School · Payslip</p>
              <h1>${escapeHtml(item.staffName)}</h1>
              <div class="muted">${escapeHtml(item.designation || item.staffRole)} | ${escapeHtml(item.employeeCode || "-")} | ${escapeHtml(item.month)} ${escapeHtml(item.year)}</div>
              <div class="amount">${currency(item.netSalary)}</div>
            </div>
            <div class="metrics">
              <div class="metric"><div class="label">Basic Salary</div><div class="value">${currency(item.basicSalary)}</div></div>
              <div class="metric"><div class="label">Paid Date</div><div class="value">${escapeHtml(formatDate(item.paidAt))}</div></div>
              <div class="metric"><div class="label">Payment Method</div><div class="value">${escapeHtml(labelPayment(item.paymentMethod))}</div></div>
              <div class="metric"><div class="label">Payslip No</div><div class="value">${escapeHtml(item.payslipNo || "-")}</div></div>
            </div>
            <div class="body">
              <div class="row"><span>Campus</span><strong>${escapeHtml(item.campus || "-")}</strong></div>
              <div class="row"><span>Department</span><strong>${escapeHtml(item.department || "-")}</strong></div>
              <div class="row"><span>Allowances</span><strong>${currency(item.allowances)}</strong></div>
              <div class="row"><span>Pay Salary</span><strong>${currency(item.paySalary ?? item.netSalary)}</strong></div>
              <div class="row"><span>Bonus</span><strong>${currency(item.bonus)}</strong></div>
              <div class="row"><span>Deductions</span><strong>- ${currency(item.deductions)}</strong></div>
              <div class="row"><span>Transaction Ref</span><strong>${escapeHtml(item.transactionRef || "-")}</strong></div>
              <div class="row"><span>Processed By</span><strong>${escapeHtml(item.processedByName || "-")}</strong></div>
              <div class="row total"><span>Net Paid Salary</span><span>${currency(item.netSalary)}</span></div>
              <div class="row"><span>Remaining Salary</span><strong>${currency(remainingSalary)}</strong></div>
            </div>
          </div>
          <script>window.print(); window.onafterprint = () => window.close();</script>
        </body>
      </html>
    `;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    printWindow?.document.write(receiptHtml);
    printWindow?.document.close();
  };

  const downloadPayslipPdf = (item) => {
    if (!item || item.status !== "PAID") return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Insaaf Grammar High School", 14, 18);
    doc.setFontSize(12);
    doc.text("Payslip / Salary Receipt", 14, 26);
    doc.setFontSize(11);
    const lines = [
      `Employee: ${item.staffName}`,
      `Employee ID: ${item.employeeCode || "-"}`,
      `Department: ${item.department || "-"}`,
      `Designation: ${item.designation || item.staffRole || "-"}`,
      `Campus: ${item.campus || "-"}`,
      `Salary Period: ${item.month} ${item.year}`,
      `Basic Salary: ${currency(item.basicSalary)}`,
      `Allowances: ${currency(item.allowances)}`,
      `Deductions: ${currency(item.deductions)}`,
      `Bonus: ${currency(item.bonus)}`,
      `Net Salary: ${currency(item.netSalary)}`,
      `Payment Date: ${formatDate(item.paidAt)}`,
      `Payment Method: ${labelPayment(item.paymentMethod)}`,
      `Payslip No: ${item.payslipNo || "-"}`,
      `Transaction Ref: ${item.transactionRef || "-"}`,
      `Processed By: ${item.processedByName || "-"}`,
    ];
    lines.forEach((line, index) => doc.text(line, 14, 40 + index * 8));
    doc.save(`${item.payslipNo || "payslip"}.pdf`);
  };

  const toggleRow = (key) => {
    setExpandedRows((current) => ({ ...current, [key]: !current[key] }));
  };

  const dashboardCards = [
    ["Total Salary Paid", currency(dashboard?.totalSalaryPaid)],
    ["Total Pending Salary", currency(dashboard?.totalPendingSalary)],
    ["Payroll Processed This Month", dashboard?.totalPayrollProcessedThisMonth ?? 0],
    ["Employees Paid", dashboard?.totalEmployeesPaid ?? 0],
    ["Employees Pending", dashboard?.totalEmployeesPending ?? 0],
    ["Payroll This Year", currency(dashboard?.payrollThisYear)],
  ];

  return (
    <section className="space-y-6">
      <PageHeader
        title="Payroll"
        subtitle="Payroll dashboard, salary history and payslip management."
        dark={dark}
        actionLabel="Create Payroll"
        onAction={() => setShowModal(true)}
        afterAction={
          <div className="flex flex-wrap items-end justify-end gap-2">
            <div className="min-w-[160px]">
              <label className={`mb-1 block text-xs font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>Search</label>
              <input
                className="ref-input"
                placeholder="Employee name / ID / payslip"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="min-w-[160px]">
              <ScrollableSelect
                label="Status"
                value={statusFilter}
                options={STATUS_OPTIONS}
                onChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
                portal
                menuMaxHeight={220}
                dark={dark}
              />
            </div>
            <div className="min-w-[140px]">
              <ModernDatePicker
                label="From Date"
                value={fromDate}
                onChange={(value) => {
                  setFromDate(value);
                  setPage(1);
                }}
                dark={dark}
              />
            </div>
            <div className="min-w-[140px]">
              <ModernDatePicker
                label="To Date"
                value={toDate}
                onChange={(value) => {
                  setToDate(value);
                  setPage(1);
                }}
                dark={dark}
              />
            </div>
          </div>
        }
      />

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-3">
        {dashboardCards.map(([label, value]) => (
          <DashboardCard key={label} label={label} value={value} dark={dark} />
        ))}
      </div>

      {(statusFilter === "PENDING" || statusFilter === "PARTIAL") && pendingEmployeeSummary.length ? (
        <div className={`rounded-2xl border p-5 ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white shadow-sm"}`}>
          <h3 className={`text-base font-semibold ${dark ? "text-white" : "text-slate-800"}`}>Pending Salary Overview</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className={`text-left ${dark ? "bg-[#1a1b26] text-[#9e9e9e]" : "bg-slate-50 text-slate-500"}`}>
                <tr>
                  {["Employee", "Designation", "Campus", "Pending Months", "Months", "Outstanding"].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-medium">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingEmployeeSummary.map((row) => (
                  <tr key={`${row.staffName}-${row.employeeCode}`} className={`border-t ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
                    <td className={`px-4 py-3 font-medium ${dark ? "text-white" : "text-slate-800"}`}>{row.staffName}</td>
                    <td className="px-4 py-3">{row.designation}</td>
                    <td className="px-4 py-3">{row.campus}</td>
                    <td className="px-4 py-3">{row.months.length}</td>
                    <td className="px-4 py-3">{row.months.join(", ")}</td>
                    <td className="px-4 py-3 font-semibold text-orange-500">{currency(row.totalOutstanding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className={`overflow-hidden rounded-2xl border p-0 ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white shadow-sm"}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1680px] border-collapse text-left text-sm">
            <thead>
              <tr className={dark ? "bg-[#1a1b26] text-[#9e9e9e]" : "bg-slate-50 text-slate-500"}>
                {[
                  "Employee",
                  "Emp ID",
                  "Department",
                  "Designation",
                  "Campus",
                  "Month",
                  "Year",
                  "Basic Salary",
                  "Allowances",
                  "Deductions",
                  "Net Salary",
                  "Payment Date",
                  "Payment Method",
                  "Status / Payslip",
                  "Action",
                ].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wide first:pl-5 last:pr-5">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={dark ? "divide-y divide-white/[0.06]" : "divide-y divide-slate-100"}>
              {loading ? (
                <tr>
                  <td colSpan={15} className={`px-5 py-6 ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                    Loading payroll records...
                  </td>
                </tr>
              ) : groupedItems.length ? (
                groupedItems.map((group) => {
                  const isExpanded = Boolean(expandedRows[group.key]);
                  const statusMeta = getStatusMeta(group.status);
                  const firstPending = group.entries.find((entry) => entry.status !== "PAID");
                  const latestPaidEntry = group.entries.find((entry) => entry.status === "PAID");
                  const fullReceiptItem = {
                    ...group.entries[0],
                    status: latestPaidEntry ? "PAID" : group.status,
                    paidAt: latestPaidEntry?.paidAt || group.entries[0]?.paidAt,
                    netSalary: group.totalPaidNetSalary || group.totalNetSalary,
                    paySalary: group.totalPaidSalary,
                    totalPaidSalary: group.totalPaidSalary,
                    remainingSalary: group.remainingSalary,
                    displayStatus: group.status,
                    payslipNo: latestPaidEntry?.payslipNo || group.payslipNo,
                    processedByName: latestPaidEntry?.processedByName || group.processedByName,
                  };
                  const summaryItemForGroup = {
                    ...group.entries[0],
                    netSalary: group.totalNetSalary,
                    paySalary: group.totalNetSalary,
                    totalPaidSalary: group.totalPaidSalary,
                    remainingSalary: group.remainingSalary,
                    displayStatus: group.status,
                    salaryPayments: group.entries
                      .filter((entry) => entry.status === "PAID")
                      .map((entry) => ({
                        _id: entry._id,
                        month: entry.month,
                        year: entry.year,
                        paySalary: Number(entry.paySalary ?? entry.netSalary ?? 0),
                        netSalary: Number(entry.netSalary || 0),
                        paymentMethod: entry.paymentMethod,
                        paidAt: entry.paidAt,
                        payslipNo: entry.payslipNo,
                        remarks: entry.remarks,
                      })),
                  };

                  return (
                    <Fragment key={group.key}>
                      <tr className={dark ? "bg-[#161722] text-[#e2e8f0]" : "bg-white text-slate-700"}>
                        <td className={`whitespace-nowrap px-3 py-3 first:pl-5 ${dark ? "text-white" : "text-slate-700"}`}>
                          <span className="inline-flex items-center gap-2 font-medium">
                            <button
                              type="button"
                              onClick={() => toggleRow(group.key)}
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${dark ? "border-white/[0.06]" : "border-slate-200"}`}
                              aria-label={isExpanded ? "Collapse" : "Expand"}
                            >
                              <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                            {group.staffName}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">{group.employeeCode || "-"}</td>
                        <td className="whitespace-nowrap px-3 py-3">{group.department || "-"}</td>
                        <td className="whitespace-nowrap px-3 py-3">{group.designation || group.staffRole || "-"}</td>
                        <td className="whitespace-nowrap px-3 py-3">{group.campus || "-"}</td>
                        <td className="whitespace-nowrap px-3 py-3">{group.month}</td>
                        <td className="whitespace-nowrap px-3 py-3">{group.year}</td>
                        <td className="whitespace-nowrap px-3 py-3">{currency(group.basicSalary)}</td>
                        <td className="whitespace-nowrap px-3 py-3">{currency(group.allowances)}</td>
                        <td className="whitespace-nowrap px-3 py-3">{currency(group.deductions)}</td>
                        <td className={`whitespace-nowrap px-3 py-3 font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{currency(group.totalNetSalary)}</td>
                        <td className="whitespace-nowrap px-3 py-3">{formatDate(latestPaidEntry?.paidAt)}</td>
                        <td className="whitespace-nowrap px-3 py-3">{labelPayment(latestPaidEntry?.paymentMethod || group.paymentMethod)}</td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>
                          {latestPaidEntry?.payslipNo ? <p className={`mt-1 text-[11px] ${dark ? "text-[#9e9e9e]" : "text-slate-400"}`}>{latestPaidEntry.payslipNo}</p> : null}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 last:pr-5">
                          <span className="inline-flex flex-nowrap items-center gap-1.5">
                            {latestPaidEntry ? (
                              <>
                                <button type="button" className="ref-btn-outline shrink-0 px-2 py-1.5 text-xs" onClick={() => setReceiptItem(fullReceiptItem)} title="View Payslip">
                                  <IconSlip className="h-4 w-4" />
                                </button>
                                <button type="button" className="ref-btn-outline shrink-0 px-2 py-1.5 text-xs" onClick={() => printReceipt(fullReceiptItem)} title="Print Payslip">
                                  <IconPrint className="h-4 w-4" />
                                </button>
                                <button type="button" className="ref-btn-outline shrink-0 px-2 py-1.5 text-xs" onClick={() => downloadPayslipPdf(fullReceiptItem)} title="Download PDF">
                                  PDF
                                </button>
                              </>
                            ) : null}
                            <button type="button" className="ref-btn-outline shrink-0 px-2 py-1.5 text-xs" onClick={() => setSummaryItem(summaryItemForGroup)} title="Salary summary">
                              <IconEye className="h-4 w-4" />
                            </button>
                            {firstPending ? (
                              <button type="button" className="ref-btn-outline shrink-0 whitespace-nowrap px-2 py-1.5 text-xs" onClick={() => markPaid(firstPending._id)}>
                                Mark Paid
                              </button>
                            ) : null}
                          </span>
                        </td>
                      </tr>
                      {isExpanded ? (
                        <tr className={dark ? "bg-[#1a1b26]/60" : "bg-slate-50/60"}>
                          <td colSpan={15} className="px-5 py-3">
                            <div className="space-y-2">
                              {group.entries.map((entry, index) => {
                                const isReceiptPaid = entry.status === "PAID";
                                const entryStatusMeta = getStatusMeta(isReceiptPaid ? "PAID" : "PENDING");
                                return (
                                  <div
                                    key={entry._id || `${group.key}-${index}`}
                                    className={`grid grid-cols-2 items-center gap-3 rounded-2xl border px-4 py-3 text-sm md:grid-cols-6 ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white"}`}
                                  >
                                    <span className={`font-semibold ${dark ? "text-white" : "text-slate-800"}`}>
                                      {entry.month} {entry.year}
                                    </span>
                                    <span>Pay: {currency(entry.paySalary ?? entry.netSalary)}</span>
                                    <span className="font-semibold text-orange-500">Remaining: {currency(getEntryRemainingSalary(entry))}</span>
                                    <span>Paid: {formatDate(entry.paidAt)}</span>
                                    <span>
                                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${entryStatusMeta.className}`}>{entryStatusMeta.label}</span>
                                      {entry.payslipNo ? <p className={`mt-1 text-[11px] ${dark ? "text-[#9e9e9e]" : "text-slate-400"}`}>{entry.payslipNo}</p> : null}
                                    </span>
                                    <span className="flex flex-wrap items-center justify-end gap-2">
                                      <button type="button" className="ref-btn-outline text-xs" disabled={!isReceiptPaid} onClick={() => (isReceiptPaid ? setReceiptItem(entry) : null)}>
                                        View
                                      </button>
                                      <button type="button" className="ref-btn-outline text-xs" disabled={!isReceiptPaid} onClick={() => printReceipt(entry)}>
                                        Print
                                      </button>
                                      <button type="button" className="ref-btn-outline text-xs" disabled={!isReceiptPaid} onClick={() => downloadPayslipPdf(entry)}>
                                        PDF
                                      </button>
                                      {!isReceiptPaid ? (
                                        <button type="button" className="ref-btn-outline whitespace-nowrap text-xs" onClick={() => markPaid(entry._id)}>
                                          Mark Paid
                                        </button>
                                      ) : null}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={15} className={`px-5 py-6 ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                    No payroll records found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPrev={() => setPage(Math.max(page - 1, 1))}
          onNext={() => setPage(Math.min(page + 1, pagination.totalPages || 1))}
          dark={dark}
        />
      </div>

      <FormModal open={showModal} title="Create Payroll" onClose={() => setShowModal(false)} wide dark={dark}>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <ScrollableSelect
              placeholder="Select staff *"
              value={form.staffId}
              options={staff.map((s) => ({ value: s._id, label: `${s.fullName} (${s.employeeCode || s.role})` }))}
              onChange={(value) => {
                const nextStaff = staff.find((item) => item._id === value);
                const fetchedSalary = nextStaff?.salary != null ? String(nextStaff.salary) : "";
                setForm({
                  ...form,
                  staffId: value,
                  basicSalary: fetchedSalary || form.basicSalary,
                  paySalary: fetchedSalary || form.paySalary,
                });
              }}
              required
              portal
              menuMaxHeight={260}
              dark={dark}
            />
          </div>
          <ScrollableSelect
            placeholder="Select month"
            value={form.month}
            options={MONTHS.map((m) => ({ value: m, label: m }))}
            onChange={(value) => setForm({ ...form, month: value })}
            portal
            menuMaxHeight={260}
            dark={dark}
          />
          <input type="number" className="ref-input" placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required />
          <input type="number" className="ref-input" placeholder="Basic Salary *" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} required min="0" />
          <input type="number" className="ref-input" placeholder="Pay Salary *" value={form.paySalary} onChange={(e) => setForm({ ...form, paySalary: e.target.value })} required min="0" />
          <input type="number" className="ref-input" placeholder="Deductions" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} min="0" />
          <input type="number" className="ref-input" placeholder="Bonus" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} min="0" />
          <input type="number" className="ref-input" placeholder="Allowances" value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} min="0" />
          <ScrollableSelect
            placeholder="Payment method"
            value={form.paymentMethod}
            options={PAYMENT_METHODS}
            onChange={(value) => setForm({ ...form, paymentMethod: value })}
            portal
            openUpward
            menuMaxHeight={220}
            dark={dark}
          />
          <input className="ref-input" placeholder="Transaction reference (optional)" value={form.transactionRef} onChange={(e) => setForm({ ...form, transactionRef: e.target.value })} />
          <div className={`flex items-center rounded-xl px-4 text-sm font-semibold sm:col-span-2 ${dark ? "bg-[#1a1b26] text-[#cbd5e1]" : "bg-slate-50 text-slate-700"}`}>
            Net Salary: Rs. {netPreview.toLocaleString()}
          </div>
          <input className="ref-input sm:col-span-2" placeholder="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
          <button type="submit" className="ref-btn-primary sm:col-span-2" disabled={saving}>{saving ? "Saving..." : "Create Payroll"}</button>
        </form>
      </FormModal>

      <FormModal open={Boolean(receiptItem)} title="Payslip / Paid Salary Receipt" onClose={() => setReceiptItem(null)} wide dark={dark}>
        <SalaryReceipt item={receiptItem} dark={dark} />
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button type="button" className="ref-btn-outline" onClick={() => printReceipt(receiptItem)}>Print Payslip</button>
          <button type="button" className="ref-btn-outline" onClick={() => downloadPayslipPdf(receiptItem)}>Download PDF</button>
          <button type="button" className="ref-btn-primary" onClick={() => printReceipt(receiptItem)}>Reprint Payslip</button>
        </div>
      </FormModal>

      <FormModal open={Boolean(summaryItem)} title="Salary Summary" onClose={() => setSummaryItem(null)} extraWide dark={dark}>
        <SalarySummary item={summaryItem} dark={dark} />
      </FormModal>
    </section>
  );
}
