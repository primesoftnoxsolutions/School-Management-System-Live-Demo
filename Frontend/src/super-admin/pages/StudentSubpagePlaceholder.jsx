export default function StudentSubpagePlaceholder({ title, subtitle, points = [], dark = false }) {
  const cardClass = dark ? "rounded-2xl border border-white/[0.06] bg-[#161722]" : "ref-card";

  return (
    <section className="space-y-6">
      <div>
        <h2 className={`text-2xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>{title}</h2>
        <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{subtitle}</p>
      </div>

      <div className={`${cardClass} p-6`}>
        <div className="max-w-3xl space-y-4">
          <p className={`text-sm ${dark ? "text-[#d7d2ff]" : "text-slate-600"}`}>
            This student subpage is attached in the sidebar and ready to be connected to real data or forms next.
          </p>
          {points.length ? (
            <ul className={`space-y-2 text-sm ${dark ? "text-[#d7d2ff]" : "text-slate-600"}`}>
              {points.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#0b63d8]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
