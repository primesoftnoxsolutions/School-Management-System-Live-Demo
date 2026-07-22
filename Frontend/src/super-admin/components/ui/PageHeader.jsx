export default function PageHeader({ title, subtitle, actionLabel, onAction, extra, afterAction, dark = false }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className={`text-2xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>{title}</h2>
        {subtitle ? <p className={`mt-0.5 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{subtitle}</p> : null}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {extra}
        {actionLabel && onAction ? (
          <button type="button" onClick={onAction} className="ref-btn-primary whitespace-nowrap">
            + {actionLabel}
          </button>
        ) : null}
        {afterAction}
      </div>
    </div>
  );
}
