import type { DashboardAnalysis } from "@/analytics/metrics/dashboard";

function pct(value: number | null) {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

export function AnalyticsTrends({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  const max = Math.max(
    ...analysis.trends.map((row) => row.leads),
    1,
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="font-semibold">Performance over time</h2>

        <p className="mt-1 text-sm text-slate-500">
          Lead creation cohorts with contact, response, appointment evidence,
          and Sold/Closed rates.
        </p>
      </div>

      <div className="p-5">
        {analysis.trends.length ? (
          <>
            <div className="grid grid-cols-[80px_minmax(0,1fr)_70px_70px_70px] items-end gap-3 border-b border-slate-200 pb-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              <span>Month</span>
              <span>Lead volume</span>
              <span className="text-right">Contact</span>
              <span className="text-right">Response</span>
              <span className="text-right">Sold</span>
            </div>

            <div className="divide-y divide-slate-100">
              {analysis.trends.map((row) => (
                <div
                  key={row.month}
                  className="grid grid-cols-[80px_minmax(0,1fr)_70px_70px_70px] items-center gap-3 py-3"
                >
                  <span className="text-xs font-medium">
                    {row.label}
                  </span>

                  <div className="h-7 rounded-md bg-slate-50">
                    <div
                      className="flex h-7 items-center rounded-md bg-slate-800 px-2 text-[11px] font-semibold text-white"
                      style={{
                        width: `${Math.max(
                          (row.leads / max) * 100,
                          row.leads ? 12 : 0,
                        )}%`,
                      }}
                    >
                      {row.leads}
                    </div>
                  </div>

                  <span className="text-right text-xs tabular-nums">
                    {pct(row.contactRate)}
                  </span>

                  <span className="text-right text-xs tabular-nums">
                    {pct(row.responseRate)}
                  </span>

                  <span className="text-right text-xs tabular-nums">
                    {pct(row.soldClosedRate)}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">
            No valid creation dates are available for this population.
          </p>
        )}

        <p className="mt-5 text-xs leading-5 text-slate-400">
          Recent cohorts can look weaker simply because they have had less time
          to mature. Sold/Closed reflects current observed state.
        </p>
      </div>
    </section>
  );
}
