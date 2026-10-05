import { MetricCard } from "@/components/app/metric-card";
import { SectionPanel } from "@/components/app/section-panel";
import type { DashboardAnalysis } from "@/analytics/metrics/dashboard";

function percent(value: number | null) {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

function minutes(value: number | null) {
  if (value === null) return "—";
  if (value < 60) return `${value.toFixed(1)} min`;
  if (value < 1440) return `${(value / 60).toFixed(1)} hr`;
  return `${(value / 1440).toFixed(1)} days`;
}

export function AnalyticsEngagementSection({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  return (
    <SectionPanel
      title="Engagement"
      description="When we reach a lead, do we observe an inbound response?"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Responded"
          value={String(analysis.engagement.responded)}
          detail={`${percent(analysis.engagement.responseRate)} of contacted`}
        />
        <MetricCard
          label="Response rate"
          value={percent(analysis.engagement.responseRate)}
          detail="Observed response ÷ contacted"
        />
        <MetricCard
          label="Within 24 hours"
          value={percent(
            analysis.engagement.responseWithin24hRate,
          )}
          detail={`${analysis.engagement.respondedWithin24h} contacted leads`}
        />
        <MetricCard
          label="Median response"
          value={minutes(
            analysis.engagement.medianResponseMinutes,
          )}
          detail="Observed responses"
        />
        <MetricCard
          label="No observed response"
          value={String(
            analysis.engagement.contacted -
              analysis.engagement.responded,
          )}
          detail="Contacted population"
        />
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-2">
        <DataTable
          title="Response speed"
          headers={["Bucket", "Contacted", "Response rate"]}
          rows={analysis.engagement.speed.map((row) => [
            row.label,
            String(row.contacted),
            percent(row.responseRate),
          ])}
        />

        <DataTable
          title="First-touch channel"
          headers={["Channel", "Contacted", "Responded", "Rate"]}
          rows={analysis.engagement.channels.map((row) => [
            row.channel,
            String(row.contacted),
            String(row.responded),
            percent(row.responseRate),
          ])}
        />
      </div>

      <p className="mt-5 text-xs leading-5 text-slate-500">
        Response means the first observed inbound communication at or
        after the first qualifying employee outbound. Absence of observed
        response is not proof that a customer never responded outside the
        available timeline evidence.
      </p>
    </SectionPanel>
  );
}

function DataTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[460px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-3 py-3">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr key={`${row[0]}-${index}`}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${cell}-${cellIndex}`}
                    className={[
                      "px-3 py-3",
                      cellIndex > 0
                        ? "text-right tabular-nums"
                        : "font-medium",
                    ].join(" ")}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
