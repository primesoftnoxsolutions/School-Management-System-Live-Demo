import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MODAL_ANIM_MS, useAnimatedPresence } from "../../hooks/useAnimatedPresence";

const GREEN = "#00A651";
const FONT = "[font-family:Inter,Manrope,sans-serif]";

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconUserSmall() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 1.5c-3.9 0-7 1.9-7 4.25V19h14v-1.25c0-2.35-3.1-4.25-7-4.25z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8l8 6 8-6" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2" />
      <path strokeLinecap="round" d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="9" y="9" width="10" height="10" rx="1.8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 15V6.8A1.8 1.8 0 017.8 5H15" />
    </svg>
  );
}

function IconCheckTiny() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12.5l2.5 2.5L16.5 9" />
    </svg>
  );
}

function CopyField({ label, value, icon, dark = false }) {
  const [copied, setCopied] = useState(false);
  const displayValue = value || "—";

  const onCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className={FONT}>
      <p className={`mb-[10px] text-[17px] font-bold leading-none ${dark ? "text-white" : "text-[#111827]"}`}>{label}:</p>
      <div
        className={`flex h-[58px] overflow-hidden rounded-[12px] border ${
          dark ? "border-white/[0.1] bg-[#1a1b26]" : "border-[#D8D8D8] bg-[#F3F3F3]"
        }`}
      >
        <div
          className={`flex w-[56px] shrink-0 items-center justify-center border-r ${
            dark ? "border-white/[0.1] bg-[#12131c] text-[#9e9e9e]" : "border-[#D8D8D8] bg-[#E8E8E8] text-[#6B7280]"
          }`}
        >
          {icon}
        </div>
        <div className={`flex min-w-0 flex-1 items-center px-[16px] ${dark ? "bg-[#161722]" : "bg-white"}`}>
          <p className={`truncate text-[20px] font-medium leading-none ${dark ? "text-white" : "text-[#111827]"}`}>{displayValue}</p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          disabled={!value}
          className={`flex w-[70px] shrink-0 flex-col items-center justify-center gap-[3px] border-l transition disabled:cursor-not-allowed disabled:opacity-40 ${
            dark
              ? "border-white/[0.1] bg-[#1a1b26] text-[#9e9e9e] hover:bg-white/[0.05] hover:text-white"
              : "border-[#D8D8D8] bg-[#F3F3F3] text-[#6B7280] hover:bg-[#EBEBEB] hover:text-[#374151]"
          }`}
          title={copied ? "Copied" : `Copy ${label}`}
        >
          {copied ? <IconCheckTiny /> : <IconCopy />}
          <span className="text-[12px] font-semibold leading-none tracking-wide">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
    </div>
  );
}

