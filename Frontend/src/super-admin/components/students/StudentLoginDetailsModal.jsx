import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MODAL_ANIM_MS, useAnimatedPresence } from "../../hooks/useAnimatedPresence";

const GREEN = "#00A651";
const FONT = "[font-family:Inter,Manrope,sans-serif]";

function generateStudentLoginPassword(student) {
  const lettersPool =
    `${student?.firstName || ""}${student?.lastName || ""}`.replace(/[^a-z]/gi, "").toUpperCase() || "STUDENT";
  const dobValue = student?.dateOfBirth ? new Date(student.dateOfBirth) : null;
  const dobDigits =
    dobValue && !Number.isNaN(dobValue.getTime())
      ? `${dobValue.getFullYear()}${String(dobValue.getMonth() + 1).padStart(2, "0")}${String(dobValue.getDate()).padStart(2, "0")}`
      : "";
  const digitsPool =
    `${student?.admissionNo || ""}${student?.rollNumber || ""}${student?.cnicBForm || ""}${dobDigits}`
      .replace(/\D/g, "") || `${Date.now()}`;
  const byPool = "BY";
  const glPool = "GL";
  const seed = `${lettersPool}|${digitsPool}|${student?.admissionNo || ""}|BY|GL`;

  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 33 + seed.charCodeAt(i)) >>> 0;
  }

  const pick = (pool, offset = 0) => pool[(hash + offset) % pool.length];
  return [
    pick(lettersPool, 0),
    pick(lettersPool, 3),
    pick(digitsPool, 1),
    pick(digitsPool, 5),
    pick(lettersPool, 7),
    pick(lettersPool, 11),
    pick(digitsPool, 13),
    pick(digitsPool, 17),
    pick(byPool, hash % byPool.length),
    pick(glPool, (hash + 1) % glPool.length),
  ]
    .join("")
    .slice(0, 10);
}

function generateStudentLoginId(student) {
  const fullName = `${student?.firstName || ""}${student?.lastName || ""}`.replace(/[^a-z]/gi, "").toLowerCase();
  if (!fullName) {
    const admission = String(student?.admissionNo || "")
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase();
    return admission ? `${admission}@school.local` : `student${Date.now()}@school.local`;
  }
  return `${fullName}@gmail.com`;
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="currentColor" aria-hidden="true">
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 1.5c-3.9 0-7 1.9-7 4.25V19h14v-1.25c0-2.35-3.1-4.25-7-4.25z" />
    </svg>
  );
}

