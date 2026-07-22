import { useEffect, useState } from "react";

import api from "../../services/api/client";

import { FeeBellButton } from "./FeeNotificationPopup";

export default function TopHeader({
  user,
  dark = false,
  onToggleTheme,
}) {
  const [pendingFeeCount, setPendingFeeCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get("/dashboard/pending-fees");
        setPendingFeeCount(response.data?.data?.length || 0);
      } catch {
        setPendingFeeCount(0);
      }
    };

    if (user?.role === "ACCOUNTANT") {
      load();
    }
  }, [user?.role]);

  return (
    <header className="mb-4 flex items-center gap-4 bg-transparent px-5 py-4 lg:px-6">
      <div className="relative min-w-0 flex-1">
        <span
          className={`pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 ${
            dark ? "text-[#9e9e9e]" : "text-slate-400"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="6" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
        </span>

        <input
          type="search"
          placeholder="Search students, teachers, classes..."
          className={`h-12 w-full rounded-xl border px-12 text-sm font-normal outline-none transition placeholder:font-normal ${
            dark
              ? "border-white/[0.06] bg-[#161722] text-white placeholder:text-[#9e9e9e] focus:border-[#7c4dff]/40"
              : "border-white bg-white/95 text-slate-700 shadow-[0_14px_34px_rgba(8,13,27,0.08)] placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-500/15"
          }`}
        />
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        {onToggleTheme ? (
          <button
            type="button"
            onClick={onToggleTheme}
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
              dark
                ? "border-white/[0.06] bg-[#161722] text-[#7c4dff] hover:bg-white/[0.04]"
                : "border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50"
            }`}
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          >
            {dark ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M20 15.5A8.2 8.2 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
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
        ) : null}

        <FeeBellButton count={pendingFeeCount} dark={dark} />

        <div
          className={`flex h-12 items-center gap-3 rounded-xl border px-3 py-2 ${
            dark ? "border-white/[0.06] bg-[#161722]" : "border-white bg-white/95 shadow-[0_14px_34px_rgba(8,13,27,0.08)]"
          }`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7c4dff] text-sm font-semibold text-white">
            {(user?.fullName || "A").charAt(0)}
          </div>
          <div className="hidden text-left sm:block">
            <p className={`text-sm font-medium ${dark ? "text-white" : "text-slate-800"}`}>{user?.fullName || "Admin"}</p>
            <p className={`text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
              {user?.role === "ACCOUNTANT" ? "Finance Manager" : user?.role || "User"}
            </p>
          </div>
          <span className={dark ? "text-[#9e9e9e]" : "text-slate-400"}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </header>
  );
}