export default function TeacherLoginDetailsModal({ open = true, teacher, onClose, dark = false }) {
  const { render, exiting } = useAnimatedPresence(open, MODAL_ANIM_MS);
  const [cachedTeacher, setCachedTeacher] = useState(teacher);

  useEffect(() => {
    if (teacher) setCachedTeacher(teacher);
  }, [teacher]);

  useEffect(() => {
    if (!open || exiting) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, exiting, onClose]);

  if (!render || !cachedTeacher) return null;

  const teacherName = String(cachedTeacher.fullName || "").trim() || "—";
  const email = String(cachedTeacher.email || "").trim();
  const password = String(cachedTeacher.profile?.loginPassword || cachedTeacher.loginPassword || "").trim();
  const isActive = cachedTeacher.isActive !== false;
  const backdropClass = exiting ? "modal-backdrop-exit" : "modal-backdrop-enter";
  const panelClass = exiting ? "modal-panel-exit" : "modal-panel-enter";

  return createPortal(
    <div
      className={`${backdropClass} fixed inset-0 z-[560] flex items-center justify-center px-4 py-6 ${
        dark ? "bg-slate-950/70" : "bg-[#0f172a]/45"
      }`}
      onMouseDown={(event) => {
        if (!exiting && event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        className={`${panelClass} relative w-full max-w-[560px] overflow-hidden rounded-[22px] border shadow-[0_18px_50px_rgba(15,23,42,0.28)] ${FONT} ${
          dark ? "border-white/[0.08] bg-[#161722]" : "border-[#E5E7EB] bg-white"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-login-details-title"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={exiting}
          className={`absolute right-[18px] top-[18px] z-10 rounded-md p-1.5 transition disabled:opacity-50 ${
            dark ? "text-[#9e9e9e] hover:bg-white/[0.06] hover:text-white" : "text-[#111827] hover:bg-slate-100"
          }`}
          aria-label="Close teacher login details"
        >
          <IconClose />
        </button>

        <div className="px-[36px] pb-[34px] pt-[34px]">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-[16px]">
              <div
                className={`flex h-[104px] w-[104px] items-center justify-center rounded-full ${
                  dark ? "bg-white/[0.08] text-[#9e9e9e]" : "bg-[#D1D5DB] text-[#9CA3AF]"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-[58px] w-[58px]" fill="currentColor" aria-hidden="true">
                  <path d="M12 12a4.25 4.25 0 100-8.5 4.25 4.25 0 000 8.5zm0 1.75c-4.2 0-7.5 2.05-7.5 4.75V20h15v-1.5c0-2.7-3.3-4.75-7.5-4.75z" />
                </svg>
              </div>
              {isActive ? (
                <span
                  className={`absolute bottom-[2px] right-[2px] flex h-[24px] w-[24px] items-center justify-center rounded-full border-[2.5px] text-white ${
                    dark ? "border-[#161722]" : "border-white"
                  }`}
                  style={{ backgroundColor: GREEN }}
                >
                  <IconCheckTiny />
                </span>
              ) : null}
            </div>

            <h3
              id="teacher-login-details-title"
              className={`text-[24px] font-bold leading-tight tracking-[-0.01em] ${dark ? "text-white" : "text-[#111827]"}`}
            >
              Teacher Login Details
            </h3>

            <div className="mt-[14px] flex w-[200px] items-center gap-[7px]">
              <span className="h-[2.5px] flex-1 rounded-full" style={{ backgroundColor: GREEN }} />
              <span className="h-[9px] w-[9px] shrink-0 rounded-full" style={{ backgroundColor: GREEN }} />
              <span className="h-[2.5px] flex-1 rounded-full" style={{ backgroundColor: GREEN }} />
            </div>
          </div>

          <div
            className={`mt-[26px] flex items-center gap-[16px] rounded-[14px] border px-[18px] py-[16px] ${
              dark ? "border-white/[0.08] bg-[#1a1b26]" : "border-[#E5E7EB] bg-[#FAFAFA]"
            }`}
          >
            <div
              className={`flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full ${
                dark ? "bg-white/[0.06] text-[#9e9e9e]" : "bg-[#E5E7EB] text-[#6B7280]"
              }`}
            >
              <IconUserSmall />
            </div>

            <div className="min-w-0 flex-1 text-left">
              <p className={`text-[13px] leading-none ${dark ? "text-[#9e9e9e]" : "text-[#6B7280]"}`}>Teacher name:</p>
              <p className={`mt-[7px] truncate text-[17px] font-bold leading-none ${dark ? "text-white" : "text-[#111827]"}`}>
                {teacherName}
              </p>
            </div>

            <div className={`h-[40px] w-px shrink-0 ${dark ? "bg-white/[0.1]" : "bg-[#D1D5DB]"}`} />

            <div className="min-w-[140px] shrink-0 text-left">
              <p className={`text-[13px] leading-none ${dark ? "text-[#9e9e9e]" : "text-[#6B7280]"}`}>Status:</p>
              <span
                className={`mt-[7px] inline-flex items-center gap-[7px] rounded-full px-[12px] py-[6px] text-[13px] font-semibold leading-none ${
                  isActive
                    ? dark
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-[#E8F8EF] text-[#008744]"
                    : dark
                      ? "bg-white/[0.06] text-[#9e9e9e]"
                      : "bg-[#F3F4F6] text-[#6B7280]"
                }`}
              >
                <span className={`h-[8px] w-[8px] rounded-full ${isActive ? "bg-[#00A651]" : "bg-[#9CA3AF]"}`} />
                {isActive ? "Active Account" : "Inactive Account"}
              </span>
            </div>
          </div>

          <div className={`my-[22px] border-t border-dashed ${dark ? "border-white/[0.12]" : "border-[#D1D5DB]"}`} />

          <div className="space-y-[18px]">
            <CopyField label="Email ID" value={email} icon={<IconMail />} dark={dark} />
            <CopyField label="Password" value={password || null} icon={<IconLock />} dark={dark} />
            {!password ? (
              <p className={`text-[13px] leading-snug ${dark ? "text-[#9e9e9e]" : "text-[#6B7280]"}`}>
                Password was not recorded for this teacher account.
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={exiting}
            className="mt-[26px] flex h-[54px] w-full items-center justify-center gap-[10px] rounded-[12px] text-[17px] font-bold text-white transition hover:brightness-[0.96] active:brightness-[0.93] disabled:opacity-50"
            style={{ backgroundColor: GREEN }}
          >
            <IconCheckCircle />
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
