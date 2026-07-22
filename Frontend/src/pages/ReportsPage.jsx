import { useEffect, useMemo, useState } from "react";
import api from "../services/api/client";
import ModernDatePicker from "../components/ui/ModernDatePicker";
import {
  getPurchaseCategoryLabel,
  purchasesToCsv,
} from "../utils/purchaseStore";

const REPORT_TYPES = [
  { id: "overview", label: "Overview", endpoint: "/reports/overview" },
  { id: "fee-collection", label: "Fee Collection", endpoint: "/reports/fee-collection" },
  { id: "pending-fees", label: "Pending Fees", endpoint: "/reports/pending-fees" },
  { id: "refunds", label: "Fee Refunds", endpoint: "/reports/refunds" },
  { id: "fines", label: "Fines", endpoint: "/reports/fines" },
  { id: "students", label: "Students Summary", endpoint: "/reports/students" },
  { id: "attendance", label: "Attendance", endpoint: "/reports/attendance" },
];

const FINANCE_REPORT_TYPES = [
  { id: "purchase-report", label: "Purchase Report" },
  { id: "fees-report", label: "Fees Report" },
  { id: "fine-report", label: "Fine Report", endpoint: "/reports/fines" },
  { id: "refund-report", label: "Refund Report", endpoint: "/reports/refunds" },
];

const currency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

const studentName = (student) => (student ? `${student.firstName || ""} ${student.lastName || ""}`.trim() : "-");

const rowsToCsv = (columns, rows = []) => {
  const csvRows = [
    columns.map((column) => column.label),
    ...rows.map((row) => columns.map((column) => (column.csv ? column.csv(row) : column.render ? column.render(row) : row[column.key]))),
  ];

  return csvRows
    .map((row) =>
      row
        .map((value) => String(value ?? "").replaceAll('"', '""'))
        .map((value) => `"${value}"`)
        .join(",")
    )
    .join("\n");
};

