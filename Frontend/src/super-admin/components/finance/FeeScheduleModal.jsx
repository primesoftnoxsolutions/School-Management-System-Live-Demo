import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ScrollableSelect from "../ui/ScrollableSelect";
import { CLASS_OPTIONS } from "../../constants/classes";

const YEAR_OPTIONS = Array.from({ length: 1101 }, (_, index) => {
  const year = 3000 - index;
  return { value: String(year), label: String(year) };
});

const EDIT_OPTIONS = [
  { value: "all", label: "Edit All Columns" },
  { value: "className", label: "Edit Classes" },
  { value: "fees", label: "Edit Admission Fees" },
  { value: "annually", label: "Edit Annually" },
];

const FONT = "[font-family:'Montserrat','Manrope',sans-serif]";

const storageKey = (branch, yearFrom, yearTo) =>
  `insaf-fee-schedule:${branch || "Boys"}:${yearFrom || "all"}:${yearTo || "all"}`;

const buildDefaultRows = () =>
  CLASS_OPTIONS.map((className) => ({
    id: className,
    className,
    fees: "0",
    annually: "0",
  }));

const loadRows = (branch, yearFrom, yearTo) => {
  try {
    const raw = localStorage.getItem(storageKey(branch, yearFrom, yearTo));
    if (!raw) return buildDefaultRows();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return buildDefaultRows();
    const byClass = new Map(parsed.map((row) => [row.className, row]));
    return CLASS_OPTIONS.map((className) => {
      const saved = byClass.get(className);
      return {
        id: className,
        className,
        fees: String(saved?.fees ?? "0"),
        annually: String(saved?.annually ?? "0"),
      };
    });
  } catch {
    return buildDefaultRows();
  }
};

const saveRows = (branch, yearFrom, yearTo, rows) => {
  try {
    localStorage.setItem(storageKey(branch, yearFrom, yearTo), JSON.stringify(rows));
  } catch {
    // ignore
  }
};

function canEditField(scope, field) {
  if (!scope) return false;
  if (scope === "all") return true;
  return scope === field;
}

