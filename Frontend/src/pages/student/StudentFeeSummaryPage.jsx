import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import api from "../../services/api/client";

function SummaryStat({ label, value, icon, accent = "text-slate-900", dark = false }) {
  return (
    <div className={`rounded-2xl border px-5 py-4 shadow-sm ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-100 bg-white"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{label}</p>
          <p className={`mt-3 text-2xl font-extrabold ${dark ? "text-white" : accent}`}>{value}</p>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-xl bg-slate-100 ${dark ? "bg-white/5" : "bg-slate-50"}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function StudentFeeSummaryPage({ dark = false }) {
  const user = useSelector((s) => s.auth.user);
  const studentId = user?._id || user?.id || null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    summary: {
      totalFees: 0,
      collectedFees: 0,
      pendingFees: 0,
      totalFine: 0,
      collectedFine: 0,
      pendingFine: 0,
      totalRefunds: 0,
      netCollection: 0,
    },
    fees: [],
    fines: [],
    refunds: [],
    clearedFees: [],
  });
  const [filter, setFilter] = useState("PENDING");
  const studentName = user?.fullName || user?.name || "Student";

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!studentId) return;
      if (!cancelled) setLoading(true);
      setError("");
      try {
        const { data: resp } = await api.get(`/students/${studentId}/finance-summary`);
        if (cancelled) return;
        setData(resp.data || {
          summary: {
            totalFees: 0,
            collectedFees: 0,
            pendingFees: 0,
            totalFine: 0,
            collectedFine: 0,
            pendingFine: 0,
            totalRefunds: 0,
            netCollection: 0,
          },
          fees: [],
          fines: [],
          refunds: [],
          clearedFees: [],
        });
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || "Failed to load finance summary");
        setData({
          summary: {
            totalFees: 0,
            collectedFees: 0,
            pendingFees: 0,
            totalFine: 0,
            collectedFine: 0,
            pendingFine: 0,
            totalRefunds: 0,
            netCollection: 0,
          },
          fees: [],
          fines: [],
          refunds: [],
          clearedFees: [],
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const intervalId = window.setInterval(load, 5000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [studentId]);

  const totals = data.summary || {};

  const items = useMemo(() => {
    if (filter === "ALL") return [...data.fees, ...data.fines, ...data.refunds];
    if (filter === "PENDING") return [...data.fees.filter((f) => f.status !== "PAID"), ...data.fines.filter((f) => f.status === "PENDING")];
    if (filter === "MONTHLY") return data.fees.filter((f) => String(f.type || f.feeType || "").toUpperCase() === "TUITION");
    if (filter === "FINE") return data.fines;
    if (filter === "EXAM") return data.fees.filter((f) => String(f.type || f.feeType || "").toUpperCase() === "EXAM");
    if (filter === "REFUND") return data.refunds;
    return [];
  }, [data, filter]);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-[#eef3ff] via-white to-[#faf8ff] p-8 shadow-[0_20px_60px_rgba(99,102,241,0.12)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5c6ac4]">Fees & Payments</p>
            <h1 className={`mt-2 text-3xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>Overview of {studentName}</h1>
            <p className={`mt-3 max-w-2xl text-sm ${dark ? "text-[#c7d2fe]" : "text-slate-600"}`}>
              Overview of pending fees, fines and refunds for this student account.
            </p>
          </div>

          </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[
            { key: 'PENDING', label: 'Pending Fees & Fines', count: data.fees.filter(f => f.status !== 'PAID').length + data.fines.filter(f => f.status === 'PENDING').length },
            { key: 'MONTHLY', label: 'Monthly Fees', count: data.fees.filter(f => String(f.type || f.feeType || '').toUpperCase() === 'TUITION').length },
            { key: 'EXAM', label: 'Exam Fees', count: data.fees.filter(f => String(f.type || f.feeType || '').toUpperCase() === 'EXAM').length },
            { key: 'FINE', label: 'Fines', count: data.fines.length },
            { key: 'REFUND', label: 'Refunds', count: data.refunds.length },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`group flex h-20 w-full min-w-0 flex-col justify-center rounded-lg border px-4 text-left text-sm shadow-sm transition ${
                filter === item.key
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-[0_10px_24px_rgba(79,70,229,0.12)]'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-slate-50 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">{item.label}</div>
                <span
                  className={`h-2 w-2 rounded-full transition ${
                    filter === item.key ? 'bg-indigo-500' : 'bg-slate-300 group-hover:bg-indigo-300'
                  }`}
                />
              </div>
              <div className={`mt-1 text-xs ${filter === item.key ? 'text-indigo-400' : 'text-slate-400'}`}>{item.count} items</div>
            </button>
          ))}
        </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryStat label="Total Fees" value={`PKR ${totals.totalFees || 0}`} icon={<svg className="h-6 w-6 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>} />
            <SummaryStat label="Pending Fees" value={`PKR ${totals.pendingFees || 0}`} icon={<svg className="h-6 w-6 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>} accent="text-orange-500" />
            <SummaryStat label="Collected Fine" value={`PKR ${totals.collectedFine || 0}`} icon={<svg className="h-6 w-6 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h8"/><path d="M8 18h8"/><path d="M8 12h8"/></svg>} accent="text-pink-500" />
            <SummaryStat label="Refunds" value={`PKR ${totals.totalRefunds || 0}`} icon={<svg className="h-6 w-6 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h3l3-3"/><path d="M21 12h-3l-3 3"/><path d="M12 3v3"/><path d="M12 21v-3"/></svg>} accent="text-emerald-500" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : error ? (
              <p className="text-sm text-rose-600">{error}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.18em] text-slate-400">
                    <tr>
                      <th className="px-4 py-4">Type</th>
                      <th className="px-4 py-4">Title</th>
                      <th className="px-4 py-4">Amount</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Due / Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length ? (
                      items.map((it) => (
                        <tr key={it.id} className="border-b last:border-b-0 hover:bg-indigo-50/30">
                          <td className="px-4 py-5 font-medium text-slate-700">{it.type || it.feeType || (it.title && it.title.toLowerCase().includes('fine') ? 'Fine' : 'Fee')}</td>
                          <td className="px-4 py-5 text-slate-600">{it.title || it.name}</td>
                          <td className="px-4 py-5 font-semibold text-slate-900">PKR {it.amount}</td>
                          <td className="px-4 py-5">
                            <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${it.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : it.status === 'PROCESSING' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                              {it.status}
                            </span>
                          </td>
                          <td className="px-4 py-5 text-slate-500">{it.dueDate || it.date || it.paidAt || "-"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                          No records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
    </section>
  );
}
