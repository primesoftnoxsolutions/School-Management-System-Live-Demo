import { useEffect } from "react";

import { createPortal } from "react-dom";

import { MODAL_ANIM_MS, useAnimatedPresence } from "../../hooks/useAnimatedPresence";



function IconUserMinus({ className = "h-5 w-5" }) {

  return (

    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">

      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 11h-6" />

    </svg>

  );

}



export default function ConfirmDialog({

  open,

  title,

  message,

  confirmLabel = "Confirm",

  cancelLabel = "Cancel",

  onConfirm,

  onCancel,

  dark = false,

  danger = false,

  loading = false,

  icon,

  content,

}) {

  const { render, exiting } = useAnimatedPresence(open, MODAL_ANIM_MS);



  useEffect(() => {

    if (!render) return undefined;



    const onKeyDown = (event) => {

      if (event.key === "Escape" && !loading && !exiting) onCancel?.();

    };



    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);

  }, [render, onCancel, loading, exiting]);



  if (!render) return null;



  const iconNode = icon ?? <IconUserMinus />;

  const confirmBtnClass = danger

    ? dark

      ? "bg-[#e91e63] hover:bg-[#d81b60] text-white"

      : "bg-rose-600 hover:bg-rose-700 text-white"

    : dark

      ? "bg-[#7c4dff] hover:bg-[#6a3df0] text-white"

      : "bg-slate-900 hover:bg-slate-800 text-white";



  const backdropClass = exiting ? "modal-backdrop-exit" : "modal-backdrop-enter";

  const panelClass = exiting ? "modal-panel-exit" : "modal-panel-enter";

  const bodyClass = exiting ? "modal-body-exit" : "modal-body-enter";



  return createPortal(

    <div

      className={`${backdropClass} fixed inset-0 z-[120] flex items-center justify-center px-4 ${

        dark ? "bg-[#0b0c15]/80 backdrop-blur-sm" : "bg-slate-900/40 backdrop-blur-[2px]"

      }`}

      onMouseDown={(event) => {

        if (event.target === event.currentTarget && !loading && !exiting) onCancel?.();

      }}

      role="presentation"

    >

      <div

        className={`${panelClass} w-full max-w-md overflow-hidden rounded-2xl border shadow-[0_24px_60px_rgba(0,0,0,0.25)] ${

          dark

            ? "border-white/[0.06] bg-[#161722] shadow-[0_24px_64px_rgba(0,0,0,0.45)]"

            : "border-slate-200/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]"

        }`}

        onMouseDown={(event) => event.stopPropagation()}

        role="alertdialog"

        aria-modal="true"

        aria-labelledby="confirm-dialog-title"

        aria-describedby="confirm-dialog-message"

      >

        <div className={`border-b px-6 py-5 ${dark ? "border-white/[0.06] bg-[#1a1b26]/60" : "border-slate-100 bg-gradient-to-r from-slate-50 to-white"}`}>

          <div className="flex items-start gap-4">

            <div

              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${

                danger

                  ? dark

                    ? "bg-[#e91e63]/15 text-[#e91e63] ring-[#e91e63]/25"

                    : "bg-rose-50 text-rose-600 ring-rose-100"

                  : dark

                    ? "bg-[#7c4dff]/15 text-[#7c4dff] ring-[#7c4dff]/25"

                    : "bg-indigo-50 text-indigo-600 ring-indigo-100"

              }`}

            >

              {iconNode}

            </div>

            <div>

              <h3 id="confirm-dialog-title" className={`text-lg font-semibold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>

                {title}

              </h3>

              <p id="confirm-dialog-message" className={`mt-1.5 text-sm leading-relaxed ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>

                {message}

              </p>

            </div>

          </div>

        </div>

        {content ? <div className={`${bodyClass} border-t px-6 py-5 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>{content}</div> : null}

        <div className={`${bodyClass} flex flex-col-reverse gap-3 px-6 py-5 sm:flex-row sm:justify-end`}>

          <button

            type="button"

            disabled={loading || exiting}

            className={`rounded-xl border px-5 py-2.5 text-sm font-medium transition disabled:opacity-50 ${

              dark

                ? "border-white/[0.06] bg-[#1a1b26] text-white hover:bg-white/[0.04]"

                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"

            }`}

            onClick={onCancel}

          >

            {cancelLabel}

          </button>

          <button

            type="button"

            disabled={loading || exiting}

            className={`rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm transition disabled:opacity-50 ${confirmBtnClass}`}

            onClick={onConfirm}

          >

            {loading ? "Please wait..." : confirmLabel}

          </button>

        </div>

      </div>

    </div>,

    document.body

  );

}


