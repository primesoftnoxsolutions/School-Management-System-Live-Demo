import { useEffect, useMemo, useState } from "react";

import api from "../../services/api/client";
import { MODAL_ANIM_MS, useAnimatedPresence } from "../../hooks/useAnimatedPresence";
import { IconBell } from "../icons/NavIcons";

export default function FeeNotificationPopup({ open, onClose, dark = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const { render, exiting } = useAnimatedPresence(open, MODAL_ANIM_MS);

  useEffect(() => {
    if (!open) return undefined;

    const load = async () => {
      setExpandedRows({});
      setLoading(true);
      try {
        const response = await api.get("/dashboard/pending-fees");
        setItems(response.data?.data || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
    return undefined;
  }, [open]);

  const groupedItems = useMemo(() => {
    const groups = new Map();

    items.forEach((item, index) => {
      const key = [
        item.teacherName || "",
        item.studentName || "",
        item.className || "",
        item.section || "",
        item.rollNumber || "",
        item.admissionNo || "",
      ].join("|");
      const detail = {
        id: item.id,
        title: item.title || item.feeType || "Fee",
        feeType: item.feeType || "",
        pendingAmount: Number(item.pendingAmount || 0),
        status: item.status || "",
        dueDate: item.dueDate || "",
      };

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          index,
          teacherName: item.teacherName || "-",
          studentName: item.studentName || "-",
          className: item.className || "",
          section: item.section || "A",
          rollNumber: item.rollNumber || "-",
          admissionNo: item.admissionNo || "-",
          status: item.status || "-",
          pendingAmount: Number(item.pendingAmount || 0),
          feeDetails: [detail],
        });
        return;
      }

      const group = groups.get(key);
      group.pendingAmount += Number(item.pendingAmount || 0);
      group.feeDetails.push(detail);
      if (!group.status && item.status) group.status = item.status;
    });

    return [...groups.values()].sort((a, b) => a.index - b.index);
  }, [items]);

  const toggleRow = (key) => {
    setExpandedRows((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  if (!render) return null;

  const backdropClass = exiting ? "modal-backdrop-exit" : "modal-backdrop-enter";
  const panelClass = exiting ? "modal-panel-exit" : "modal-panel-enter-top";
  const bodyClass = exiting ? "modal-body-exit" : "modal-body-enter";

  return (
    <div
      className={`${backdropClass} fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 ${
        dark ? "bg-[#0b0c15]/60" : "bg-slate-900/35"
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !exiting) onClose();
      }}
    >
      <div
        className={`${panelClass} ref-card w-full max-w-7xl p-0 ${dark ? "border-white/[0.06] bg-[#161722]" : ""}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={`flex items-center justify-between border-b px-5 py-4 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
          <div>
            <h3 className={`text-base font-semibold ${dark ? "text-white" : "text-slate-800"}`}>Pending Fee Alerts</h3>
            <p className={`text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Students with unpaid or overdue fees</p>
          </div>
          <button type="button" onClick={onClose} disabled={exiting} className="ref-icon-btn" aria-label="Close popup">
            x
          </button>
        </div>

        <div className={`${bodyClass} max-h-[70vh] overflow-auto p-4`}>
          {loading ? (
            <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Loading pending fees...</p>
          ) : groupedItems.length ? (
            <div className={`overflow-hidden rounded-2xl border ${dark ? "border-white/[0.06]" : "border-slate-200"}`}>
              <div
                className={`grid min-w-[1100px] grid-cols-[1.2fr_1.2fr_1fr_0.75fr_1fr_0.8fr_0.8fr] gap-0 border-b px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                  dark ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e]" : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                <span>Teacher Name</span>
                <span>Student Name</span>
                <span>Class/Section</span>
                <span>Roll #</span>
                <span>Registration #</span>
                <span>Status</span>
                <span>Pending Fee #</span>
              </div>

              <div className="min-w-[1100px] divide-y" style={{ divideColor: dark ? "rgba(255,255,255,0.06)" : "rgb(226 232 240)" }}>
                {groupedItems.map((item) => {
                  const isExpanded = Boolean(expandedRows[item.key]);
                  const hasMoreFees = item.feeDetails.length > 1;

                  return (
                    <div
                      key={item.key}
                      className={`${
                        dark ? "bg-[#161722] text-white" : "bg-white text-slate-700"
                      }`}
                    >
                      <div className="grid grid-cols-[1.2fr_1.2fr_1fr_0.75fr_1fr_0.8fr_0.8fr] gap-0 px-4 py-4 text-sm">
                        <span className={`pr-3 text-[15px] font-medium ${dark ? "text-white" : "text-slate-700"}`}>{item.teacherName || "-"}</span>
                        <span className="flex items-center gap-2 pr-3 text-[16px] font-semibold leading-tight">
                          {hasMoreFees ? (
                            <button
                              type="button"
                              onClick={() => toggleRow(item.key)}
                              className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
                                dark
                                  ? "border-white/[0.08] bg-white/[0.04] text-[#9e9e9e] hover:text-white"
                                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                              }`}
                              aria-label={isExpanded ? "Collapse fee details" : "Expand fee details"}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                aria-hidden="true"
                              >
                                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          ) : (
                            <span className="inline-block h-6 w-6" />
                          )}
                          <span>{item.studentName || "-"}</span>
                        </span>
                        <span className={dark ? "text-[#9e9e9e]" : "text-slate-600"}>
                          {item.className ? `${item.className} - ${item.section || "A"}` : "-"}
                        </span>
                        <span className={dark ? "text-[#9e9e9e]" : "text-slate-600"}>{item.rollNumber || "-"}</span>
                        <span className={dark ? "text-[#9e9e9e]" : "text-slate-600"}>{item.admissionNo || "-"}</span>
                        <span className="font-medium text-amber-600">{item.status || "-"}</span>
                        <span className="font-semibold text-rose-600">Rs. {Number(item.pendingAmount || 0).toLocaleString()}</span>
                      </div>

                      {hasMoreFees ? (
                        <div
                          className={`grid overflow-hidden border-t px-4 transition-all duration-300 ease-out ${
                            isExpanded ? "grid-rows-[1fr] py-3 opacity-100" : "grid-rows-[0fr] py-0 opacity-0"
                          } ${dark ? "border-white/[0.06] bg-white/[0.02]" : "border-slate-100 bg-slate-50/60"}`}
                        >
                          <div className="min-h-0 overflow-hidden">
                            <div className="space-y-2">
                            {item.feeDetails.map((fee, index) => (
                              <div
                                key={fee.id || `${item.key}-${index}`}
                                className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                                  dark ? "border-white/[0.06] bg-[#1a1b26]" : "border-slate-200 bg-white"
                                }`}
                              >
                                <div className="min-w-0">
                                  <p className={`text-base font-semibold leading-5 ${dark ? "text-white" : "text-slate-800"}`}>{fee.title}</p>
                                  <p className={`mt-1 text-xs leading-5 ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                                    {fee.feeType ? `${fee.feeType} | ` : ""}
                                    {fee.dueDate ? `Due ${new Date(fee.dueDate).toLocaleDateString()}` : "Pending fee detail"}
                                  </p>
                                </div>
                                <p className="shrink-0 self-center text-base font-semibold text-rose-600">
                                  Rs. {Number(fee.pendingAmount || 0).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>No pending fee records found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function FeeBellButton({ count = 0, dark = false }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`relative flex h-11 w-11 items-center justify-center rounded-xl border text-sm transition ${
          dark
            ? "border-white/[0.06] bg-[#161722] text-[#9e9e9e] hover:bg-white/[0.04] hover:text-white"
            : "border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
        }`}
        aria-label="Pending fee notifications"
        onClick={() => setOpen(true)}
      >
        <IconBell className="h-4 w-4" />
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] text-white">
            {count}
          </span>
        ) : null}
      </button>
      <FeeNotificationPopup open={open} onClose={() => setOpen(false)} dark={dark} />
    </>
  );
}
