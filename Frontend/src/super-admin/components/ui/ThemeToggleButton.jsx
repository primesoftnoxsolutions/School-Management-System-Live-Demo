import { useState } from "react";

export default function ThemeToggleButton({ dark = false, onToggle, className = "" }) {
  const [spinning, setSpinning] = useState(false);

  if (!onToggle) return null;

  const handleToggle = () => {
    setSpinning(true);
    onToggle();
    window.setTimeout(() => setSpinning(false), 520);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${spinning ? "theme-toggle-spin" : ""} ${className} ${
        dark
          ? "border-white/[0.06] bg-[#1a1b26] text-[#7c4dff] hover:bg-white/[0.04]"
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
      }`}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {dark ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            d="M20 15.5A8.2 8.2 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
