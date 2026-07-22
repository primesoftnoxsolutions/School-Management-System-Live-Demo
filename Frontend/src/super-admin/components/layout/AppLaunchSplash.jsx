const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin Portal",
  ACCOUNTANT: "Finance Portal",
  TEACHER: "Teacher Portal",
  STUDENT: "Student Portal",
};

function SchoolCrestMark({ className = "h-16 w-14" }) {
  return (
    <svg className={className} viewBox="0 0 64 72" fill="none" aria-hidden>
      <path d="M32 2L58 14v22c0 16.5-11.2 28.8-26 34-14.8-5.2-26-17.5-26-34V14L32 2z" fill="#1B5E3B" />
      <path d="M32 8L52 17.5v17c0 12.8-8.6 22.5-20 27-11.4-4.5-20-14.2-20-27v-17L32 8z" fill="#F5C518" />
      <path d="M32 14L46 21v12.5c0 9-6 15.8-14 19.5-8-3.7-14-10.5-14-19.5V21L32 14z" fill="#C62828" />
      <path
        d="M32 20c-5.5 0-9.5 3.2-9.5 8.2 0 3.4 2 5.6 5.2 7.4L32 52l4.3-16.4c3.2-1.8 5.2-4 5.2-7.4C41.5 23.2 37.5 20 32 20z"
        fill="#fff"
        opacity="0.95"
      />
      <circle cx="32" cy="28" r="3.2" fill="#1B5E3B" />
    </svg>
  );
}

export default function AppLaunchSplash({ user, dark = true, exiting = false }) {
  const name = user?.fullName || user?.name || "User";
  const roleLabel = ROLE_LABELS[user?.role] || "School Portal";

  return (
    <div
      className={`fixed inset-0 z-[120] flex items-center justify-center overflow-hidden px-6 ${
        exiting ? "app-launch-splash-exit" : "app-launch-splash-enter"
      }`}
      style={{
        fontFamily: "'Manrope', 'Inter', 'Segoe UI', sans-serif",
        background: dark
          ? "linear-gradient(160deg, #07140f 0%, #0c1a14 45%, #0a1511 100%)"
          : "linear-gradient(160deg, #f4faf6 0%, #e8f4ec 48%, #dff0e6 100%)",
      }}
      aria-live="polite"
      aria-busy={!exiting}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute -left-24 -top-20 h-80 w-80 rounded-full blur-3xl"
          style={{ background: dark ? "rgba(46,139,87,0.22)" : "rgba(46,139,87,0.18)" }}
        />
        <div
          className="absolute -bottom-28 -right-24 h-[28rem] w-[28rem] rounded-full blur-3xl"
          style={{ background: dark ? "rgba(27,94,59,0.28)" : "rgba(27,94,59,0.12)" }}
        />
        <div
          className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: dark ? "rgba(16,185,129,0.12)" : "rgba(110,180,140,0.2)" }}
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: dark
              ? "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)"
              : "radial-gradient(rgba(27,94,59,0.10) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
      </div>

      <div
        className={`relative z-10 flex w-full max-w-lg flex-col items-center text-center ${
          exiting ? "" : "app-launch-splash-content"
        }`}
      >
        <div className={`mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${
          dark ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-[#1B5E3B]/15 bg-white/70 text-[#1B5E3B]"
        }`}>
          <SchoolCrestMark className="h-4 w-3.5" />
          Insaf Grammar High School
        </div>

        <div className="relative mt-2 flex h-52 w-52 items-center justify-center sm:h-64 sm:w-64">
          <div className={`app-launch-ring absolute inset-0 rounded-full border-2 ${
            dark ? "border-emerald-400/20" : "border-[#1B5E3B]/15"
          }`} />
          <div className="app-launch-ring-spin absolute inset-0 rounded-full border-2 border-transparent border-t-[#2E8B57] border-r-[#2E8B57]/40" />
          <div className="relative flex h-[86%] w-[86%] items-center justify-center">
            <img
              src="/Logo%20Insaf%20Grammar%20High%20School.png"
              alt="Insaf Grammar High School logo"
              className="app-launch-logo h-full w-full object-contain drop-shadow-[0_18px_40px_rgba(15,40,25,0.18)]"
              onError={(event) => {
                event.currentTarget.style.display = "none";
                event.currentTarget.nextElementSibling?.classList.remove("hidden");
              }}
            />
            <div className="hidden">
              <SchoolCrestMark className="h-24 w-20" />
            </div>
          </div>
        </div>

        <p className={`mt-8 text-[11px] font-semibold uppercase tracking-[0.22em] ${
          dark ? "text-emerald-300/80" : "text-[#2E8B57]"
        }`}>
          {roleLabel}
        </p>

        <h2 className={`mt-3 text-4xl font-bold tracking-tight sm:text-5xl ${dark ? "text-white" : "text-[#0f2a1c]"}`}>
          Welcome back
        </h2>
        <p className={`mt-3 max-w-md text-base font-medium sm:text-lg ${dark ? "text-slate-300" : "text-slate-600"}`}>
          {name}
        </p>

        <div className="mt-9 w-full max-w-xs">
          <div className={`h-1.5 overflow-hidden rounded-full ${dark ? "bg-white/10" : "bg-[#1B5E3B]/10"}`}>
            <div className="app-launch-progress h-full rounded-full bg-gradient-to-r from-[#1B5E3B] via-[#2E8B57] to-[#4caf50]" />
          </div>
          {!exiting ? (
            <p className={`mt-4 text-xs font-semibold uppercase tracking-[0.2em] ${
              dark ? "text-emerald-300/70" : "text-[#1B5E3B]/70"
            }`}>
              Preparing your dashboard
            </p>
          ) : (
            <p className={`mt-4 text-xs font-semibold uppercase tracking-[0.2em] ${
              dark ? "text-emerald-300/70" : "text-[#1B5E3B]/70"
            }`}>
              Almost ready
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
