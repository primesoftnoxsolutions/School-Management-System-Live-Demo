import { useEffect, useRef, useState } from "react";
import { DropdownBackdrop, DropdownMenuPortal } from "./DropdownBackdrop";

export default function ScrollableMultiSelect({
  label,
  placeholder = "Select...",
  values = [],
  options = [],
  onChange,
  required = false,
  openUpward = false,
  dark = false,
  error = false,
  errorMessage = "",
  disabled = false,
  dataField = "",
  showTooltip = true,
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const updateMenuPosition = () => {
    if (!openUpward || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const maxHeight = Math.min(176, Math.max(rect.top - 12, 120));
    setMenuStyle({
      left: rect.left,
      width: rect.width,
      bottom: window.innerHeight - rect.top + 4,
      maxHeight,
    });
  };

  useEffect(() => {
    const onDocClick = (event) => {
      const inRoot = rootRef.current?.contains(event.target);
      const inMenu = menuRef.current?.contains(event.target);
      if (!inRoot && !inMenu) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!open || !openUpward) return undefined;
    updateMenuPosition();
    const onReposition = () => updateMenuPosition();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, openUpward, options.length]);

  const toggleValue = (value) => {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value));
    } else {
      onChange([...values, value]);
    }
  };

  const summary = values.length ? values.join(", ") : placeholder;

  const triggerClass = [
    dark
      ? "flex w-full items-center justify-between gap-2 rounded-xl border bg-[#1a1b26] px-3 py-2.5 text-left text-sm outline-none transition"
      : "flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2.5 text-left text-sm outline-none transition",
    error
      ? dark
        ? "border-rose-500 ring-2 ring-rose-500/30"
        : "border-rose-500 ring-2 ring-rose-200"
      : dark
        ? "border-white/[0.06] hover:border-[#7c4dff]/30 focus:border-[#7c4dff]/40 focus:ring-2 focus:ring-[#7c4dff]/15"
        : "border-slate-200 hover:border-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100",
    disabled ? "cursor-not-allowed opacity-50" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const menuContent = (
    <div className="max-h-44 overflow-y-auto p-1" style={openUpward ? { maxHeight: menuStyle.maxHeight } : undefined}>
      {options.map((opt) => {
        const checked = values.includes(opt.value);
        return (
          <label
            key={opt.value}
            className={`mb-0.5 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition last:mb-0 ${
              checked
                ? dark
                  ? "bg-[#7c4dff]/20 text-[#7c4dff]"
                  : "bg-indigo-50 text-indigo-700"
                : dark
                  ? "text-white hover:bg-white/[0.04]"
                  : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggleValue(opt.value)}
              className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 accent-indigo-600"
            />
            <span className="truncate">{opt.label}</span>
          </label>
        );
      })}
    </div>
  );

  return (
    <div
      ref={rootRef}
      className={`relative ${disabled ? "pointer-events-none" : ""}`}
      title={error && errorMessage ? errorMessage : undefined}
      data-field={dataField || undefined}
    >
      {label ? (
        <p className={`mb-2 text-sm font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-700"}`}>
          {label}
          {required ? <span className="text-rose-500"> *</span> : null}
        </p>
      ) : null}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        className={triggerClass}
        title={error && errorMessage ? errorMessage : undefined}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            values.length ? (dark ? "text-white" : "text-slate-800") : dark ? "text-[#9e9e9e]" : "text-slate-400"
          }`}
          title={values.length ? summary : undefined}
        >
          {summary}
        </span>
        <span className={`shrink-0 ${dark ? "text-[#9e9e9e]" : "text-slate-400"}`}>{open ? "▲" : "▼"}</span>
      </button>
      {error && errorMessage && showTooltip ? (
        <p className="pointer-events-none absolute left-0 top-full z-10 mt-1 rounded-md bg-rose-600 px-2 py-1 text-[11px] font-medium text-white shadow-lg">
          {errorMessage}
        </p>
      ) : null}
      {open && openUpward ? (
        <>
          <DropdownBackdrop onClose={() => setOpen(false)} />
          <DropdownMenuPortal menuRef={menuRef} style={menuStyle} dark={dark}>
            {menuContent}
          </DropdownMenuPortal>
        </>
      ) : null}
      {open && !openUpward ? (
        <div
          className={`absolute z-20 mt-1 w-full overflow-hidden rounded-xl shadow-lg ${
            dark ? "border border-white/[0.06] bg-[#161722]" : "border border-slate-200 bg-white"
          }`}
        >
          {menuContent}
        </div>
      ) : null}
    </div>
  );
}
