import { useLayoutEffect, useRef, useState } from "react";

export function SchoolCrest({ className = "h-12 w-12" }) {
  return (
    <svg className={className} viewBox="0 0 64 72" fill="none" aria-hidden>
      <path
        d="M32 2L58 14v22c0 16.5-11.2 28.8-26 34-14.8-5.2-26-17.5-26-34V14L32 2z"
        fill="#1B5E3B"
      />
      <path
        d="M32 8L52 17.5v17c0 12.8-8.6 22.5-20 27-11.4-4.5-20-14.2-20-27v-17L32 8z"
        fill="#F5C518"
      />
      <path
        d="M32 14L46 21v12.5c0 9-6 15.8-14 19.5-8-3.7-14-10.5-14-19.5V21L32 14z"
        fill="#C62828"
      />
      <path
        d="M32 20c-5.5 0-9.5 3.2-9.5 8.2 0 3.4 2 5.6 5.2 7.4L32 52l4.3-16.4c3.2-1.8 5.2-4 5.2-7.4C41.5 23.2 37.5 20 32 20z"
        fill="#fff"
        opacity="0.95"
      />
      <circle cx="32" cy="28" r="3.2" fill="#1B5E3B" />
    </svg>
  );
}

export function SidebarWave({ dark }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 overflow-hidden" aria-hidden>
      <svg className="absolute bottom-0 left-0 h-full w-full" viewBox="0 0 288 112" preserveAspectRatio="none">
        <path
          d="M0 48c28 18 52 8 80 18s48 28 80 22 48-26 80-18 32 20 48 14v28H0V48z"
          fill={dark ? "#14532d" : "#1B5E3B"}
        />
        <path
          d="M0 64c32 14 56 4 88 14s52 24 84 18 44-22 72-14 28 16 44 10v20H0V64z"
          fill={dark ? "#166534" : "#247A4B"}
          opacity="0.9"
        />
        <path
          d="M0 82c36 10 60 0 92 8s48 18 76 12 40-16 68-8 36 14 52 8v18H0V82z"
          fill={dark ? "#15803d" : "#2E8B57"}
          opacity="0.85"
        />
      </svg>
      <svg className="absolute bottom-3 left-3 h-16 w-16 opacity-40" viewBox="0 0 64 64" fill="none">
        <path
          d="M12 52c8-22 28-36 44-40-2 18-14 36-36 44-2-2-6-2-8-4z"
          stroke="#fff"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M20 48c10-12 22-20 34-24" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M24 40c6-4 12-6 18-8M28 34c4-3 8-5 12-6" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function IconChevronRight({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function useSchoolSidebarStyles(dark = true) {
  const itemBase =
    "group flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-[15.5px] font-medium outline-none transition-colors duration-150 focus:outline-none";

  const itemActive = dark
    ? "bg-emerald-700/40 text-emerald-100"
    : "bg-[#1B5E3B] text-white";

  const itemIdle = dark
    ? "text-slate-300 hover:bg-white/[0.04] hover:text-white"
    : "text-[#4a5568] hover:bg-[#f3f6f4] hover:text-[#1a2e22]";

  const iconActive = dark ? "text-emerald-200" : "text-white";
  const iconIdle = dark ? "text-slate-400" : "text-[#8b95a5]";
  const chevronClass = dark ? "text-slate-500" : "text-[#b0b8c4]";
  const chevronActiveClass = dark ? "text-emerald-200" : "text-white/80";

  return {
    dark,
    itemBase,
    itemActive,
    itemIdle,
    iconActive,
    iconIdle,
    chevronClass,
    chevronActiveClass,
    asideClass: dark
      ? "border-r border-white/[0.06] text-white"
      : "border-r border-[#d7e5db] text-[#1a2e22] shadow-[8px_0_28px_rgba(15,40,25,0.06)]",
    brandBorder: dark ? "border-white/[0.06]" : "border-[#cfe3d5]/80",
    brandEyebrow: dark ? "text-slate-400" : "text-[#6b7280]",
    brandTitle: dark ? "text-emerald-400" : "text-[#1B5E3B]",
    brandSub: dark ? "text-slate-500" : "text-[#9ca3af]",
    logoutClass: dark
      ? "border-rose-500/25 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15"
      : "border-[#f0d4d4] bg-white text-[#4a5568] hover:border-[#e8b4b4] hover:bg-[#fff8f8]",
    logoutIcon: dark ? "text-rose-400" : "text-[#e53935]",
  };
}

function SidebarAtmosphere({ dark }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute -left-16 top-[-10%] h-72 w-72 rounded-full blur-3xl"
        style={{ background: dark ? "rgba(46,139,87,0.18)" : "rgba(46,139,87,0.16)" }}
      />
      <div
        className="absolute -right-20 top-[28%] h-64 w-64 rounded-full blur-3xl"
        style={{ background: dark ? "rgba(27,94,59,0.22)" : "rgba(27,94,59,0.10)" }}
      />
      <div
        className="absolute bottom-[18%] left-[-20%] h-56 w-56 rounded-full blur-3xl"
        style={{ background: dark ? "rgba(16,185,129,0.10)" : "rgba(110,180,140,0.18)" }}
      />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: dark
            ? "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)"
            : "radial-gradient(rgba(27,94,59,0.10) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-40"
        style={{
          background: dark
            ? "linear-gradient(180deg, rgba(255,255,255,0.04), transparent)"
            : "linear-gradient(180deg, rgba(255,255,255,0.55), transparent)",
        }}
      />
    </div>
  );
}

export function SchoolNavItem({
  active,
  onClick,
  icon: Icon,
  label,
  compact = false,
  itemBase,
  itemActive,
  itemIdle,
  iconActive,
  iconIdle,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${itemBase} ${compact ? "py-2.5 text-[15px]" : ""} ${active ? itemActive : itemIdle}`}
    >
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center ${active ? iconActive : iconIdle}`}>
        {Icon ? <Icon className={compact ? "h-[18px] w-[18px]" : "h-5 w-5"} /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
}

export function ExpandableNav({
  active,
  label,
  icon: Icon,
  menuOpen,
  onNavigate,
  onToggle,
  ariaExpand,
  ariaCollapse,
  itemBase,
  itemActive,
  itemIdle,
  iconActive,
  iconIdle,
  chevronClass,
  chevronActiveClass,
  dark = false,
  children,
}) {
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const measure = () => setContentHeight(el.scrollHeight);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children, menuOpen]);

  const rowHover = dark
    ? "hover:bg-white/[0.04] hover:text-white"
    : "hover:bg-[#f3f6f4] hover:text-[#1a2e22]";
  const rowIdle = dark ? "text-slate-300" : "text-[#4a5568]";

  return (
    <div className="w-full min-w-0">
      <div
        className={`group/exp flex w-full min-w-0 items-stretch overflow-hidden rounded-2xl transition-colors duration-150 ${
          active ? itemActive : `${rowIdle} ${rowHover}`
        }`}
      >
        <button
          type="button"
          onClick={onNavigate}
          className={`${itemBase} flex-1 rounded-none bg-transparent hover:bg-transparent`}
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${
              active
                ? iconActive
                : dark
                  ? `${iconIdle} group-hover/exp:text-white`
                  : `${iconIdle} group-hover/exp:text-[#1a2e22]`
            }`}
          >
            {Icon ? <Icon className="h-5 w-5" /> : null}
          </span>
          <span className="min-w-0 flex-1 truncate text-left">{label}</span>
        </button>

        <button
          type="button"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? ariaCollapse : ariaExpand}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggle();
          }}
          className="flex w-11 shrink-0 items-center justify-center rounded-none bg-transparent outline-none transition-colors hover:bg-transparent focus:outline-none"
        >
          <IconChevronRight
            className={`h-4 w-4 transition-all duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              active
                ? chevronActiveClass
                : dark
                  ? `${chevronClass} group-hover/exp:text-white`
                  : `${chevronClass} group-hover/exp:text-[#1a2e22]`
            } ${menuOpen ? "rotate-90" : "rotate-0"}`}
          />
        </button>
      </div>

      <div
        className="overflow-hidden transition-[max-height,opacity] duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          maxHeight: menuOpen ? contentHeight : 0,
          opacity: menuOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="min-w-0 space-y-0.5 pb-0.5 pt-1.5">
          {children}
        </div>
      </div>
    </div>
  );
}

export function SchoolSidebarShell({
  dark,
  entering,
  brandTitle = "High School",
  brandSubtitle = "Management System",
  brandEyebrow = "Insaf Grammar",
  brandAvatar = null,
  children,
  logoutButton,
}) {
  const styles = useSchoolSidebarStyles(dark);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 hidden w-72 flex-col overflow-hidden lg:flex ${styles.asideClass} ${
        entering ? "app-sidebar-enter" : ""
      }`}
      style={{
        fontFamily: "'Manrope', 'Inter', 'Segoe UI', sans-serif",
        background: dark
          ? "linear-gradient(180deg, #0a1610 0%, #0c1a14 42%, #0b1512 100%)"
          : "linear-gradient(180deg, #f3faf5 0%, #eaf5ee 38%, #e4f0e8 72%, #dff0e6 100%)",
      }}
    >
      <SidebarAtmosphere dark={dark} />

      <div className={`relative z-10 shrink-0 border-b px-5 pb-5 pt-6 ${styles.brandBorder}`}>
        <div className="flex items-center gap-3.5">
          {brandAvatar || <SchoolCrest className="h-[52px] w-[46px] shrink-0" />}
          <div className="min-w-0">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${styles.brandEyebrow}`}>
              {brandEyebrow}
            </p>
            <h2 className={`mt-0.5 text-[18px] font-bold uppercase leading-none tracking-wide ${styles.brandTitle}`}>
              {brandTitle}
            </h2>
            <p className={`mt-1.5 truncate text-[12px] ${styles.brandSub}`}>{brandSubtitle}</p>
          </div>
        </div>
      </div>

      <nav
        className="scrollbar-sidebar relative z-10 flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 pb-4 pt-4"
        style={{ scrollbarGutter: "stable" }}
      >
        {children}
      </nav>

      <div className="relative z-10 mt-auto shrink-0">
        <div className="relative z-20 px-4 pb-2 pt-2">{logoutButton}</div>
        <div className="relative h-24">
          <SidebarWave dark={dark} />
        </div>
      </div>
    </aside>
  );
}
