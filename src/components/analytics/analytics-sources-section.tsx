import { SectionPanel } from "@/components/app/section-panel";
import type { DashboardAnalysis } from "@/analytics/metrics/dashboard";

function percent(value: number | null) {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

export function AnalyticsSourcesSection({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  return (
    <SectionPanel
      title="Sources"
      description="Compare observed populations and evidence coverage. Differences are associations, not proof that source caused the result."
    >
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[1180px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">Source</th>
              <th className="px-3 py-3">Group</th>
              <th className="px-3 py-3 text-right">Leads</th>
              <th className="px-3 py-3 text-right">Timeline</th>
              <th className="px-3 py-3 text-right">Contact</th>
              <th className="px-3 py-3 text-right">Response</th>
              <th className="px-3 py-3 text-right">≤24h</th>
              <th className="px-3 py-3 text-right">Appt. evidence</th>
              <th className="px-3 py-3 text-right">Sold/Closed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {analysis.sources.map((row) => (
              <tr key={row.source}>
                <td className="px-3 py-3 font-medium">{row.source}</td>
                <td className="px-3 py-3 text-slate-500">
                  {row.sourceGroup}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {row.leads}
                </td>
                <td className="px-3 py-3 text-right">
                  {percent(row.timelineCoverageRate)}
                </td>
                <td className="px-3 py-3 text-right">
                  {percent(row.contactRate)}
                </td>
                <td className="px-3 py-3 text-right">
                  {percent(row.responseRate)}
                </td>
                <td className="px-3 py-3 text-right">
                  {percent(row.responseWithin24hRate)}
                </td>
                <td className="px-3 py-3 text-right">
                  {row.appointmentEvidence} (
                  {percent(row.appointmentRate)})
                </td>
                <td className="px-3 py-3 text-right">
                  {row.soldClosed} ({percent(row.soldClosedRate)})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Small populations can produce unstable rates. Source groups are
        summarized from the most common group attached to each source, so
        mixed source-to-group mappings should be treated cautiously.
      </p>
    </SectionPanel>
  );
}