export default function ReportsPage({ financeOnly = false, dark = false }) {
  const reportTypes = useMemo(() => (financeOnly ? FINANCE_REPORT_TYPES : REPORT_TYPES), [financeOnly]);
  const [reportType, setReportType] = useState(reportTypes[0].id);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    setReportType(reportTypes[0].id);
  }, [reportTypes]);

  const loadReport = async () => {
    const report = reportTypes.find((r) => r.id === reportType);
    if (!report) return;

    setLoading(true);
    setError("");
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      if (report.id === "purchase-report") {
        const [listRes, summaryRes] = await Promise.all([
          api.get("/purchases", { params: { page: 1, limit: 500, ...params } }),
          api.get("/purchases/summary", { params }),
        ]);
        setData({ items: listRes.data.data.items || [], summary: summaryRes.data.data });
        return;
      }

      if (report.id === "fees-report") {
        const [overviewRes, collectionRes, pendingRes] = await Promise.all([
          api.get("/reports/overview"),
          api.get("/reports/fee-collection", { params }),
          api.get("/reports/pending-fees"),
        ]);
        setData({
          overview: overviewRes.data.data,
          collection: collectionRes.data.data,
          pending: pendingRes.data.data,
        });
        return;
      }

      const { data: res } = await api.get(report.endpoint, { params });
      setData(res.data);
    } catch (err) {
      setData(null);
      setError(err.response?.data?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType]);

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportType}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadCsv = () => {
    let csv = "";

    if (reportType === "purchase-report") {
      csv = purchasesToCsv(data?.items || []);
    } else if (reportType === "fees-report") {
      csv = rowsToCsv(
        [
          { key: "receiptNo", label: "Reference Number" },
          { key: "student", label: "Student", csv: (r) => studentName(r.studentId) },
          { key: "feeType", label: "Transaction Type" },
          { key: "netAmount", label: "Amount" },
          { key: "paidAt", label: "Date & Time", csv: (r) => (r.paidAt ? new Date(r.paidAt).toLocaleString() : "") },
          { key: "processedBy", label: "Processed By", csv: (r) => r.receivedBy?.fullName || "" },
        ],
        data?.collection?.payments || []
      );
    } else if (reportType === "fine-report" || reportType === "fines") {
      csv = rowsToCsv(
        [
          { key: "student", label: "Student", csv: (r) => studentName(r.studentId) },
          { key: "fineType", label: "Transaction Type" },
          { key: "amount", label: "Amount" },
          { key: "status", label: "Status" },
          { key: "createdAt", label: "Date & Time", csv: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleString() : "") },
          { key: "processedBy", label: "Processed By", csv: (r) => r.issuedBy?.fullName || "" },
        ],
        data?.items || []
      );
    } else if (reportType === "refund-report" || reportType === "refunds") {
      csv = rowsToCsv(
        [
          { key: "refundNo", label: "Reference Number" },
          { key: "student", label: "Student", csv: (r) => studentName(r.studentId) },
          { key: "refundType", label: "Transaction Type" },
          { key: "amount", label: "Amount" },
          { key: "status", label: "Status" },
          { key: "createdAt", label: "Date & Time", csv: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleString() : "") },
          { key: "processedBy", label: "Processed By", csv: (r) => r.requestedBy?.fullName || "" },
        ],
        data?.items || []
      );
    } else {
      csv = JSON.stringify(data, null, 2);
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportType}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        ["Total Students", data?.totalStudents],
        ["Total Teachers", data?.totalTeachers],
        ["Fee Collected", currency(data?.feeCollected)],
        ["Pending Fees", currency(data?.pendingFees)],
        ["Refunds Processed", currency(data?.refundsProcessed)],
        ["Fines Pending", currency(data?.finesPending)],
        ["Fines Collected", currency(data?.finesCollected)],
      ].map(([label, value]) => (
        <div key={label} className="ref-card p-4">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{value ?? 0}</p>
        </div>
      ))}
    </div>
  );

  const renderTable = (rows, columns) => (
    <div className="ref-card overflow-x-auto p-0">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-5 py-3 font-medium">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows?.length ? (
            rows.map((row, i) => (
              <tr key={row._id || row.id || i} className="border-t border-slate-100">
                {columns.map((c) => (
                  <td key={c.key} className="px-5 py-3 text-slate-700">
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-5 py-6 text-slate-500">No data.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderFeesReport = () => {
    const overview = data?.overview || {};
    const totalFees = Number(overview.feeCollected || 0) + Number(overview.pendingFees || 0);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            ["Total Fees", currency(totalFees)],
            ["Total Fees Received", currency(overview.feeCollected)],
            ["Total Pending Fees", currency(overview.pendingFees)],
          ].map(([label, value]) => (
            <div key={label} className="ref-card p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
        {renderTable(data?.collection?.payments || [], [
          { key: "receiptNo", label: "Reference Number" },
          { key: "student", label: "Student", render: (r) => studentName(r.studentId) },
          { key: "feeType", label: "Transaction Type" },
          { key: "netAmount", label: "Amount", render: (r) => currency(r.netAmount) },
          { key: "paidAt", label: "Date & Time", render: (r) => (r.paidAt ? new Date(r.paidAt).toLocaleString() : "-") },
          { key: "processedBy", label: "Processed By", render: (r) => r.receivedBy?.fullName || "-" },
        ])}
      </div>
    );
  };

  const renderReport = () => {
    if (!data) return null;

    switch (reportType) {
      case "purchase-report":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              {[
                ["Desks", data.summary?.desks],
                ["Benches & Chairs", data.summary?.benchesChairs],
                ["Bulbs", data.summary?.bulbs],
                ["Fans", data.summary?.fans],
                ["Total Spent", currency(data.summary?.totalAmount)],
              ].map(([label, value]) => (
                <div key={label} className="ref-card p-4">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
                </div>
              ))}
            </div>
            {renderTable(data.items, [
              { key: "date", label: "Date", render: (r) => (r.date ? new Date(r.date).toLocaleDateString() : "-") },
              { key: "category", label: "Category", render: (r) => getPurchaseCategoryLabel(r.category) },
              { key: "itemName", label: "Item", render: (r) => r.itemName || getPurchaseCategoryLabel(r.category) },
              { key: "vendor", label: "Vendor", render: (r) => r.vendor || "-" },
              { key: "quantity", label: "Quantity" },
              { key: "totalAmount", label: "Total Amount", render: (r) => currency(r.totalAmount) },
              { key: "totalSpent", label: "Total Spent", render: (r) => currency(r.totalAmount) },
            ])}
          </div>
        );
      case "fees-report":
        return renderFeesReport();
      case "fine-report":
      case "fines":
        return renderTable(data.items, [
          { key: "student", label: "Student", render: (r) => studentName(r.studentId) },
          { key: "fineType", label: "Transaction Type" },
          { key: "amount", label: "Amount", render: (r) => currency(r.amount) },
          { key: "status", label: "Status" },
          { key: "createdAt", label: "Date & Time", render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleString() : "-") },
          { key: "processedBy", label: "Processed By", render: (r) => r.issuedBy?.fullName || "-" },
        ]);
      case "refund-report":
      case "refunds":
        return renderTable(data.items, [
          { key: "refundNo", label: "Reference Number" },
          { key: "student", label: "Student", render: (r) => studentName(r.studentId) },
          { key: "refundType", label: "Transaction Type", render: (r) => r.refundType || "FEES" },
          { key: "amount", label: "Amount", render: (r) => currency(r.amount) },
          { key: "status", label: "Status" },
          { key: "createdAt", label: "Date & Time", render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleString() : "-") },
          { key: "processedBy", label: "Processed By", render: (r) => r.requestedBy?.fullName || "-" },
        ]);
      case "overview":
        return renderOverview();
      case "fee-collection":
        return (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-700">
              Total Collected: {currency(data.totalCollected)}
            </p>
            {renderTable(data.payments, [
              { key: "receiptNo", label: "Receipt" },
              { key: "student", label: "Student", render: (r) => studentName(r.studentId) },
              { key: "feeType", label: "Type" },
              { key: "netAmount", label: "Amount", render: (r) => currency(r.netAmount) },
            ])}
          </div>
        );
      case "pending-fees":
        return renderTable(data, [
          { key: "student", label: "Student", render: (r) => studentName(r.student) },
          { key: "title", label: "Fee" },
          { key: "pendingAmount", label: "Pending", render: (r) => currency(r.pendingAmount) },
          { key: "status", label: "Status" },
        ]);
      case "students":
        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="ref-card p-4">
              <h4 className="mb-3 font-semibold">By Class</h4>
              {(data.byClass || []).map((r) => (
                <div key={r._id} className="flex justify-between border-b border-slate-50 py-2 text-sm">
                  <span>{r._id || "Unassigned"}</span>
                  <span className="font-medium">{r.count}</span>
                </div>
              ))}
            </div>
            <div className="ref-card p-4">
              <h4 className="mb-3 font-semibold">By Gender</h4>
              {(data.byGender || []).map((r) => (
                <div key={r._id} className="flex justify-between border-b border-slate-50 py-2 text-sm">
                  <span>{r._id}</span>
                  <span className="font-medium">{r.count}</span>
                </div>
              ))}
              <p className="mt-4 text-sm font-semibold">Total: {data.total}</p>
            </div>
          </div>
        );
      case "attendance":
        return (
          <div className="ref-card p-4">
            <h4 className="mb-3 font-semibold">Attendance Summary</h4>
            {(data.summary || []).map((r) => (
              <div key={r._id} className="flex justify-between border-b border-slate-50 py-2 text-sm">
                <span>{r._id}</span>
                <span className="font-medium">{r.count}</span>
              </div>
            ))}
          </div>
        );
      default:
        return <pre className="ref-card overflow-auto p-4 text-xs">{JSON.stringify(data, null, 2)}</pre>;
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{financeOnly ? "Finance Reports" : "Reports"}</h2>
        <p className="text-sm text-slate-500">
          {financeOnly
            ? "Generate and download purchase, fee, fine and refund reports."
            : "Generate and download school management reports."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {reportTypes.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setReportType(r.id)}
            className={`rounded-xl px-3 py-2 text-xs font-medium sm:text-sm ${
              reportType === r.id ? "bg-blue-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="ref-card flex flex-wrap items-end gap-3 p-4">
        <ModernDatePicker label="From Date" value={from} onChange={setFrom} dark={dark} />
        <ModernDatePicker label="To Date" value={to} onChange={setTo} dark={dark} />
        <button type="button" className="ref-btn-primary" onClick={loadReport}>
          Generate Report
        </button>
        <button type="button" className="ref-btn-outline" onClick={downloadJson} disabled={!data}>
          Download JSON
        </button>
        <button type="button" className="ref-btn-outline" onClick={downloadCsv} disabled={!data}>
          Download CSV
        </button>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Loading report...</p> : renderReport()}
    </section>
  );
}
