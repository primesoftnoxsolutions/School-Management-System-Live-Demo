const toneMap = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  purple: "bg-violet-50 text-violet-600",
  orange: "bg-orange-50 text-orange-600",
  rose: "bg-rose-50 text-rose-600",
  sky: "bg-sky-50 text-sky-600",
  amber: "bg-amber-50 text-amber-600",
};

const darkToneMap = {
  blue: "bg-[#7c4dff]/15 text-[#7c4dff]",
  green: "bg-[#4caf50]/15 text-[#4caf50]",
  purple: "bg-[#7c4dff]/15 text-[#7c4dff]",
  orange: "bg-[#ff9800]/15 text-[#ff9800]",
  rose: "bg-[#e91e63]/15 text-[#e91e63]",
  sky: "bg-[#26a69a]/15 text-[#26a69a]",
  amber: "bg-[#ff9800]/15 text-[#ff9800]",
};

export default function StatCard({ title, value, change, tone = "blue", icon: Icon, dark = false }) {
  const tones = dark ? darkToneMap : toneMap;

  return (
    <article
      className={`group flex items-start justify-between p-5 transition hover:-translate-y-0.5 ${
        dark
          ? "rounded-2xl border border-white/[0.06] bg-[#161722] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
          : "ref-card hover:shadow-md"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{title}</p>
        <h3 className={`mt-2 text-3xl font-bold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
          {value}
        </h3>
        {change ? (
          <p className={`mt-2 text-xs font-medium ${dark ? "text-[#4caf50]" : "text-emerald-600"}`}>{change}</p>
        ) : null}
      </div>
      <div
        className={`ml-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition group-hover:scale-105 ${tones[tone]}`}
      >
        {Icon ? <Icon /> : null}
      </div>
    </article>
  );
}
