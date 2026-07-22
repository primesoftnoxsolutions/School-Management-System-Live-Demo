import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const HOLD_MS = 2200;
const EXIT_MS = 400;

export default function RefreshSuccessNotice({ dark = false, onDone }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = window.setTimeout(() => setExiting(true), HOLD_MS);
    const doneTimer = window.setTimeout(() => onDone?.(), HOLD_MS + EXIT_MS);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onDone]);

  return createPortal(
    <div
      className={`pointer-events-none fixed left-1/2 top-6 z-[10000] -translate-x-1/2 ${
        exiting ? "app-refresh-notice-exit" : "app-refresh-notice-enter"
      }`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`flex items-center gap-3 rounded-2xl border px-5 py-3 shadow-lg ${
          dark
            ? "border-[#4caf50]/30 bg-[#161722] text-white shadow-black/30"
            : "border-emerald-200 bg-white text-slate-800 shadow-emerald-100/80"
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            dark ? "bg-[#4caf50]/15 text-[#4caf50]" : "bg-emerald-50 text-emerald-600"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              d="M20 6 9 17l-5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-800"}`}>Successfully refreshed</p>
      </div>
    </div>,
    document.body
  );
}
