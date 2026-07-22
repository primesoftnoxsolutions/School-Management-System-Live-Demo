import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import api from "../../services/api/client";
import {
  cacheAdminSignature,
  fetchAdminSignature,
  persistAdminSignature,
  readCachedAdminSignature,
} from "../../../utils/adminSignature";

import { FeeBellButton } from "./FeeNotificationPopup";
import ScrollableSelect from "../ui/ScrollableSelect";

const branchOptions = [
  { value: "Boys", label: "Boys" },
  { value: "Girls", label: "Girls" },
];

function IconPen({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="m4 20 4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="m13.5 6.5 3 3M4 20h16"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconImport({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 19h14" />
    </svg>
  );
}

function isTransparentSignatureFile(file) {
  if (!file) return false;
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  // Only formats that support real transparency (JPEG has no alpha channel)
  if (type === "image/png" || type === "image/webp") return true;
  if (!type && (name.endsWith(".png") || name.endsWith(".webp"))) return true;
  return false;
}

function drawSignatureImageToCanvas(context, image, width, height) {
  if (!context || !image) return;
  context.clearRect(0, 0, width, height);
  const imageWidth = image.naturalWidth || image.width || 1;
  const imageHeight = image.naturalHeight || image.height || 1;
  const scale = Math.min(width / imageWidth, height / imageHeight, 1);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function AdminSignatureModal({ open, dark, signature, onClose, onSave, onClear }) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const fileInputRef = useRef(null);
  const rectRef = useRef({ left: 0, top: 0, width: 0, height: 0 });
  const drawingRef = useRef(false);
  const pointsRef = useRef([]);
  const hasInkRef = useRef(Boolean(signature));
  const [importError, setImportError] = useState("");

  useEffect(() => {
    hasInkRef.current = Boolean(signature);
  }, [signature, open]);

  useEffect(() => {
    if (!open) {
      setImportError("");
      return undefined;
    }

    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return undefined;
    contextRef.current = context;

    const paint = () => {
      const rect = canvas.getBoundingClientRect();
      rectRef.current = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * scale));
      canvas.height = Math.max(1, Math.floor(rect.height * scale));
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 2.5;
      context.strokeStyle = dark ? "#f8fafc" : "#102a6b";
      context.clearRect(0, 0, rect.width, rect.height);

      if (signature) {
        const image = new Image();
        image.onload = () => {
          drawSignatureImageToCanvas(context, image, rect.width, rect.height);
        };
        image.src = signature;
      }
    };

    paint();
    window.addEventListener("resize", paint);
    return () => {
      window.removeEventListener("resize", paint);
      contextRef.current = null;
    };
  }, [dark, open, signature]);

  if (!open) return null;

  const getPoint = (event) => {
    const rect = rectRef.current;
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const strokeSegment = (currentPoint) => {
    const context = contextRef.current;
    if (!context) return;
    const points = pointsRef.current;
    points.push(currentPoint);

    if (points.length < 3) {
      const startPoint = points[0];
      context.beginPath();
      context.moveTo(startPoint.x, startPoint.y);
      context.lineTo(currentPoint.x, currentPoint.y);
      context.stroke();
      return;
    }

    const previousPoint = points[points.length - 3];
    const lastPoint = points[points.length - 2];
    const startMidPoint = {
      x: (previousPoint.x + lastPoint.x) / 2,
      y: (previousPoint.y + lastPoint.y) / 2,
    };
    const endMidPoint = {
      x: (lastPoint.x + currentPoint.x) / 2,
      y: (lastPoint.y + currentPoint.y) / 2,
    };

    context.beginPath();
    context.moveTo(startMidPoint.x, startMidPoint.y);
    context.quadraticCurveTo(lastPoint.x, lastPoint.y, endMidPoint.x, endMidPoint.y);
    context.stroke();
  };

  const startDrawing = (event) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    rectRef.current = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    drawingRef.current = true;
    pointsRef.current = [getPoint(event)];
    if (!hasInkRef.current) {
      hasInkRef.current = true;
    }
    canvas.setPointerCapture?.(event.pointerId);
  };

  const draw = (event) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    strokeSegment(getPoint(event));
  };

  const stopDrawing = () => {
    drawingRef.current = false;
    pointsRef.current = [];
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    const rect = rectRef.current;
    context.clearRect(0, 0, rect.width || canvas.width, rect.height || canvas.height);
    hasInkRef.current = false;
    setImportError("");
    onClear();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    onSave(hasInkRef.current && canvas ? canvas.toDataURL("image/png") : "");
  };

  const importSignatureFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!isTransparentSignatureFile(file)) {
      setImportError("Only transparent signature images are allowed (PNG or WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) {
        setImportError("Failed to read signature image.");
        return;
      }

      const image = new Image();
      image.onload = () => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        if (!canvas || !context) return;
        const rect = canvas.getBoundingClientRect();
        rectRef.current = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
        drawSignatureImageToCanvas(context, image, rect.width, rect.height);
        hasInkRef.current = true;
        setImportError("");
      };
      image.onerror = () => setImportError("Failed to load signature image.");
      image.src = dataUrl;
    };
    reader.onerror = () => setImportError("Failed to read signature image.");
    reader.readAsDataURL(file);
  };

  return createPortal(
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-950/45 px-4" onClick={onClose}>
      <div
        className={`w-full max-w-xl rounded-2xl border p-4 shadow-2xl ${
          dark ? "border-white/10 bg-[#161722] text-white" : "border-blue-100 bg-white text-slate-900"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold">Admin Signature</h3>
            <p className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
              Draw or import a transparent signature image, then save.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/webp,.png,.webp"
              className="hidden"
              onChange={importSignatureFile}
            />
            <button
              type="button"
              onClick={() => {
                setImportError("");
                fileInputRef.current?.click();
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                dark
                  ? "bg-[#7c4dff]/15 text-[#7c4dff] hover:bg-[#7c4dff]/25"
                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              }`}
              aria-label="Import transparent signature image"
              title="Import transparent signature (PNG/WebP)"
            >
              <IconImport />
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${
                dark ? "bg-white/10 text-white hover:bg-white/15" : "bg-slate-100 text-blue-900 hover:bg-blue-50"
              }`}
              aria-label="Close signature modal"
            >
              X
            </button>
          </div>
        </div>

        {importError ? (
          <p className={`mt-3 text-xs font-medium ${dark ? "text-[#e91e63]" : "text-rose-600"}`} role="alert">
            {importError}
          </p>
        ) : null}

        <div className={`mt-4 rounded-2xl border p-3 ${dark ? "border-white/10 bg-[#0f1018]" : "border-blue-100 bg-blue-50/50"}`}>
          <canvas
            ref={canvasRef}
            className={`h-48 w-full touch-none rounded-xl border bg-white ${dark ? "border-white/10" : "border-blue-200"}`}
            style={{ touchAction: "none" }}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            onPointerLeave={stopDrawing}
          />
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={clearSignature}
            className={`rounded-xl border px-4 py-2 text-xs font-bold uppercase ${
              dark ? "border-white/10 text-slate-200 hover:bg-white/10" : "border-blue-200 text-blue-900 hover:bg-blue-50"
            }`}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={saveSignature}
            className="rounded-xl bg-blue-700 px-5 py-2 text-xs font-bold uppercase text-white shadow-lg shadow-blue-700/20 hover:bg-blue-800"
          >
            Save Signature
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ChevronDown({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DashboardBranchSelect({ value, onChange, dark = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onMouseDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  return (
    <div ref={rootRef} className="relative min-w-[188px]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-[56px] w-full items-center justify-between rounded-2xl border px-4 text-[15px] font-medium shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition hover:shadow-[0_14px_34px_rgba(15,23,42,0.06)] ${
          dark
            ? "border-white/[0.06] bg-[#1a1b26] text-white hover:border-white/[0.1]"
            : "border-[#e6ebf5] bg-white text-[#32405f] hover:border-[#d9e2f2]"
        }`}
      >
        <span>{value || "Boys"}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${dark ? "text-[#8d94ad]" : "text-[#7f8aa8]"} ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          className={`login-role-menu absolute right-0 top-[calc(100%+10px)] z-[160] w-full overflow-hidden rounded-2xl shadow-[0_24px_48px_rgba(15,23,42,0.12)] ${
            dark ? "border border-white/[0.06] bg-[#161722]" : "border border-[#e6ebf5] bg-white"
          }`}
        >
          {branchOptions.map((option, index) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-[14px] transition ${
                  active
                    ? dark
                      ? "bg-[#7c4dff]/15 text-white"
                      : "bg-[#f3f7ff] text-[#25407a]"
                    : dark
                      ? "text-[#d8dbeb] hover:bg-white/[0.04]"
                      : "text-[#32405f] hover:bg-[#f8fbff]"
                } ${index !== branchOptions.length - 1 ? (dark ? "border-b border-white/[0.06]" : "border-b border-[#eef2f7]") : ""}`}
              >
                <span>{option.label}</span>
                {active ? <span className={`text-[12px] font-semibold ${dark ? "text-[#cfc6ff]" : "text-[#4c63d2]"}`}>Selected</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function formatHeaderClock(date) {
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const dateLabel = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeLabel = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  return { dayName, dateLabel, timeLabel };
}

function DashboardDateTimeChip({ dark = false }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const { dayName, dateLabel, timeLabel } = useMemo(() => formatHeaderClock(now), [now]);

  return (
    <div
      className={`flex h-[56px] min-w-[240px] items-center gap-3 rounded-2xl border px-3.5 shadow-[0_12px_28px_rgba(37,99,235,0.12)] ${
        dark
          ? "border-[#38bdf8]/25 bg-[linear-gradient(135deg,rgba(14,165,233,0.18)_0%,rgba(99,102,241,0.22)_100%)]"
          : "border-[#93c5fd] bg-[linear-gradient(135deg,#eff6ff_0%,#e0e7ff_55%,#faf5ff_100%)]"
      }`}
      aria-live="polite"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-[0_12px_24px_rgba(37,99,235,0.35)] ${
          dark
            ? "bg-[linear-gradient(135deg,#38bdf8_0%,#6366f1_100%)]"
            : "bg-[linear-gradient(135deg,#2563eb_0%,#7c3aed_100%)]"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div className="min-w-0 text-left">
        <p
          className={`truncate text-[15px] font-extrabold leading-tight tracking-tight ${
            dark ? "text-[#7dd3fc]" : "text-[#1d4ed8]"
          }`}
        >
          {dayName}
        </p>
        <p
          className={`mt-0.5 truncate text-[12px] font-semibold leading-tight ${
            dark ? "text-[#c4b5fd]" : "text-[#6d28d9]"
          }`}
        >
          {dateLabel} · {timeLabel}
        </p>
      </div>
    </div>
  );
}

function SuperAdminHeader({ user, dark = false, onToggleTheme, branchSection = "Boys", onBranchChange }) {
  const [pendingFeeCount, setPendingFeeCount] = useState(0);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signature, setSignature] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get("/dashboard/super-admin");
        setPendingFeeCount(response.data?.data?.pendingFeeCount || 0);
      } catch {
        setPendingFeeCount(0);
      }
    };

    if (user?.role === "SUPER_ADMIN") {
      load();
    }
  }, [user?.role]);

  useEffect(() => {
    setSignature(readCachedAdminSignature(user));
    let active = true;
    fetchAdminSignature(user).then((value) => {
      if (active) setSignature(value || "");
    });
    return () => {
      active = false;
    };
  }, [user]);

  const saveSignature = async (nextSignature) => {
    try {
      const saved = await persistAdminSignature(user, nextSignature || "");
      setSignature(saved);
      setSignatureOpen(false);
    } catch {
      cacheAdminSignature(user, nextSignature || "");
      setSignature(nextSignature || "");
      setSignatureOpen(false);
    }
  };

  const clearSignature = async () => {
    try {
      await persistAdminSignature(user, "");
      setSignature("");
    } catch {
      cacheAdminSignature(user, "");
      setSignature("");
    }
  };

  return (
    <header className="super-admin-top-header relative z-[40] px-4 pt-5 lg:px-6">
      <div
        className={`mx-auto flex w-full max-w-[1600px] flex-col gap-3 rounded-[26px] border px-3 py-3 shadow-[0_20px_55px_rgba(15,23,42,0.06)] backdrop-blur-md md:flex-row md:items-center md:gap-4 md:px-4 ${
          dark ? "border-white/[0.12] bg-[#151623]/96" : "border-[#e6ebf5] bg-white/96"
        }`}
      >
        <div className="relative min-w-0 flex-1">
          <span className={`pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 ${dark ? "text-[#8d94ad]" : "text-[#6a7899]"}`}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="6" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
          </span>

          <input
            type="search"
            placeholder="Search students, teachers, classes..."
            className={`h-[56px] w-full rounded-2xl border px-[52px] text-[15px] font-normal outline-none transition placeholder:text-[#8b97b1] focus:shadow-[0_0_0_4px_rgba(78,117,255,0.08)] ${
              dark
                ? "border-white/[0.06] bg-[#1a1b26] text-white placeholder:text-[#8d94ad] focus:border-[#7c4dff]/40 focus:bg-[#1a1b26]"
                : "border-[#e6ebf5] bg-[#fbfcff] text-[#32405f] focus:border-[#c7d5f7] focus:bg-white"
            }`}
          />
        </div>

        {onToggleTheme ? (
          <button
            type="button"
            onClick={onToggleTheme}
            className={`flex h-[56px] w-[56px] items-center justify-center rounded-2xl border transition ${
              dark
                ? "border-white/[0.06] bg-[#161722] text-[#7c4dff] hover:bg-white/[0.04]"
                : "border-[#e6ebf5] bg-white text-[#607089] hover:border-[#d9e2f2] hover:shadow-[0_14px_34px_rgba(15,23,42,0.06)]"
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

        <button
          type="button"
          onClick={() => setSignatureOpen(true)}
          className={`relative flex h-[56px] items-center justify-center gap-2 rounded-2xl border px-4 text-[15px] font-bold transition ${
            dark
              ? "border-white/[0.06] bg-[#161722] text-[#7c4dff] hover:bg-white/[0.04]"
              : "border-[#e6ebf5] bg-white text-blue-700 shadow-[0_10px_28px_rgba(15,23,42,0.04)] hover:border-[#d9e2f2] hover:shadow-[0_14px_34px_rgba(15,23,42,0.06)]"
          }`}
          aria-label="Admin signature"
          title="Admin Signature"
        >
          <IconPen />
          <span className="hidden sm:inline">Admin Signature</span>
          {signature ? (
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" aria-hidden="true" />
          ) : null}
        </button>

        {onBranchChange ? <DashboardBranchSelect value={branchSection} onChange={onBranchChange} dark={dark} /> : null}
        <DashboardDateTimeChip dark={dark} />
      </div>

      <AdminSignatureModal
        open={signatureOpen}
        dark={dark}
        signature={signature}
        onClose={() => setSignatureOpen(false)}
        onClear={clearSignature}
        onSave={saveSignature}
      />
    </header>
  );
}

function DefaultHeader({ user, dark = false, onToggleTheme, branchSection = "Boys", onBranchChange }) {
  const [pendingFeeCount, setPendingFeeCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get("/dashboard/super-admin");
        setPendingFeeCount(response.data?.data?.pendingFeeCount || 0);
      } catch {
        setPendingFeeCount(0);
      }
    };

    if (user?.role === "SUPER_ADMIN") {
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

        {onBranchChange ? (
          <div className="min-w-[180px]">
            <ScrollableSelect
              placeholder="Select Section"
              value={branchSection}
              options={branchOptions}
              onChange={onBranchChange}
              dark={dark}
            />
          </div>
        ) : null}

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
              {user?.role === "SUPER_ADMIN" ? "Super Admin" : user?.role || "User"}
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

export default function TopHeader({
  user,
  dark = false,
  onToggleTheme,
  branchSection = "Boys",
  onBranchChange,
}) {
  if (user?.role === "SUPER_ADMIN") {
    return (
      <SuperAdminHeader
        user={user}
        dark={dark}
        onToggleTheme={onToggleTheme}
        branchSection={branchSection}
        onBranchChange={onBranchChange}
      />
    );
  }

  return (
    <DefaultHeader
      user={user}
      dark={dark}
      onToggleTheme={onToggleTheme}
      branchSection={branchSection}
      onBranchChange={onBranchChange}
    />
  );
}