export default function FeeScheduleModal({ open, onClose, dark = false, branchSection = "Boys" }) {
  const currentYear = String(new Date().getFullYear());
  const [yearFrom, setYearFrom] = useState(currentYear);
  const [yearTo, setYearTo] = useState(currentYear);
  const [rows, setRows] = useState(() => buildDefaultRows());
  const [draftRows, setDraftRows] = useState(() => buildDefaultRows());
  const [editScope, setEditScope] = useState(null);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const editMenuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const next = loadRows(branchSection, yearFrom, yearTo);
    setRows(next);
    setDraftRows(next);
    setEditScope(null);
    setEditMenuOpen(false);
  }, [open, branchSection, yearFrom, yearTo]);

  useEffect(() => {
    if (!editMenuOpen) return undefined;
    const onMouseDown = (event) => {
      if (!editMenuRef.current?.contains(event.target)) setEditMenuOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [editMenuOpen]);

  const yearHeading = useMemo(() => {
    if (yearFrom && yearTo && yearFrom !== yearTo) return `${yearFrom} - ${yearTo}`;
    return yearFrom || yearTo || currentYear;
  }, [yearFrom, yearTo, currentYear]);

  if (!open) return null;

  const editing = Boolean(editScope);
  const displayRows = editing ? draftRows : rows;

  const updateDraft = (id, field, value) => {
    setDraftRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const beginEdit = (scope) => {
    setDraftRows(rows.map((row) => ({ ...row })));
    setEditScope(scope);
    setEditMenuOpen(false);
  };

  const cancelEdit = () => {
    setDraftRows(rows.map((row) => ({ ...row })));
    setEditScope(null);
    setEditMenuOpen(false);
  };

  const saveEdit = () => {
    const next = draftRows.map((row) => ({
      ...row,
      className: String(row.className || "").trim() || row.id,
      fees: String(row.fees || "").trim() || "0",
      annually: String(row.annually || "").trim() || "0",
    }));
    setRows(next);
    saveRows(branchSection, yearFrom, yearTo, next);
    setEditScope(null);
    setEditMenuOpen(false);
  };

  const cellInput = (value, onChange, align = "center") => (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`h-12 w-full rounded-xl border px-3 text-[17px] font-semibold outline-none transition ${
        align === "left" ? "text-left" : "text-center"
      } ${
        dark
          ? "border-white/[0.12] bg-[#0f1018] text-white focus:border-[#7c4dff]/55"
          : "border-[#c9d6ef] bg-white text-[#1e293b] focus:border-[#3b82f6] focus:ring-2 focus:ring-blue-100"
      } ${FONT}`}
    />
  );

  return createPortal(
    <div
      className={`fixed inset-0 z-[140] flex items-center justify-center overflow-y-auto px-4 py-8 ${
        dark ? "bg-slate-950/70" : "bg-slate-900/50"
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !editing) onClose();
      }}
    >
      <div
        className={`w-full max-w-6xl overflow-hidden rounded-[28px] border shadow-[0_28px_80px_rgba(15,23,42,0.22)] ${FONT} ${
          dark ? "border-white/[0.08] bg-[#14151f]" : "border-[#dbe4f5] bg-white"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={`flex items-start justify-between gap-4 border-b px-7 py-5 ${dark ? "border-white/[0.06]" : "border-[#e8eef8]"}`}>
          <div>
            <h3 className={`text-[26px] font-extrabold tracking-tight ${dark ? "text-white" : "text-[#0f1f3d]"}`}>Fee Schedule</h3>
            <p className={`mt-1 text-[14px] font-medium ${dark ? "text-[#9e9e9e]" : "text-[#64748b]"}`}>
              Class-wise admission fees and annual paper fund
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full p-2 ${dark ? "text-[#9e9e9e] hover:bg-white/[0.06] hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}
            aria-label="Close fee schedule"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 px-7 py-6">
          <div className="grid items-end gap-4 lg:grid-cols-[1fr_1fr_auto]">
            <ScrollableSelect
              label="Years From"
              placeholder="Select year"
              value={yearFrom}
              options={YEAR_OPTIONS}
              onChange={setYearFrom}
              dark={dark}
              portal
              menuMaxHeight={260}
              disabled={editing}
            />
            <ScrollableSelect
              label="Years To"
              placeholder="Select year"
              value={yearTo}
              options={YEAR_OPTIONS}
              onChange={setYearTo}
              dark={dark}
              portal
              menuMaxHeight={260}
              disabled={editing}
            />

            <div ref={editMenuRef} className="relative min-w-[180px]">
              <p className={`mb-1.5 text-xs font-semibold leading-none ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Actions</p>
              {editing ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className={`h-11 rounded-xl border px-4 text-sm font-bold ${
                      dark
                        ? "border-white/[0.1] text-[#d7d9e2] hover:bg-white/[0.04]"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Cancel
                  </button>
                  <button type="button" onClick={saveEdit} className="ref-btn-primary h-11 px-5">
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setEditMenuOpen((openMenu) => !openMenu)}
                    className={`flex h-11 w-full items-center justify-between gap-3 rounded-xl border px-4 text-sm font-bold transition ${
                      dark
                        ? "border-white/[0.1] bg-[#1a1b26] text-white hover:bg-white/[0.04]"
                        : "border-[#cfd9ec] bg-white text-[#1e3a8a] shadow-sm hover:border-[#93c5fd] hover:bg-[#f8fbff]"
                    }`}
                    aria-expanded={editMenuOpen}
                  >
                    <span>Edit</span>
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-4 w-4 transition ${editMenuOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {editMenuOpen ? (
                    <div
                      className={`absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border shadow-xl ${
                        dark ? "border-white/[0.08] bg-[#1a1b26]" : "border-slate-200 bg-white"
                      }`}
                    >
                      {EDIT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => beginEdit(option.value)}
                          className={`block w-full px-4 py-3 text-left text-sm font-semibold transition ${
                            dark ? "text-[#e8e8ef] hover:bg-white/[0.05]" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div
            className={`rounded-2xl border px-6 py-6 text-center ${
              dark
                ? "border-white/[0.08] bg-[linear-gradient(135deg,#1a1b26_0%,#1f2438_100%)]"
                : "border-[#c7d7f5] bg-[linear-gradient(135deg,#f7f9ff_0%,#eef3ff_55%,#f8fafc_100%)]"
            }`}
          >
            <h4 className={`text-[28px] font-black uppercase leading-tight tracking-[0.06em] ${dark ? "text-white" : "text-[#132a57]"}`}>
              Fee Schedule of Insaf Grammar High School
            </h4>
            <p className={`mt-3 text-[18px] font-bold tracking-wide ${dark ? "text-[#93c5fd]" : "text-[#1d4ed8]"}`}>{yearHeading}</p>
          </div>

          <div className={`overflow-hidden rounded-2xl border-2 ${dark ? "border-white/[0.1]" : "border-[#1e3a8a]/35"}`}>
            <div className="max-h-[56vh] overflow-auto">
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  <col className="w-[40%]" />
                  <col className="w-[30%]" />
                  <col className="w-[30%]" />
                </colgroup>
                <thead className={`sticky top-0 z-[1] ${dark ? "bg-[#1e2a4a] text-white" : "bg-[#1e3a8a] text-white"}`}>
                  <tr>
                    <th className={`border px-7 py-5 text-left text-[17px] font-extrabold uppercase tracking-[0.1em] ${dark ? "border-white/10" : "border-[#172e6d]"}`}>
                      Classes
                    </th>
                    <th className={`border px-7 py-5 text-center text-[17px] font-extrabold uppercase tracking-[0.1em] ${dark ? "border-white/10" : "border-[#172e6d]"}`}>
                      Admission Fees
                    </th>
                    <th className={`border px-7 py-5 text-center text-[17px] font-extrabold uppercase tracking-[0.1em] ${dark ? "border-white/10" : "border-[#172e6d]"}`}>
                      Annually
                      <span className="mt-1.5 block text-[12px] font-semibold normal-case tracking-normal opacity-85">Paper Fund / Yearly</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row, index) => (
                    <tr
                      key={row.id}
                      className={
                        dark
                          ? index % 2 === 0
                            ? "bg-[#161722]"
                            : "bg-[#1a1b26]"
                          : index % 2 === 0
                            ? "bg-white"
                            : "bg-[#f5f8ff]"
                      }
                    >
                      <td className={`border px-7 py-5 text-left text-[19px] font-bold ${dark ? "border-white/[0.08] text-white" : "border-[#d7e0f0] text-[#0f172a]"}`}>
                        {canEditField(editScope, "className")
                          ? cellInput(row.className, (value) => updateDraft(row.id, "className", value), "left")
                          : row.className}
                      </td>
                      <td className={`border px-7 py-5 text-center text-[19px] font-semibold tabular-nums ${dark ? "border-white/[0.08] text-[#e2e8f0]" : "border-[#d7e0f0] text-[#1e293b]"}`}>
                        {canEditField(editScope, "fees")
                          ? cellInput(row.fees, (value) => updateDraft(row.id, "fees", value))
                          : row.fees}
                      </td>
                      <td className={`border px-7 py-5 text-center text-[19px] font-semibold tabular-nums ${dark ? "border-white/[0.08] text-[#e2e8f0]" : "border-[#d7e0f0] text-[#1e293b]"}`}>
                        {canEditField(editScope, "annually")
                          ? cellInput(row.annually, (value) => updateDraft(row.id, "annually", value))
                          : row.annually}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
