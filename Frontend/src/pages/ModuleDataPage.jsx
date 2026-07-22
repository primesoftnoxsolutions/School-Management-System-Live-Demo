export default function ModuleDataPage({ title }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="premium-title text-xl font-semibold">{title}</h2>
        <p className="text-sm text-sky-800/70">
          No dummy data is shown. Records will appear after module APIs and database entries are added.
        </p>
      </div>

      <div className="premium-card">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder={`Search in ${title}`}
            className="premium-input w-full md:max-w-xs"
          />
          <input type="date" className="premium-input" />
          <input type="date" className="premium-input" />
          <button type="button" className="premium-btn">
            Apply Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-sky-100/60 text-left text-sky-900">
              <tr>
                <th className="px-4 py-3 font-medium">Module</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-sky-100/80">
                <td className="px-4 py-3 text-slate-700">{title}</td>
                <td className="px-4 py-3 text-slate-700">No records</td>
                <td className="px-4 py-3 text-slate-700">
                  Create records from this module to see live database data.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
