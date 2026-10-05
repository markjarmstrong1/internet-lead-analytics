import { SectionPanel } from "@/components/app/section-panel";
import type { DashboardAnalysis } from "@/analytics/metrics/dashboard";

function percent(value: number | null) {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

export function AnalyticsTrendsSection({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  const max = Math.max(
    ...analysis.trends.map((row) => row.leads),
    1,
  );

  return (
    <SectionPanel
      title="Trends"
      description="Monthly cohorts are based on lead creation month. Recent cohorts may be less mature than older cohorts."
    >
      <div className="space-y-3">
        {analysis.trends.map((row) => (
          <div
            key={row.month}
            className="rounded-xl border border-slate-200 p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold">{row.label}</span>
              <span className="text-sm tabular-nums">
                {row.leads} leads
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-800"
                style={{
                  width: `${(row.leads / max) * 100}%`,
                }}
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
              <TrendStat label="Contact" value={percent(row.contactRate)} />
              <TrendStat label="Response" value={percent(row.responseRate)} />
              <TrendStat
                label="Appt. evidence"
                value={percent(row.appointmentRate)}
              />
              <TrendStat
                label="Sold / Closed"
                value={percent(row.soldClosedRate)}
              />
              <TrendStat
                label="Responded"
                value={String(row.responded)}
              />
            </div>
          </div>
        ))}
      </div>

      {analysis.trends.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No valid lead creation dates are available for the selected population.
        </p>
      ) : null}
    </SectionPanel>
  );
}

function TrendStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span className="block text-slate-400">{label}</span>
      <span className="mt-1 block font-medium tabular-nums">{value}</span>
    </div>
  );
}
