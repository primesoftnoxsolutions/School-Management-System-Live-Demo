import { createPortal } from "react-dom";

export function DropdownBackdrop({ onClose }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[110] bg-slate-900/35 backdrop-blur-[2px]"
      aria-hidden="true"
      onMouseDown={onClose}
    />,
    document.body
  );
}

export function DropdownMenuPortal({ menuRef, style, className = "", dark = false, children }) {
  return createPortal(
    <div
      ref={menuRef}
      className={`fixed z-[120] overflow-hidden rounded-xl shadow-xl ${
        dark
          ? "border border-white/[0.06] bg-[#161722]"
          : "border border-slate-200 bg-white"
      } ${className}`}
      style={style}
    >
      {children}
    </div>,
    document.body
  );
}
