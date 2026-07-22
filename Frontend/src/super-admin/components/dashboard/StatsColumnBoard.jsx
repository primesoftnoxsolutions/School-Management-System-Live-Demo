const boardThemes = {
  "Teacher Stats": {
    accent: "#1677ff",
    accentSoft: "rgba(22, 119, 255, 0.12)",
    border: "#d9e9ff",
    tint: "from-[#f7fbff] via-[#f4f9ff] to-[#eef6ff]",
    headerBg: "rgba(22, 119, 255, 0.12)",
  },
  "Student Stats": {
    accent: "#18b76d",
    accentSoft: "rgba(24, 183, 109, 0.12)",
    border: "#dff7ea",
    tint: "from-[#f8fffb] via-[#f4fff7] to-[#eefcf5]",
    headerBg: "rgba(24, 183, 109, 0.12)",
  },
  "Other Stats": {
    accent: "#f9a51a",
    accentSoft: "rgba(249, 165, 26, 0.12)",
    border: "#ffe9c5",
    tint: "from-[#fffaf3] via-[#fff8ef] to-[#fff5e3]",
    headerBg: "rgba(249, 165, 26, 0.12)",
  },
};

const toneMap = {
  blue: { value: "text-[#1b76e5]", circle: "bg-[#eaf3ff] text-[#1b76e5]", line: "#1b76e5" },
  green: { value: "text-[#14a96b]", circle: "bg-[#e5fbef] text-[#14a96b]", line: "#14a96b" },
  purple: { value: "text-[#6745e6]", circle: "bg-[#efeafe] text-[#6745e6]", line: "#6745e6" },
  orange: { value: "text-[#f59f00]", circle: "bg-[#fff2db] text-[#f59f00]", line: "#f59f00" },
  rose: { value: "text-[#e23b52]", circle: "bg-[#ffe8ec] text-[#e23b52]", line: "#e23b52" },
  sky: { value: "text-[#1b76e5]", circle: "bg-[#eaf3ff] text-[#1b76e5]", line: "#1b76e5" },
  amber: { value: "text-[#f59f00]", circle: "bg-[#fff2db] text-[#f59f00]", line: "#f59f00" },
};

export function StatsRowCard({ title, value, tone = "blue", icon: Icon, unit = "", dark = false }) {
  const styles = toneMap[tone] || toneMap.blue;

  if (dark) {
    return (
    <article className="group relative flex min-h-[118px] min-w-0 flex-1 flex-col items-center rounded-[8px] border border-white/[0.06] bg-[#1a1b26] px-6 py-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(0,0,0,0.18)]">
      <span
        className="absolute bottom-0 left-0 h-[3px] w-full rounded-t-full opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ backgroundColor: styles.line }}
        aria-hidden="true"
      />
      <p className="whitespace-nowrap text-[13px] font-medium leading-none text-[#9e9e9e]">{title}</p>
      <div className="flex flex-1 items-center justify-center">
        <p className={`text-[2.15rem] font-semibold leading-none ${styles.value}`}>{value}</p>
      </div>
      {unit ? <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#9e9e9e]">{unit}</p> : null}
    </article>
  );
}

  return (
    <article className="group relative flex min-h-[118px] min-w-0 flex-1 flex-col items-center rounded-[8px] border border-[#edf2fa] bg-white px-6 py-4 text-center shadow-[0_10px_26px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#dce7f7] hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
      <span
        className="absolute bottom-0 left-0 h-[3px] w-full rounded-t-full opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ backgroundColor: styles.line }}
        aria-hidden="true"
      />
      <p className="whitespace-nowrap text-[14px] font-medium leading-none text-[#55627d]">{title}</p>
      <div className="flex flex-1 items-center justify-center">
        <p className={`text-[2.2rem] font-semibold leading-none ${styles.value}`}>{value}</p>
      </div>
      {unit ? <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#8b97b1]">{unit}</p> : null}
    </article>
  );
}

function SectionHeaderIcon({ accent, icon: Icon, dark = false }) {
  return (
    <div
      className="flex h-12 w-12 items-center justify-center rounded-[10px] text-white shadow-[0_14px_24px_rgba(15,23,42,0.08)]"
      style={{ backgroundColor: dark ? accent : accent }}
    >
      {Icon ? <Icon className="h-5 w-5" /> : null}
    </div>
  );
}

export function StatsColumnBoard({ title, subtitle, items = [], dark = false }) {
  const theme = boardThemes[title] || boardThemes["Teacher Stats"];
  const headerIcon = items[0]?.icon;

  return (
    <div
      className={`relative overflow-hidden rounded-[12px] border p-5 sm:p-6 ${
        dark ? "border-white/[0.06] bg-[#161722]" : `bg-gradient-to-br ${theme.tint}`
      }`}
      style={
        dark
          ? undefined
          : {
              borderColor: theme.border,
              boxShadow: "0 18px 42px rgba(15, 23, 42, 0.06)",
            }
      }
    >
      <span
        className="absolute left-0 top-0 h-full w-[3px] rounded-r-full"
        style={{ backgroundColor: theme.accent }}
        aria-hidden="true"
      />
      <div className="mb-5 flex items-center gap-4">
        <SectionHeaderIcon accent={theme.accent} icon={headerIcon} dark={dark} />
        <div className="min-w-0 flex-1">
          <h3 className={`text-[18px] font-semibold leading-none ${dark ? "text-white" : "text-[#24324f]"}`}>{title}</h3>
          {subtitle ? <p className={`mt-2 text-[13px] ${dark ? "text-[#9e9e9e]" : "text-[#7d89a3]"}`}>{subtitle}</p> : null}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
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
