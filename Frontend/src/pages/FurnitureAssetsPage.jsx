import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api/client";
import FormModal from "../components/ui/FormModal";
import PageHeader from "../components/ui/PageHeader";
import ScrollableSelect from "../components/ui/ScrollableSelect";
import { CLASS_OPTIONS, SECTION_OPTIONS } from "../constants/classes";
import {
  ASSET_STATUS_OPTIONS,
  getAssetCategoryLabel,
  REPORT_TYPES,
} from "../constants/assets";

const POLL_MS = 5000;

const emptySummary = {
  totalDesks: 0,
  totalBenches: 0,
  totalChairs: 0,
  totalBenchesChairs: 0,
  totalTables: 0,
  totalFans: 0,
  totalBulbs: 0,
  totalBrokenAssets: 0,
  brokenDesks: 0,
  brokenBenchesChairs: 0,
  brokenFans: 0,
  brokenBulbs: 0,
};

function StatusBadge({ status, count, dark }) {
  const styles = {
    WORKING: dark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-700",
    BROKEN: dark ? "bg-rose-500/15 text-rose-400" : "bg-rose-50 text-rose-700",
    UNDER_MAINTENANCE: dark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-700",
    MISSING: dark ? "bg-slate-500/15 text-slate-300" : "bg-slate-100 text-slate-600",
    REPLACED: dark ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-blue-700",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles[status] || styles.WORKING}`}>
      {ASSET_STATUS_OPTIONS.find((item) => item.value === status)?.label || status}: {count}
    </span>
  );
}

