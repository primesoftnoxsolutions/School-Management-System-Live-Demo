import { useEffect, useMemo, useState } from "react";
import api from "../services/api/client";
import FormModal from "../components/ui/FormModal";
import ModernDatePicker from "../components/ui/ModernDatePicker";
import PageHeader from "../components/ui/PageHeader";
import ScrollableSelect from "../components/ui/ScrollableSelect";
import { IconEye, IconPrint } from "../components/icons/NavIcons";
import { CLASS_OPTIONS, SECTION_OPTIONS } from "../constants/classes";
import {
  CAMPUS_OPTIONS,
  getPurchaseCategoryLabel,
  PURCHASE_CATEGORIES,
  PURCHASE_TYPE_OPTIONS,
} from "../constants/assets";
import { purchasesToCsv } from "../utils/purchaseStore";

const initialForm = {
  date: new Date().toISOString().slice(0, 10),
  branch: "Boys",
  className: "",
  section: "",
  category: "DESKS",
  purchaseType: "NEW_EXTRA",
  vendor: "",
  quantity: "",
  unitCost: "",
  notes: "",
};

const purchaseTypeLabel = (value) =>
  PURCHASE_TYPE_OPTIONS.find((item) => item.value === value)?.label || value || "New/Extra Purchase";

const currency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

