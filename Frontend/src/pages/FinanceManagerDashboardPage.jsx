import { useCallback, useEffect, useState } from "react";
import api from "../services/api/client";
import {
  IconChecklist,
  IconFee,
  IconFine,
  IconReports,
  IconStudents,
} from "../components/icons/NavIcons";

const currency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;
const POLL_MS = 8000;

const emptyInventory = {
  totalDesks: 0,
  brokenDesks: 0,
  totalBenchesChairs: 0,
  brokenBenchesChairs: 0,
  totalBulbs: 0,
  brokenBulbs: 0,
  totalFans: 0,
  brokenFans: 0,
};

function SummaryCard({ label, value, helper, broken, tone, Icon, large }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
  };

  const accent = {
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    indigo: "bg-indigo-500",
    cyan: "bg-cyan-500",
    violet: "bg-violet-500",
  };

  return (
    <div className={`ref-card p-5 relative overflow-hidden ${large ? "h-36" : ""}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${accent[tone] || "bg-slate-300"} rounded-l-xl`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className={`mt-2 ${large ? "text-3xl" : "text-2xl"} font-bold text-slate-900`}>{value}</p>
          {helper ? <p className="mt-2 text-xs font-medium text-slate-400">{helper}</p> : null}
          {typeof broken === "number" ? (
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700"
              title={`Broken quantity: ${broken}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              Broken: {Number(broken || 0).toLocaleString()}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${tones[tone]}`}>
            {Icon ? <Icon className="h-5 w-5" /> : null}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function FinanceManagerDashboardPage({ onNavigate }) {
  const [overview, setOverview] = useState(null);
  const [inventory, setInventory] = useState(emptyInventory);
  const [purchaseSpent, setPurchaseSpent] = useState(0);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [overviewRes, assetsRes, purchaseRes] = await Promise.all([
        api.get("/reports/overview"),
        api.get("/assets/summary"),
        api.get("/purchases/summary"),
      ]);
      setOverview(overviewRes.data.data);
      setInventory({ ...emptyInventory, ...(assetsRes.data.data || {}) });
      setPurchaseSpent(Number(purchaseRes.data.data?.totalAmount || 0));
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load finance summary.");
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const totalFees = Number(overview?.feeCollected || 0) + Number(overview?.pendingFees || 0);

  return (
    <section className="space-y-6">
      {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}

      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Purchase Statistics</h3>
          <span className="inline-flex items-center gap-3 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">💳</span>
            <div className="text-left">
              <div className="text-xs text-slate-400">TOTAL SPENT</div>
              <div className="text-sm font-bold text-blue-600">{currency(purchaseSpent)}</div>
            </div>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Desks"
            value={Number(inventory.totalDesks || 0).toLocaleString()}
            helper="Available inventory"
            broken={Number(inventory.brokenDesks || 0)}
            tone="blue"
            Icon={IconChecklist}
          />
          <SummaryCard
            label="Total Benches & Chairs"
            value={Number(inventory.totalBenchesChairs || 0).toLocaleString()}
            helper="Available inventory"
            broken={Number(inventory.brokenBenchesChairs || 0)}
            tone="indigo"
            Icon={IconStudents}
          />
          <SummaryCard
            label="Total Bulbs"
            value={Number(inventory.totalBulbs || 0).toLocaleString()}
            helper="Available inventory"
            broken={Number(inventory.brokenBulbs || 0)}
            tone="amber"
            Icon={IconFine}
          />
          <SummaryCard
            label="Total Fans"
            value={Number(inventory.totalFans || 0).toLocaleString()}
            helper="Available inventory"
            broken={Number(inventory.brokenFans || 0)}
            tone="cyan"
            Icon={IconReports}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-bold text-slate-900">Financial Summary</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard
            large
            label="Total Fees"
            value={currency(totalFees)}
            helper="Received plus pending"
            tone="violet"
            Icon={IconFee}
          />
          <SummaryCard
            large
            label="Received Fees"
            value={currency(overview?.feeCollected)}
            helper="Collected fee payments"
            tone="green"
            Icon={IconFee}
          />
          <SummaryCard
            large
            label="Pending Fees"
            value={currency(overview?.pendingFees)}
            helper="Outstanding fee balance"
            tone="rose"
            Icon={IconFee}
          />
        </div>
      </div>
    </section>
  );
}
