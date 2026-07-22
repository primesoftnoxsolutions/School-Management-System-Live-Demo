const boardThemes = {
  "Teacher Stats": {
    accent: "#7c4dff",
    iconBg: "rgba(124, 77, 255, 0.15)",
    lightCard: "bg-white/90",
    lightIcon: "from-[#7c4dff] to-[#6a3df0]",
  },
  "Student Stats": {
    accent: "#4caf50",
    iconBg: "rgba(76, 175, 80, 0.15)",
    lightCard: "bg-white/90",
    lightIcon: "from-[#4caf50] to-[#43a047]",
  },
  "Other Stats": {
    accent: "#ff9800",
    iconBg: "rgba(255, 152, 0, 0.15)",
    lightCard: "bg-white/90",
    lightIcon: "from-[#ff9800] to-[#fb8c00]",
  },
};

const rowAccents = {
  blue: "#7c4dff",
  green: "#4caf50",
  purple: "#7c4dff",
  orange: "#ff9800",
  rose: "#e91e63",
  sky: "#7c4dff",
  amber: "#ff9800",
};

export function StatsRowCard({ title, value, tone = "blue", icon: Icon, unit = "", dark = false }) {
  const accent = rowAccents[tone] || rowAccents.blue;

  if (dark) {
    return (
      <article
        className="group relative flex min-h-[72px] items-center gap-3 overflow-hidden rounded-xl border px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(124,77,255,0.25)]"
        style={{ backgroundColor: "#1a1b26", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <span
          className="absolute bottom-3 left-0 top-3 w-1 rounded-r-full transition-all duration-200 group-hover:bottom-2 group-hover:top-2"
          style={{ backgroundColor: accent }}
        />
        <div
          className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105"
          style={{ backgroundColor: `${accent}22`, color: accent }}
        >
          {Icon ? <Icon className="h-5 w-5" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#9e9e9e]">{title}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[1.75rem] font-normal leading-none text-white">{value}</p>
          {unit ? <p className="mt-1 text-[10px] font-normal uppercase tracking-wider text-[#9e9e9e]">{unit}</p> : null}
        </div>
      </article>
    );
  }

  const lightAccents = {
    blue: { accent: "bg-indigo-500", icon: "bg-indigo-50 text-indigo-600", value: "text-indigo-700" },
    green: { accent: "bg-teal-500", icon: "bg-teal-50 text-teal-600", value: "text-teal-700" },
    purple: { accent: "bg-indigo-500", icon: "bg-indigo-50 text-indigo-600", value: "text-indigo-700" },
    orange: { accent: "bg-amber-500", icon: "bg-amber-50 text-amber-600", value: "text-amber-700" },
    rose: { accent: "bg-rose-500", icon: "bg-rose-50 text-rose-600", value: "text-rose-700" },
    sky: { accent: "bg-indigo-500", icon: "bg-indigo-50 text-indigo-600", value: "text-indigo-700" },
    amber: { accent: "bg-amber-500", icon: "bg-amber-50 text-amber-600", value: "text-amber-700" },
  };
  const styles = lightAccents[tone] || lightAccents.blue;

  return (
    <article className="group relative flex min-h-[72px] items-center gap-3 overflow-hidden rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-md">
      <span className={`absolute bottom-3 left-0 top-3 w-1 rounded-r-full ${styles.accent}`} />
      <div className={`ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}>
        {Icon ? <Icon className="h-5 w-5" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">{title}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-[1.75rem] font-normal leading-none ${styles.value}`}>{value}</p>
        {unit ? <p className="mt-1 text-[10px] font-normal uppercase tracking-wider text-slate-500">{unit}</p> : null}
      </div>
    </article>
  );
}

export function StatsColumnBoard({ title, subtitle, items = [], dark = false }) {
  const theme = boardThemes[title] || boardThemes["Teacher Stats"];

  if (dark) {
    return (
      <div
        className="rounded-xl border p-4 sm:p-5"
        style={{ backgroundColor: "#161722", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="mb-4 flex items-center justify-between border-b pb-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: theme.accent }}
          >
            {items[0]?.icon ? (() => {
              const Icon = items[0].icon;
              return <Icon className="h-4 w-4" />;
            })() : null}
          </div>
        </div>
        <div className="space-y-2.5">
          {items.map((item) => (
            <StatsRowCard
              key={item.label}
              title={item.label}
              value={item.value}
              tone={item.tone}
              icon={item.icon}
              unit={item.unit}
              dark={dark}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-white/90 ${theme.lightCard} p-4 shadow-[0_18px_42px_rgba(88,80,180,0.12)] sm:p-5`}>
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs font-normal text-slate-500">{subtitle}</p> : null}
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${theme.lightIcon} text-white`}>
          {items[0]?.icon ? (() => {
            const Icon = items[0].icon;
            return <Icon className="h-4 w-4" />;
          })() : null}
        </div>
      </div>
      <div className="space-y-2.5">
        {items.map((item) => (
          <StatsRowCard
            key={item.label}
            title={item.label}
            value={item.value}
            tone={item.tone}
            icon={item.icon}
            unit={item.unit}
            dark={dark}
          />
        ))}
      </div>
    </div>
  );
}
