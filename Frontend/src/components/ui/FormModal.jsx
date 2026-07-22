import { useEffect } from "react";
import { createPortal } from "react-dom";
import ThemeToggleButton from "./ThemeToggleButton";
import { MODAL_ANIM_MS, useAnimatedPresence } from "../../hooks/useAnimatedPresence";

export default function FormModal({
  open,
  title,
  subtitle,
  onClose,
  children,
  wide = false,
  extraWide = false,
  dark = false,
  onToggleTheme,
  headerActions = null,
  error = "",
  scrollBody = true,
}) {
  const widthClass = extraWide ? "max-w-6xl xl:max-w-7xl" : wide ? "max-w-3xl" : "max-w-2xl";
  const { render, exiting } = useAnimatedPresence(open, MODAL_ANIM_MS);

  useEffect(() => {
    if (!render) return undefined;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [render]);

  if (!render) return null;

  const backdropClass = exiting ? "modal-backdrop-exit" : "modal-backdrop-enter";
  const panelClass = exiting ? "modal-panel-exit" : "modal-panel-enter";
  const bodyClass = exiting ? "modal-body-exit" : "modal-body-enter";

  return createPortal(
    <div
      className={`${backdropClass} fixed inset-0 z-[100] flex items-center justify-center px-4 ${
        dark ? "bg-[#0b0c15]/75 backdrop-blur-sm" : "bg-slate-900/45 backdrop-blur-[2px]"
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !exiting) onClose();
      }}
    >
      <div
        className={`${panelClass} relative z-[101] flex max-h-[90vh] w-full flex-col overflow-hidden ${widthClass} ${
          dark
            ? "rounded-2xl border border-white/[0.06] bg-[#161722] shadow-[0_24px_64px_rgba(0,0,0,0.45)]"
            : "rounded-2xl border border-slate-200 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          className={`flex shrink-0 items-center justify-between gap-3 border-b px-6 py-4 ${
            dark ? "border-white/[0.06]" : "border-slate-100"
          }`}
        >
          <h3 className={`min-w-0 flex-1 truncate text-lg font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
            {title}
            {subtitle ? (
              <span className={`font-medium ${dark ? "text-[#7c4dff]" : "text-indigo-600"}`}> — {subtitle}</span>
            ) : null}
          </h3>

          <div className="flex shrink-0 items-center gap-2">
            {headerActions ? <div className="flex items-center gap-2">{headerActions}</div> : null}

            <ThemeToggleButton dark={dark} onToggle={onToggleTheme} />

            <button
              type="button"
              onClick={onClose}
              disabled={exiting}
              className={`rounded-lg p-1.5 ${
                dark
                  ? "text-[#9e9e9e] hover:bg-white/[0.04] hover:text-white"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              }`}
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div
          className={`${bodyClass} min-h-0 p-6 ${
            scrollBody ? "scrollbar-app overflow-y-auto" : "flex flex-1 flex-col overflow-hidden"
          }`}
        >
          {error ? (
            <div
              className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                dark
                  ? "border-[#e91e63]/30 bg-[#e91e63]/10 text-[#e91e63]"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
              role="alert"
            >
              {error}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