function IconGradCap() {
  return (
    <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="currentColor" aria-hidden="true">
      <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
      <path d="M5 13.18V17c0 1.66 3.13 3 7 3s7-1.34 7-3v-3.82l-7 3.82-7-3.82z" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h6" />
      <rect x="6" y="4" width="12" height="16" rx="2" />
      <path strokeLinecap="round" d="M9 11h6M9 15h4" />
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

function InfoColumn({ icon, label, value, dark = false, showDivider = false, allowWrap = false, wide = false }) {
  return (
    <>
      {showDivider ? <div className={`hidden h-12 w-px shrink-0 sm:block ${dark ? "bg-white/[0.1]" : "bg-[#E5E7EB]"}`} /> : null}
      <div className={`flex min-w-0 items-start gap-3 px-1 py-1 ${wide ? "flex-[1.45]" : "flex-1"}`}>
        <div
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: GREEN }}
        >
          {icon}
        </div>
        <div className="min-w-0 text-left">
          <p className={`text-[12px] leading-none ${dark ? "text-[#9e9e9e]" : "text-[#6B7280]"}`}>{label}</p>
          <p
            className={`mt-[7px] text-[15px] font-bold leading-snug ${dark ? "text-white" : "text-[#111827]"} ${
              allowWrap ? "whitespace-normal break-words" : "truncate"
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    </>
  );
}

export default function StudentLoginDetailsModal({ open = false, student, loading = false, onClose, dark = false }) {
  const { render, exiting } = useAnimatedPresence(open, MODAL_ANIM_MS);
  const [cachedStudent, setCachedStudent] = useState(student);

  useEffect(() => {
    if (student) setCachedStudent(student);
  }, [student]);

  useEffect(() => {
    if (!open || exiting) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, exiting, onClose]);

  if (!render) return null;

  const studentName = cachedStudent
    ? `${cachedStudent.firstName || ""} ${cachedStudent.lastName || ""}`.trim() || "—"
    : "—";
  const classSection = cachedStudent
    ? `${cachedStudent.className || "—"} / ${cachedStudent.section || "—"}`
    : "—";
  const rollNumber = cachedStudent?.rollNumber || "—";
  const loginId = cachedStudent ? cachedStudent.loginId || generateStudentLoginId(cachedStudent) : "";
  const password = cachedStudent ? cachedStudent.loginPassword || generateStudentLoginPassword(cachedStudent) : "";
  const isActive = String(cachedStudent?.status || "ACTIVE").toUpperCase() !== "INACTIVE";
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
        className={`${panelClass} relative w-full max-w-[680px] overflow-hidden rounded-[22px] border shadow-[0_18px_50px_rgba(15,23,42,0.28)] ${FONT} ${
          dark ? "border-white/[0.08] bg-[#161722]" : "border-[#E5E7EB] bg-white"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-login-details-title"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={exiting}
          className={`absolute right-[18px] top-[18px] z-10 rounded-md p-1.5 transition disabled:opacity-50 ${
            dark ? "text-[#9e9e9e] hover:bg-white/[0.06] hover:text-white" : "text-[#111827] hover:bg-slate-100"
          }`}
          aria-label="Close student login details"
        >
          <IconClose />
        </button>

        <div className="px-[36px] pb-[34px] pt-[34px]">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-[16px]">
              <div
                className={`flex h-[104px] w-[104px] items-center justify-center rounded-full ${
                  dark ? "bg-emerald-500/15 text-[#9e9e9e]" : "bg-[#E8F5EE] text-[#4B5563]"
                }`}
              >
                <svg viewBox="0 0 64 64" className="h-[58px] w-[58px]" fill="currentColor" aria-hidden="true">
                  <circle cx="32" cy="22" r="12" />
                  <path d="M10 54c2.5-12 11-18 22-18s19.5 6 22 18" />
                  <rect x="20" y="8" width="24" height="8" rx="2" opacity="0.35" />
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
              id="student-login-details-title"
              className={`text-[24px] font-bold leading-tight tracking-[-0.01em] ${dark ? "text-white" : "text-[#111827]"}`}
            >
              Student Login Details
            </h3>

            <div className="mt-[14px] flex w-[200px] items-center gap-[7px]">
              <span className="h-[2.5px] flex-1 rounded-full" style={{ backgroundColor: GREEN }} />
              <span className="h-[9px] w-[9px] shrink-0 rounded-full" style={{ backgroundColor: GREEN }} />
              <span className="h-[2.5px] flex-1 rounded-full" style={{ backgroundColor: GREEN }} />
            </div>
          </div>

          {loading && !cachedStudent ? (
            <div className={`mt-[26px] rounded-[14px] border px-4 py-8 text-center text-sm ${dark ? "border-white/[0.08] text-[#9e9e9e]" : "border-[#E5E7EB] text-[#6B7280]"}`}>
              Loading login details...
            </div>
          ) : (
            <>
              <div
                className={`mt-[26px] flex flex-col gap-4 rounded-[14px] border px-[16px] py-[14px] sm:flex-row sm:items-center sm:gap-0 ${
                  dark ? "border-white/[0.08] bg-[#1a1b26]" : "border-[#E5E7EB] bg-[#FAFAFA]"
                }`}
              >
                <InfoColumn icon={<IconUser />} label="Student Name" value={studentName} dark={dark} allowWrap wide />
                <InfoColumn icon={<IconGradCap />} label="Class / Section" value={classSection} dark={dark} showDivider />
                <InfoColumn icon={<IconClipboard />} label="Roll Number" value={String(rollNumber)} dark={dark} showDivider />
              </div>

              <div className={`my-[22px] border-t border-dashed ${dark ? "border-white/[0.12]" : "border-[#D1D5DB]"}`} />

              <div className="space-y-[18px]">
                <CopyField label="Email ID" value={loginId} icon={<IconMail />} dark={dark} />
                <CopyField label="Password" value={password || null} icon={<IconLock />} dark={dark} />
              </div>
            </>
          )}

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
