const FEATURE_LAYOUTS = {
  "Monthly Syllabus": {
    highlight: "Month Coverage",
    description: "Plan the chapter flow for the selected class and keep the monthly roadmap visible.",
    accent: "blue",
    stats: [
      { label: "Weeks Planned", value: "4" },
      { label: "Chapters", value: "12" },
      { label: "Pending", value: "3" },
    ],
    notes: ["Weekly chapter mapping", "Revision checkpoints", "Assessment-ready outline"],
  },
  "Assigned Duties": {
    highlight: "Duty Board",
    description: "Track duty assignments, supervision slots, and responsibility handoffs.",
    accent: "violet",
    stats: [
      { label: "Teachers", value: "18" },
      { label: "Active Duties", value: "7" },
      { label: "Alerts", value: "1" },
    ],
    notes: ["Morning duty", "Break supervision", "Event coverage"],
  },
  "Paper, Date Sheet & Result": {
    highlight: "Exam Schedule",
    description: "Prepare term-wise exam dates, paper drafts, and result card previews.",
    accent: "amber",
    stats: [
      { label: "Sessions", value: "3" },
      { label: "Dates", value: "14" },
      { label: "Approved", value: "Yes" },
    ],
    notes: ["1st Term", "2nd Term", "Final Exam", "Paper draft", "Result card preview"],
  },
  "Roll No Slips Management": {
    highlight: "Roll Slip Queue",
    description: "Organize roll numbers, print-ready slips, and delivery status in one place.",
    accent: "emerald",
    stats: [
      { label: "Slips Ready", value: "124" },
      { label: "Printed", value: "98" },
      { label: "Pending", value: "26" },
    ],
    notes: ["Auto numbering", "Print batch", "Delivery queue"],
  },
  "Paper & Result Card Management": {
    highlight: "Paper Studio",
    description: "Create exam paper drafts and result card layouts for quick review.",
    accent: "rose",
    stats: [
      { label: "Paper Drafts", value: "6" },
      { label: "Result Cards", value: "3" },
      { label: "Reviewed", value: "8" },
    ],
    notes: ["Paper drafting", "Result formatting", "Download preview"],
  },
  "Class Time Table": {
    highlight: "Timetable Grid",
    description: "See a class timetable preview with periods, subjects and room flow.",
    accent: "sky",
    stats: [
      { label: "Periods", value: "8" },
      { label: "Subjects", value: "7" },
      { label: "Free Slots", value: "1" },
    ],
    notes: ["Day-wise blocks", "Room allocation", "Subject rotation"],
  },
};

const accentMap = {
  blue: "bg-blue-50 text-blue-700",
  violet: "bg-violet-50 text-violet-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
  rose: "bg-rose-50 text-rose-700",
  sky: "bg-sky-50 text-sky-700",
};

const darkAccentMap = {
  blue: "bg-[#7c4dff]/15 text-[#7c4dff]",
  violet: "bg-[#7c4dff]/15 text-[#7c4dff]",
  amber: "bg-[#ff9800]/15 text-[#ff9800]",
  emerald: "bg-[#4caf50]/15 text-[#4caf50]",
  rose: "bg-[#e91e63]/15 text-[#e91e63]",
  sky: "bg-[#26a69a]/15 text-[#26a69a]",
};

function IconSpark({ dark = false }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2Z" />
      <path d="M19 13l.9 2.6L22 16l-2.1.4L19 19l-.9-2.6L16 16l2.1-.4L19 13Z" />
    </svg>
  );
}

export default function TeacherAcademicFeaturePage({ title, dark = false }) {
  const feature = FEATURE_LAYOUTS[title] || FEATURE_LAYOUTS["Monthly Syllabus"];
  const toneClass = dark ? darkAccentMap[feature.accent] : accentMap[feature.accent];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>{title}</h2>
          <p className={`mt-1 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{feature.description}</p>
        </div>
        <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${toneClass} ${dark ? "border-white/[0.06]" : "border-transparent"}`}>
          <IconSpark />
          <span>{feature.highlight}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {feature.stats.map((stat) => (
          <article
            key={stat.label}
            className={`rounded-2xl border p-4 ${dark ? "border-white/[0.06] bg-[#161722]" : "ref-card"}`}
          >
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
              {stat.label}
            </p>
            <p className={`mt-3 text-3xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>{stat.value}</p>
            <p className={`mt-2 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Dummy preview</p>
          </article>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className={`rounded-2xl border p-5 ${dark ? "border-white/[0.06] bg-[#161722]" : "ref-card"}`}>
          <h3 className={`text-sm font-semibold uppercase tracking-[0.16em] ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
            Workflow Preview
          </h3>
          <div className="mt-4 space-y-3">
            {feature.notes.map((note, index) => (
              <div
                key={note}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                  dark ? "border-white/[0.06] bg-[#1a1b26]" : "border-slate-100 bg-white"
                }`}
              >
                <span className={`text-sm font-medium ${dark ? "text-white" : "text-slate-800"}`}>{note}</span>
                <span className={`text-xs font-semibold uppercase tracking-[0.16em] ${dark ? "text-[#9e9e9e]" : "text-slate-400"}`}>
                  Step {index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-2xl border p-5 ${dark ? "border-white/[0.06] bg-[#1a1b26]" : "bg-slate-50"}`}>
          <h3 className={`text-sm font-semibold uppercase tracking-[0.16em] ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
            Quick Actions
          </h3>
          <div className="mt-4 space-y-3">
            {["Open preview", "Edit settings", "Download dummy file"].map((action) => (
              <button
                key={action}
                type="button"
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                  dark
                    ? "border-white/[0.06] bg-[#161722] text-white hover:bg-white/[0.04]"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{action}</span>
                <span className={dark ? "text-[#9e9e9e]" : "text-slate-400"}>›</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
