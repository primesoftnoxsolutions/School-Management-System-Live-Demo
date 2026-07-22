import { useEffect, useMemo, useRef, useState } from "react";
import { DropdownBackdrop, DropdownMenuPortal } from "./DropdownBackdrop";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDateKey(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return { year, month, day, date };
}

function todayKey() {
  const now = new Date();
  return toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

function buildCalendarCells(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(year, month, 1 - firstDay + i);
    cells.push({
      day: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      outside: date.getMonth() !== month,
      key: toDateKey(date.getFullYear(), date.getMonth(), date.getDate()),
    });
  }
  return cells;
}

function IconCalendar({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v2M16 3v2M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function IconChevron({ direction = "left" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      {direction === "left" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
      )}
    </svg>
  );
}

export default function ModernDatePicker({
  label,
  value = "",
  onChange,
  min,
  max,
  dark = false,
  placeholder = "Select date",
  flow = "calendar",
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const [step, setStep] = useState("day");
  const [pendingDay, setPendingDay] = useState(null);
  const [pendingMonth, setPendingMonth] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const isSteppedFlow = flow === "day-month-year";

  const parsed = parseDateKey(value);
  const [viewYear, setViewYear] = useState(parsed?.year ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? new Date().getMonth());

  const cells = useMemo(() => buildCalendarCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const today = todayKey();

  const updateMenuPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelWidth = 300;
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - panelWidth - 12);
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const openUp = spaceBelow < 340 && spaceAbove > spaceBelow;

    setMenuStyle({
      left,
      width: panelWidth,
      top: openUp ? undefined : rect.bottom + 8,
      bottom: openUp ? window.innerHeight - rect.top + 8 : undefined,
    });
  };

  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [value]);

  useEffect(() => {
    if (!open || !isSteppedFlow) return;
    setStep("day");
    if (parsed) {
      setPendingDay(parsed.day);
      setPendingMonth(parsed.month);
    } else {
      setPendingDay(null);
      setPendingMonth(null);
    }
  }, [open, isSteppedFlow, value, parsed?.day, parsed?.month]);

  const isDisabled = (key) => {
    if (min && key < min) return true;
    if (max && key > max) return true;
    return false;
  };

  const maxParsed = parseDateKey(max);
  const minParsed = parseDateKey(min);
  const yearOptions = useMemo(() => {
    const endYear = maxParsed?.year ?? new Date().getFullYear();
    const startYear = minParsed?.year ?? endYear - 80;
    const years = [];
    for (let year = endYear; year >= startYear; year -= 1) {
      years.push(year);
    }
    return years;
  }, [maxParsed?.year, minParsed?.year]);

  const isValidPendingDate = (year, month, day) => {
    const key = toDateKey(year, month, day);
    return Boolean(parseDateKey(key)) && !isDisabled(key);
  };

  const isMonthDisabled = (monthIndex) => {
    if (pendingDay == null) return false;
    return !yearOptions.some((year) => isValidPendingDate(year, monthIndex, pendingDay));
  };

  const selectPendingDay = (day) => {
    setPendingDay(day);
    setStep("month");
  };

  const selectPendingMonth = (monthIndex) => {
    setPendingMonth(monthIndex);
    setStep("year");
  };

  const selectPendingYear = (year) => {
    if (pendingDay == null || pendingMonth == null) return;
    const key = toDateKey(year, pendingMonth, pendingDay);
    if (!parseDateKey(key) || isDisabled(key)) return;
    onChange?.(key);
    setOpen(false);
  };

  const steppedBack = () => {
    if (step === "year") {
      setStep("month");
      return;
    }
    if (step === "month") {
      setStep("day");
    }
  };

  const choiceBtnClass = (selected, disabled = false) => {
    if (selected) {
      return dark
        ? "bg-[#7c4dff] font-semibold text-white shadow-[0_8px_18px_rgba(124,77,255,0.35)]"
        : "bg-indigo-600 font-semibold text-white shadow-[0_8px_18px_rgba(79,70,229,0.28)]";
    }
    if (disabled) {
      return dark ? "cursor-not-allowed text-white/20" : "cursor-not-allowed text-slate-300";
    }
    return dark ? "text-white hover:bg-white/[0.06]" : "text-slate-700 hover:bg-slate-100";
  };

  const steppedTitle =
    step === "day" ? "Select Day" : step === "month" ? "Select Month" : "Select Year";

  useEffect(() => {
    if (!open) return undefined;
    updateMenuPosition();
    const onReposition = () => updateMenuPosition();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  useEffect(() => {
    const onDocClick = (event) => {
      const inRoot = rootRef.current?.contains(event.target);
      const inMenu = menuRef.current?.contains(event.target);
      if (!inRoot && !inMenu) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selectDate = (key) => {
    if (isDisabled(key)) return;
    onChange?.(key);
    setOpen(false);
  };

  const shiftMonth = (delta) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const displayValue = parsed
    ? parsed.date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : placeholder;

  const triggerClass = dark
    ? "flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#1a1b26] px-3.5 py-2.5 text-left text-sm text-white outline-none transition hover:border-[#7c4dff]/30 focus:border-[#7c4dff]/40 focus:ring-2 focus:ring-[#7c4dff]/15"
    : "flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm text-slate-700 outline-none transition hover:border-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

  const navBtnClass = dark
    ? "flex h-8 w-8 items-center justify-center rounded-lg text-[#9e9e9e] transition hover:bg-white/[0.06] hover:text-white"
    : "flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800";

  return (
    <div ref={rootRef} className="relative">
      {label ? (
        <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>
          {label}
        </label>
      ) : null}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={triggerClass}
      >
        <span className={parsed ? "" : dark ? "text-[#9e9e9e]" : "text-slate-400"}>{displayValue}</span>
        <span className={dark ? "text-[#7c4dff]" : "text-indigo-500"}>
          <IconCalendar />
        </span>
      </button>

      {open ? (
        <>
          <DropdownBackdrop onClose={() => setOpen(false)} />
          <DropdownMenuPortal menuRef={menuRef} style={menuStyle} dark={dark} className="modern-date-picker-panel">
            <div className="p-4">
              {isSteppedFlow ? (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    {step !== "day" ? (
                      <button type="button" className={navBtnClass} onClick={steppedBack} aria-label="Go back">
                        <IconChevron direction="left" />
                      </button>
                    ) : (
                      <span className="h-8 w-8" />
                    )}
                    <div className="text-center">
                      <p className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-800"}`}>{steppedTitle}</p>
                      {pendingDay != null && step !== "day" ? (
                        <p className={`text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Day {pendingDay}</p>
                      ) : null}
                      {pendingMonth != null && step === "year" ? (
                        <p className={`text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{MONTHS[pendingMonth]}</p>
                      ) : null}
                    </div>
                    <span className="h-8 w-8" />
                  </div>

                  {step === "day" ? (
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => selectPendingDay(day)}
                          className={`modern-date-picker-day flex h-9 w-9 items-center justify-center rounded-full text-sm transition ${choiceBtnClass(pendingDay === day)}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {step === "month" ? (
                    <div className="grid grid-cols-3 gap-2">
                      {MONTHS.map((month, monthIndex) => {
                        const disabled = isMonthDisabled(monthIndex);
                        return (
                          <button
                            key={month}
                            type="button"
                            disabled={disabled}
                            onClick={() => selectPendingMonth(monthIndex)}
                            className={`rounded-xl px-2 py-2.5 text-sm transition ${choiceBtnClass(pendingMonth === monthIndex, disabled)}`}
                          >
                            {month.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {step === "year" ? (
                    <div className="max-h-56 overflow-y-auto pr-1">
                      <div className="grid grid-cols-3 gap-2">
                        {yearOptions.map((year) => {
                          const disabled = pendingDay == null || pendingMonth == null || !isValidPendingDate(year, pendingMonth, pendingDay);
                          return (
                            <button
                              key={year}
                              type="button"
                              disabled={disabled}
                              onClick={() => selectPendingYear(year)}
                              className={`rounded-xl px-2 py-2.5 text-sm transition ${choiceBtnClass(parsed?.year === year && value, disabled)}`}
                            >
                              {year}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div
                    className={`mt-4 flex items-center justify-between border-t pt-3 ${
                      dark ? "border-white/[0.06]" : "border-slate-100"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onChange?.("");
                        setOpen(false);
                      }}
                      className={`text-sm font-medium transition ${
                        dark ? "text-[#9e9e9e] hover:text-white" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Clear
                    </button>
                    <span className={`text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-400"}`}>Day → Month → Year</span>
                  </div>
                </>
              ) : (
                <>
              <div className="mb-4 flex items-center justify-between">
                <button type="button" className={navBtnClass} onClick={() => shiftMonth(-1)} aria-label="Previous month">
                  <IconChevron direction="left" />
                </button>
                <div className="text-center">
                  <p className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-800"}`}>
                    {MONTHS[viewMonth]} {viewYear}
                  </p>
                </div>
                <button type="button" className={navBtnClass} onClick={() => shiftMonth(1)} aria-label="Next month">
                  <IconChevron direction="right" />
                </button>
              </div>

              <div className="mb-2 grid grid-cols-7 gap-1">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className={`py-1 text-center text-[11px] font-semibold uppercase tracking-wide ${
                      dark ? "text-[#9e9e9e]" : "text-slate-400"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {cells.map((cell) => {
                  const selected = value === cell.key;
                  const disabled = isDisabled(cell.key);
                  const isToday = cell.key === today;
                  return (
                    <button
                      key={cell.key}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectDate(cell.key)}
                      className={`modern-date-picker-day flex h-9 w-9 items-center justify-center rounded-full text-sm transition ${
                        selected
                          ? dark
                            ? "bg-[#7c4dff] font-semibold text-white shadow-[0_8px_18px_rgba(124,77,255,0.35)]"
                            : "bg-indigo-600 font-semibold text-white shadow-[0_8px_18px_rgba(79,70,229,0.28)]"
                          : disabled
                            ? dark
                              ? "cursor-not-allowed text-white/20"
                              : "cursor-not-allowed text-slate-300"
                            : cell.outside
                              ? dark
                                ? "text-white/25 hover:bg-white/[0.03]"
                                : "text-slate-300 hover:bg-slate-50"
                              : isToday
                                ? dark
                                  ? "font-semibold text-[#7c4dff] ring-1 ring-[#7c4dff]/40 hover:bg-[#7c4dff]/10"
                                  : "font-semibold text-indigo-600 ring-1 ring-indigo-200 hover:bg-indigo-50"
                                : dark
                                  ? "text-white hover:bg-white/[0.06]"
                                  : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>

              <div
                className={`mt-4 flex items-center justify-between border-t pt-3 ${
                  dark ? "border-white/[0.06]" : "border-slate-100"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onChange?.("");
                    setOpen(false);
                  }}
                  className={`text-sm font-medium transition ${
                    dark ? "text-[#9e9e9e] hover:text-white" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Clear
                </button>
                <button
                  type="button"
                  disabled={isDisabled(today)}
                  onClick={() => selectDate(today)}
                  className={`text-sm font-semibold transition ${
                    dark ? "text-[#7c4dff] hover:text-[#9d7cff]" : "text-indigo-600 hover:text-indigo-700"
                  } disabled:opacity-40`}
                >
                  Today
                </button>
              </div>
                </>
              )}
            </div>
          </DropdownMenuPortal>
        </>
      ) : null}
    </div>
  );
}