function rowsToCsv(columns, rows) {
  const header = columns.map((col) => `"${col.label}"`).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((col) => `"${String(col.value(row) ?? "").replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");
  return `${header}\n${body}`;
}

export default function FurnitureAssetsPage({ dark = false, branchSection = "Boys" }) {
  const campus = branchSection === "Girls" ? "Girls" : "Boys";
  const [summary, setSummary] = useState(emptySummary);
  const [items, setItems] = useState([]);
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [status, setStatus] = useState("");
  const [reportType, setReportType] = useState("inventory");
  const [statusModal, setStatusModal] = useState(null);
  const [statusForm, setStatusForm] = useState({ fromStatus: "WORKING", toStatus: "BROKEN", quantity: "1", remarks: "" });
  const [saving, setSaving] = useState(false);

  const queryParams = useMemo(
    () => ({
      branch: campus,
      className: className || undefined,
      section: section || undefined,
      status: status || undefined,
      page: 1,
      limit: 200,
    }),
    [campus, className, section, status]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, listRes, classroomRes] = await Promise.all([
        api.get("/assets/summary", { params: { branch: campus } }),
        api.get("/assets", { params: queryParams }),
        className
          ? api.get("/assets/classroom", { params: { branch: campus, className, section: section || "A" } })
          : Promise.resolve({ data: { data: null } }),
      ]);
      setSummary(summaryRes.data.data || emptySummary);
      setItems(listRes.data.data.items || []);
      setClassroom(classroomRes.data.data || null);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load furniture and assets");
    } finally {
      setLoading(false);
    }
  }, [campus, className, section, queryParams]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(load, POLL_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [load]);

  const downloadReport = async () => {
    try {
      const { data } = await api.get("/assets/reports", {
        params: { type: reportType, branch: campus, className: className || undefined, section: section || undefined },
      });
      const rows = data.data.rows || [];
      const columns = Object.keys(rows[0] || {}).map((key) => ({
        label: key,
        value: (row) => row[key],
      }));
      if (!columns.length) return;
      const blob = new Blob([rowsToCsv(columns, rows)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportType}-assets-report.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to export report");
    }
  };

  const submitStatusChange = async (event) => {
    event.preventDefault();
    if (!statusModal?._id) return;
    setSaving(true);
    try {
      await api.post(`/assets/${statusModal._id}/adjust-status`, {
        fromStatus: statusForm.fromStatus,
        toStatus: statusForm.toStatus,
        quantity: Number(statusForm.quantity || 0),
        remarks: statusForm.remarks,
      });
      setStatusModal(null);
      setStatusForm({ fromStatus: "WORKING", toStatus: "BROKEN", quantity: "1", remarks: "" });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update asset status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Furniture & Assets"
        subtitle="Centralized campus inventory synced automatically from approved purchases."
        afterAction={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="min-w-[140px]">
              <ScrollableSelect
                label=""
                placeholder="All classes"
                value={className}
                options={[{ value: "", label: "All classes" }, ...CLASS_OPTIONS.map((item) => ({ value: item, label: item }))]}
                onChange={setClassName}
                dark={dark}
                portal
              />
            </div>
            <div className="min-w-[140px]">
              <ScrollableSelect
                label=""
                placeholder="All sections"
                value={section}
                options={[{ value: "", label: "All sections" }, ...SECTION_OPTIONS.map((item) => ({ value: item, label: `Section ${item}` }))]}
                onChange={setSection}
                dark={dark}
                portal
              />
            </div>
            <div className="min-w-[140px]">
              <ScrollableSelect
                label=""
                placeholder="Status"
                value={status}
                options={[{ value: "", label: "All status" }, ...ASSET_STATUS_OPTIONS]}
                onChange={setStatus}
                dark={dark}
                portal
              />
            </div>
            <div className="min-w-[180px]">
              <ScrollableSelect
                label=""
                placeholder="Report type"
                value={reportType}
                options={REPORT_TYPES}
                onChange={setReportType}
                dark={dark}
                portal
                menuMaxHeight={260}
              />
            </div>
            <button type="button" className="ref-btn-outline" onClick={downloadReport}>
              Export Report
            </button>
          </div>
        }
      />

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {classroom?.items?.length ? (
        <div className={`rounded-2xl border p-5 ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white shadow-sm"}`}>
          <h3 className={`text-base font-semibold ${dark ? "text-white" : "text-slate-800"}`}>
            Class {classroom.className} - Section {classroom.section}
          </h3>
          <p className={`mt-1 text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
            Complete classroom furniture and asset inventory.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {classroom.items.map((item) => (
              <div key={item._id} className={`rounded-xl border px-4 py-3 ${dark ? "border-white/[0.06] bg-[#1a1b26]" : "border-slate-100 bg-slate-50/70"}`}>
                <p className={`font-semibold ${dark ? "text-white" : "text-slate-800"}`}>{getAssetCategoryLabel(item.category)}</p>
                <p className={`text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{item.itemName || "Assigned asset"}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatusBadge status="WORKING" count={item.working} dark={dark} />
                  <StatusBadge status="BROKEN" count={item.broken} dark={dark} />
                  <StatusBadge status="UNDER_MAINTENANCE" count={item.underMaintenance} dark={dark} />
                  <StatusBadge status="MISSING" count={item.missing} dark={dark} />
                  <StatusBadge status="REPLACED" count={item.replaced} dark={dark} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className={`overflow-hidden rounded-2xl border ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white shadow-sm"}`}>
        <div className={`border-b px-5 py-4 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
          <h3 className={`font-semibold ${dark ? "text-white" : "text-slate-800"}`}>School Asset Register</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className={`text-left ${dark ? "bg-[#1a1b26] text-[#9e9e9e]" : "bg-slate-50 text-slate-500"}`}>
              <tr>
                {[
                  "Branch",
                  "Class",
                  "Section",
                  "Asset Category",
                  "Asset Name",
                  "Working Qty",
                  "Broken Qty",
                  "Under Maintenance",
                  "Missing Qty",
                  "Replaced Qty",
                  "Total Qty",
                  "Actions",
                ].map((heading) => (
                  <th key={heading} className="px-5 py-3 font-medium">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} className={`px-5 py-8 text-center ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Loading assets...</td>
                </tr>
              ) : items.length ? (
                items.map((item) => (
                  <tr key={item._id} className={`border-t ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
                    <td className={`px-5 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>{item.branch || "-"}</td>
                    <td className={`px-5 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>{item.className || "General Store"}</td>
                    <td className={`px-5 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>{item.section ? `Section ${item.section}` : "-"}</td>
                    <td className={`px-5 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>{getAssetCategoryLabel(item.category)}</td>
                    <td className={`px-5 py-3 font-medium ${dark ? "text-white" : "text-slate-800"}`}>{item.itemName || "-"}</td>
                    <td className="px-5 py-3">{item.working}</td>
                    <td className="px-5 py-3">{item.broken}</td>
                    <td className="px-5 py-3">{item.underMaintenance}</td>
                    <td className="px-5 py-3">{item.missing}</td>
                    <td className="px-5 py-3">{item.replaced}</td>
                    <td className={`px-5 py-3 font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{item.totalUnits}</td>
                    <td className="px-5 py-3">
                      <button type="button" className="ref-btn-outline text-xs" onClick={() => setStatusModal(item)}>
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className={`px-5 py-8 text-center ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                    No assets found. Purchases will appear here automatically.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FormModal
        open={Boolean(statusModal)}
        title="Update Asset Status"
        onClose={() => setStatusModal(null)}
        maxWidthClass="max-w-lg"
        dark={dark}
      >
        <form onSubmit={submitStatusChange} className="space-y-4">
          <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>
            {getAssetCategoryLabel(statusModal?.category)} - {statusModal?.className || "General Store"}{" "}
            {statusModal?.section ? `Section ${statusModal.section}` : ""}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ScrollableSelect
              label="From Status"
              value={statusForm.fromStatus}
              options={ASSET_STATUS_OPTIONS}
              onChange={(value) => setStatusForm((current) => ({ ...current, fromStatus: value }))}
              dark={dark}
              portal
            />
            <ScrollableSelect
              label="To Status"
              value={statusForm.toStatus}
              options={ASSET_STATUS_OPTIONS}
              onChange={(value) => setStatusForm((current) => ({ ...current, toStatus: value }))}
              dark={dark}
              portal
            />
          </div>
          <input
            type="number"
            min="1"
            className="ref-input"
            placeholder="Quantity"
            value={statusForm.quantity}
            onChange={(e) => setStatusForm((current) => ({ ...current, quantity: e.target.value }))}
            required
          />
          <textarea
            rows={3}
            className="ref-input resize-none"
            placeholder="Remarks (optional)"
            value={statusForm.remarks}
            onChange={(e) => setStatusForm((current) => ({ ...current, remarks: e.target.value }))}
          />
          <button type="submit" className="ref-btn-primary w-full" disabled={saving}>
            {saving ? "Saving..." : "Save Status Change"}
          </button>
        </form>
      </FormModal>
    </section>
  );
}