function PurchaseDetails({ item }) {
  if (!item) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          ["Purchase No", item.purchaseNo || item.id || "-"],
          ["Date", item.date ? new Date(item.date).toLocaleDateString() : "-"],
          ["Campus", item.branch || "Boys"],
          ["Class / Section", item.className ? `${item.className} ${item.section || ""}` : "-"],
          ["Category", getPurchaseCategoryLabel(item.category)],
          ["Purchase Type", purchaseTypeLabel(item.purchaseType)],
          ["Vendor", item.vendor || "-"],
          ["Quantity", item.quantity],
          ["Unit Cost", currency(item.unitCost)],
          ["Total Amount", currency(item.totalAmount)],
          ["Notes", item.notes || "-"],
        ].map(([label, value]) => (
          <div key={label} className={label === "Notes" ? "md:col-span-2" : ""}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PurchaseManagementPage({ dark = false }) {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ desks: 0, benchesChairs: 0, bulbs: 0, fans: 0, totalAmount: 0, totalItems: 0 });
  const [form, setForm] = useState(initialForm);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        api.get("/purchases", { params: { page: 1, limit: 100 } }),
        api.get("/purchases/summary"),
      ]);
      setItems(listRes.data.data.items || []);
      setSummary(summaryRes.data.data || { desks: 0, benchesChairs: 0, bulbs: 0, fans: 0, totalAmount: 0, totalItems: 0 });
      setError("");
    } catch (err) {
      setItems([]);
      setError(err.response?.data?.message || "Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitPurchase = async (event) => {
    event.preventDefault();
    const quantity = Math.max(0, Number(form.quantity || 0));
    const unitCost = Math.max(0, Number(form.unitCost || 0));
    if (!form.category || !quantity || !form.purchaseType) return;

    setSaving(true);
    setError("");
    try {
      await api.post("/purchases", {
        ...form,
        quantity,
        unitCost,
      });
      setForm(initialForm);
      setShowAddModal(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save purchase");
    } finally {
      setSaving(false);
    }
  };

  const downloadCsv = () => {
    const blob = new Blob([purchasesToCsv(items)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "purchase-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const printPurchase = (item) => {
    const printWindow = window.open("", "_blank", "width=760,height=840");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Record</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
            h1 { margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            td { border: 1px solid #e2e8f0; padding: 12px; }
            td:first-child { width: 34%; font-weight: 700; background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>Purchase Record</h1>
          <p>Insaaf Grammar High School</p>
          <table>
            <tr><td>Purchase No</td><td>${item.purchaseNo || item.id || "-"}</td></tr>
            <tr><td>Date</td><td>${item.date ? new Date(item.date).toLocaleDateString() : "-"}</td></tr>
            <tr><td>Campus</td><td>${item.branch || "Boys"}</td></tr>
            <tr><td>Class / Section</td><td>${item.className ? `${item.className} ${item.section || ""}` : "-"}</td></tr>
            <tr><td>Category</td><td>${getPurchaseCategoryLabel(item.category)}</td></tr>
            <tr><td>Purchase Type</td><td>${purchaseTypeLabel(item.purchaseType)}</td></tr>
            <tr><td>Vendor</td><td>${item.vendor || "-"}</td></tr>
            <tr><td>Quantity</td><td>${item.quantity || 0}</td></tr>
            <tr><td>Unit Cost</td><td>${currency(item.unitCost)}</td></tr>
            <tr><td>Total Amount</td><td>${currency(item.totalAmount)}</td></tr>
            <tr><td>Notes</td><td>${item.notes || "-"}</td></tr>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const cards = useMemo(
    () => [
      ["Desks", summary.desks],
      ["Benches & Chairs", summary.benchesChairs],
      ["Bulbs", summary.bulbs],
      ["Fans", summary.fans],
      ["Total Spent", currency(summary.totalAmount)],
    ],
    [summary]
  );

  return (
    <section className="space-y-6">
      <PageHeader
        title="Purchase Management"
        subtitle="Manage school furniture and equipment purchases. Approved purchases sync automatically to Furniture & Assets."
        actionLabel="Add Purchase"
        onAction={() => setShowAddModal(true)}
        afterAction={
          <button type="button" className="ref-btn-outline" onClick={downloadCsv} disabled={!items.length}>
            Download Purchase Report
          </button>
        }
      />

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="ref-card p-4">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="ref-card overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              {["Date", "Campus", "Class", "Category", "Purchase Type", "Vendor", "Qty", "Unit Cost", "Total", "Action"].map((heading) => (
                <th key={heading} className="px-5 py-3 font-medium">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="px-5 py-8 text-center text-slate-500">Loading purchases...</td>
              </tr>
            ) : items.length ? (
              items.map((item) => (
                <tr key={item._id || item.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 text-slate-700">{item.date ? new Date(item.date).toLocaleDateString() : "-"}</td>
                  <td className="px-5 py-3 text-slate-700">{item.branch || "Boys"}</td>
                  <td className="px-5 py-3 text-slate-700">{item.className ? `${item.className} ${item.section || ""}` : "-"}</td>
                  <td className="px-5 py-3 text-slate-700">{getPurchaseCategoryLabel(item.category)}</td>
                  <td className="px-5 py-3 text-slate-700">{purchaseTypeLabel(item.purchaseType)}</td>
                  <td className="px-5 py-3 text-slate-700">{item.vendor || "-"}</td>
                  <td className="px-5 py-3 text-slate-700">{item.quantity}</td>
                  <td className="px-5 py-3 text-slate-700">{currency(item.unitCost)}</td>
                  <td className="px-5 py-3 font-semibold text-slate-900">{currency(item.totalAmount)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => setSelectedItem(item)}
                        aria-label="View purchase"
                      >
                        <IconEye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                        onClick={() => printPurchase(item)}
                        aria-label="Print purchase"
                      >
                        <IconPrint className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="px-5 py-8 text-center text-slate-500">
                  No purchases recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <FormModal open={showAddModal} title="Add Purchase" onClose={() => setShowAddModal(false)} wide>
        <form onSubmit={submitPurchase} className="space-y-5">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-sm font-bold text-slate-900">Purchase Details</p>
            <p className="mt-1 text-xs text-slate-500">Approved purchases are synced automatically to Furniture & Assets.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ModernDatePicker
              label="Date"
              value={form.date}
              onChange={(value) => setForm({ ...form, date: value })}
              dark={dark}
            />
            <ScrollableSelect
              label="Campus"
              value={form.branch}
              options={CAMPUS_OPTIONS}
              onChange={(value) => setForm({ ...form, branch: value })}
              dark={dark}
              portal
            />
            <ScrollableSelect
              label="Category"
              placeholder="Select category"
              value={form.category}
              options={PURCHASE_CATEGORIES}
              onChange={(value) => setForm({ ...form, category: value })}
              dark={dark}
              portal
              menuMaxHeight={260}
            />
            <ScrollableSelect
              label="Purchase Type"
              placeholder="Select purchase type"
              value={form.purchaseType}
              options={PURCHASE_TYPE_OPTIONS}
              onChange={(value) => setForm({ ...form, purchaseType: value })}
              dark={dark}
              portal
            />
            <ScrollableSelect
              label="Class"
              placeholder="Select class"
              value={form.className}
              options={[
                { value: "", label: "Select class" },
                ...CLASS_OPTIONS.map((c) => ({ value: c, label: c })),
              ]}
              onChange={(value) => setForm({ ...form, className: value })}
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
              onChange={(value) => setForm({ ...form, section: value })}
              dark={dark}
              portal
            />
            <input className="ref-input" placeholder="Vendor" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
            <input type="number" min="1" className="ref-input" placeholder="Quantity *" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <input type="number" min="0" className="ref-input" placeholder="Unit cost" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} />
            <input className="ref-input md:col-span-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button type="submit" className="ref-btn-primary w-full" disabled={saving}>
            {saving ? "Saving..." : "Save Purchase"}
          </button>
        </form>
      </FormModal>

      <FormModal open={Boolean(selectedItem)} title="Purchase Details" onClose={() => setSelectedItem(null)}>
        <div className="space-y-4">
          <PurchaseDetails item={selectedItem} />
          <button type="button" className="ref-btn-primary w-full" onClick={() => printPurchase(selectedItem)}>
            Print Purchase Record
          </button>
        </div>
      </FormModal>
    </section>
  );
}
