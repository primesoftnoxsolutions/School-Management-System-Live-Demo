import { useEffect, useRef, useState } from "react";
import {
  cacheTeacherSignature,
  fetchTeacherSignature,
  persistTeacherSignature,
  readCachedTeacherSignature,
} from "../../utils/teacherSignature";

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

function SignatureModal({ open, dark, signature, onClose, onSave, onClear }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const pointsRef = useRef([]);
  const [hasInk, setHasInk] = useState(Boolean(signature));

  useEffect(() => {
    if (!open) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * scale));
      canvas.height = Math.max(1, Math.floor(rect.height * scale));
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 3;
      context.strokeStyle = dark ? "#f8fafc" : "#102a6b";
      context.clearRect(0, 0, rect.width, rect.height);

      if (signature) {
        const image = new Image();
        image.onload = () => {
          context.drawImage(image, 0, 0, rect.width, rect.height);
        };
        image.src = signature;
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [dark, open, signature]);

  if (!open) return null;

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDrawing = (event) => {
    event.preventDefault();
    drawingRef.current = true;
    pointsRef.current = [getPoint(event)];
    setHasInk(true);
    canvasRef.current.setPointerCapture?.(event.pointerId);
  };

  const draw = (event) => {
    if (!drawingRef.current) return;
    event.preventDefault();

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const currentPoint = getPoint(event);
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

  const stopDrawing = () => {
    drawingRef.current = false;
    pointsRef.current = [];
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    context.clearRect(0, 0, rect.width, rect.height);
    setHasInk(false);
    onClear();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    onSave(hasInk ? canvas.toDataURL("image/png") : "");
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-full max-w-xl rounded-2xl border p-4 shadow-2xl ${
          dark ? "border-white/10 bg-[#161722] text-white" : "border-blue-100 bg-white text-slate-900"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold">Teacher Signature</h3>
            <p className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>Draw and save your signature.</p>
          </div>
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

        <div className={`mt-4 rounded-2xl border p-3 ${dark ? "border-white/10 bg-[#0f1018]" : "border-blue-100 bg-blue-50/50"}`}>
          <canvas
            ref={canvasRef}
            className={`h-48 w-full touch-none rounded-xl border bg-white ${
              dark ? "border-white/10" : "border-blue-200"
            }`}
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
    </div>
  );
}

export default function TeacherTopHeader({ user, dark = false, onToggleTheme }) {
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signature, setSignature] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSignature(readCachedTeacherSignature(user));
    let active = true;
    fetchTeacherSignature(user).then((value) => {
      if (active) setSignature(value || "");
    });
    return () => {
      active = false;
    };
  }, [user]);

  const saveSignature = async (nextSignature) => {
    setSaving(true);
    try {
      const saved = await persistTeacherSignature(user, nextSignature || "");
      setSignature(saved);
      setSignatureOpen(false);
    } catch {
      cacheTeacherSignature(user, nextSignature || "");
      setSignature(nextSignature || "");
      setSignatureOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const clearSignature = async () => {
    setSaving(true);
    try {
      await persistTeacherSignature(user, "");
      setSignature("");
    } catch {
      cacheTeacherSignature(user, "");
      setSignature("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <header className="mb-4 flex flex-wrap items-center gap-4 bg-transparent px-5 py-4 lg:px-6">
      <div className="min-w-0">
        <h1 className={`text-lg font-semibold ${dark ? "text-white" : "text-slate-800"}`}>Teacher Portal</h1>
        <p className={`text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Insaaf Grammer High School</p>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
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

        <button
          type="button"
          onClick={() => setSignatureOpen(true)}
          className={`relative flex h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition ${
            dark
              ? "border-white/[0.06] bg-[#161722] text-[#7c4dff] hover:bg-white/[0.04]"
              : "border-slate-200 bg-white text-blue-700 shadow-sm hover:bg-blue-50"
          }`}
          aria-label="Save teacher signature"
          title="Teacher signature"
        >
          <IconPen />
          <span className="hidden sm:inline">Teacher Signature</span>
          {signature ? (
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" aria-hidden="true" />
          ) : null}
        </button>

        <div
          className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 ${
            dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7c4dff] text-sm font-semibold text-white">
            {(user?.fullName || "T").charAt(0)}
          </div>
          <div className="text-left">
            <p className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-800"}`}>
              {user?.fullName || "Teacher"}
            </p>
            <p className={`text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Teacher</p>
          </div>
        </div>
      </div>

      <SignatureModal
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
