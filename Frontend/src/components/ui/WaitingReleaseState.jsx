export default function WaitingReleaseState({
  title = "Waiting for release",
  message = "This document will appear here automatically once your teacher releases it.",
  accent = "sky",
}) {
  const tones = {
    sky: {
      soft: "from-sky-50 via-white to-indigo-50",
      ring: "ring-sky-100",
      badge: "bg-sky-100 text-sky-700",
      glow: "#38bdf8",
    },
    violet: {
      soft: "from-violet-50 via-white to-fuchsia-50",
      ring: "ring-violet-100",
      badge: "bg-violet-100 text-violet-700",
      glow: "#a78bfa",
    },
    indigo: {
      soft: "from-indigo-50 via-white to-blue-50",
      ring: "ring-indigo-100",
      badge: "bg-indigo-100 text-indigo-700",
      glow: "#818cf8",
    },
  };
  const tone = tones[accent] || tones.sky;

  return (
    <div className={`rounded-3xl border border-slate-100 bg-gradient-to-br ${tone.soft} px-6 py-12 text-center shadow-sm`}>
      <div className="mx-auto flex max-w-xl flex-col items-center">
        <div className={`relative mb-6 grid h-44 w-44 place-items-center rounded-[2rem] bg-white/80 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ${tone.ring}`}>
          <div className="absolute inset-4 rounded-[1.6rem] opacity-40 blur-2xl" style={{ background: tone.glow }} />
          <svg viewBox="0 0 200 200" className="relative h-36 w-36 drop-shadow-lg" aria-hidden="true">
            <ellipse cx="100" cy="168" rx="54" ry="10" fill="#cbd5e1" opacity="0.55" />
            <circle cx="100" cy="104" r="62" fill="#1e3a8a" />
            <circle cx="100" cy="104" r="54" fill="#eff6ff" />
            <circle cx="100" cy="104" r="48" fill="#ffffff" stroke="#bfdbfe" strokeWidth="3" />
            <circle cx="100" cy="48" r="10" fill="#f59e0b" />
            <rect x="94" y="28" width="12" height="18" rx="4" fill="#f59e0b" />
            <circle cx="100" cy="104" r="4" fill="#1e3a8a" />
            <line x1="100" y1="104" x2="100" y2="68" stroke="#1e3a8a" strokeWidth="5" strokeLinecap="round" />
            <line x1="100" y1="104" x2="132" y2="116" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" />
            <g fill="#64748b" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="700" textAnchor="middle">
              <text x="100" y="68">12</text>
              <text x="136" y="108">3</text>
              <text x="100" y="148">6</text>
              <text x="64" y="108">9</text>
            </g>
            <path d="M146 70c8 10 10 24 4 36" fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
            <circle cx="152" cy="66" r="5" fill="#38bdf8" />
          </svg>
        </div>

        <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${tone.badge}`}>Waiting</span>
        <h2 className="mt-4 text-2xl font-black text-slate-950">{title}</h2>
        <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">{message}</p>
      </div>
    </div>
  );
}
