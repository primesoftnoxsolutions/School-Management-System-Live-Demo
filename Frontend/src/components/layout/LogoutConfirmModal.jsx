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
      className={`${backdropClass} fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-md`}
      onClick={exiting ? undefined : onCancel}
      role="presentation"
    >
      <div
        className={`${panelClass} w-full max-w-lg overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.32)]`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
      >
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_0%,#fff1f2_0,#ffffff_42%,#f8fafc_100%)] px-7 pb-6 pt-7">
          <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-rose-100/70" />
          <div className="absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-indigo-100/50" />
          <div className="relative flex items-start gap-5">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-white text-rose-600 shadow-[0_16px_34px_rgba(225,29,72,0.18)] ring-1 ring-rose-100">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-50">
                <IconLogout className="h-5 w-5" />
              </div>
            </div>
            <div className="min-w-0 pt-1">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-rose-500">Secure Session</p>
              <h3 id="logout-title" className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                Confirm Logout
              </h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                Are you sure you want to end this session? You can sign back in anytime.
              </p>
            </div>
          </div>
        </div>

        <div className={`${bodyClass} flex flex-col-reverse gap-3 border-t border-slate-100 bg-white px-7 py-5 sm:flex-row sm:justify-end`}>
          <button
            type="button"
            disabled={exiting}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-7 text-sm font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={exiting}
            className="h-12 rounded-2xl bg-slate-950 px-7 text-sm font-black text-white shadow-[0_14px_30px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-50"
            onClick={onConfirm}
          >
            Yes, Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
