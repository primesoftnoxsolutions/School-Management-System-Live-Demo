import { studentNavIconMap } from "../icons/NavIcons";

export default function StudentNavSubmenu({
  items,
  selected,
  onSelect,
  dark = true,
  onDarkSidebar = true,
  schoolTheme = false,
}) {
  return (
    <div className="space-y-0.5 pl-1">
      {items.map((subpage) => {
        const active = selected === subpage.id;
        const SubIcon = studentNavIconMap[subpage.id];

        const activeClass = schoolTheme
          ? dark
            ? "bg-emerald-700/40 text-emerald-100"
            : "bg-[#1B5E3B] text-white"
          : onDarkSidebar || dark
            ? "bg-white/[0.08] text-white"
            : "bg-blue-50 text-blue-700";

        const idleClass = schoolTheme
          ? dark
            ? "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
            : "text-[#4a5568] hover:bg-[#f3f6f4] hover:text-[#1a2e22]"
          : onDarkSidebar || dark
            ? "text-white/72 hover:bg-white/[0.04] hover:text-white"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900";

        const iconActive = schoolTheme
          ? dark
            ? "text-emerald-200"
            : "text-white"
          : onDarkSidebar || dark
            ? "text-white"
            : "text-blue-700";

        const iconIdle = schoolTheme
          ? dark
            ? "text-slate-500"
            : "text-[#8b95a5]"
          : onDarkSidebar || dark
            ? "text-white/90"
            : "text-blue-700";

        return (
          <button
            key={subpage.id}
            type="button"
            onClick={() => onSelect(subpage.id)}
            className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-[15px] font-medium outline-none transition-colors duration-150 focus:outline-none ${
              active ? activeClass : idleClass
            }`}
          >
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center ${active ? iconActive : iconIdle}`}>
              {SubIcon ? <SubIcon className="h-[18px] w-[18px]" /> : null}
            </span>
            <span className="truncate">{subpage.label}</span>
          </button>
        );
      })}
    </div>
  );
}
