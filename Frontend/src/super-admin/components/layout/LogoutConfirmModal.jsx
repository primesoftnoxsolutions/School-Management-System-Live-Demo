import { IconLogout } from "../icons/NavIcons";
import { MODAL_ANIM_MS, useAnimatedPresence } from "../../hooks/useAnimatedPresence";

export default function LogoutConfirmModal({ open, onCancel, onConfirm }) {
  const { render, exiting } = useAnimatedPresence(open, MODAL_ANIM_MS);

  if (!render) return null;

  const backdropClass = exiting ? "modal-backdrop-exit" : "modal-backdrop-enter";
  const panelClass = exiting ? "modal-panel-exit" : "modal-panel-enter";
  const bodyClass = exiting ? "modal-body-exit" : "modal-body-enter";

  return (
    <div
      className={`${backdropClass} fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-[2px]`}
      onClick={exiting ? undefined : onCancel}
      role="presentation"
    >
      <div
        className={`${panelClass} w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
      >
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
              <IconLogout className="h-5 w-5" />
            </div>
            <div>
              <h3 id="logout-title" className="text-lg font-semibold tracking-tight text-slate-900">
                Confirm Logout
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                Are you sure you want to log out of your account?
              </p>
            </div>
          </div>
        </div>

        <div className={`${bodyClass} flex flex-col-reverse gap-3 px-6 py-5 sm:flex-row sm:justify-end`}>
          <button
            type="button"
            disabled={exiting}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={exiting}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
            onClick={onConfirm}
          >
            Yes, Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
