export default function TablePagination({ page, totalPages, total, onPrev, onNext, dark = false }) {
  return (
    <div
      className={`flex items-center justify-end gap-2 border-t px-5 py-3 text-sm ${
        dark ? "border-white/[0.06] text-[#9e9e9e]" : "border-slate-100 text-slate-600"
      }`}
    >
      <span>
        Total: {total} | Page {page} of {totalPages || 1}
      </span>
      <button
        type="button"
        disabled={page <= 1}
        onClick={onPrev}
        className={`rounded-lg border px-3 py-1.5 text-xs disabled:opacity-50 ${
          dark
            ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e] hover:bg-white/[0.04] hover:text-white"
            : "ref-btn-outline"
        }`}
      >
        Prev
      </button>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={onNext}
        className={`rounded-lg border px-3 py-1.5 text-xs disabled:opacity-50 ${
          dark
            ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e] hover:bg-white/[0.04] hover:text-white"
            : "ref-btn-outline"
        }`}
      >
        Next
      </button>
    </div>
  );
}
