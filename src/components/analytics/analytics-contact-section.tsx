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

export function AnalyticsContactSection({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  return (
    <SectionPanel
      title="Contact"
      description="Are we reaching the leads, and how quickly after creation?"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Contacted"
          value={String(analysis.contact.contacted)}
          detail={`${percent(analysis.contact.contactRate)} of population`}
        />
        <MetricCard
          label="Not contacted"
          value={String(analysis.contact.notContacted)}
          detail="No qualifying employee outbound observed"
        />
        <MetricCard
          label="Median first contact"
          value={minutes(analysis.contact.medianFirstContactMinutes)}
          detail={`${analysis.contact.validFirstContactTimes} valid timestamps`}
        />
        <MetricCard
          label="Timeline coverage"
          value={percent(analysis.acquisition.timelineCoverageRate)}
          detail={`${analysis.acquisition.timelineCovered} leads with timeline`}
        />
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[650px] text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">Time to first contact</th>
              <th className="px-3 py-3 text-right">Leads</th>
              <th className="px-3 py-3 text-right">Share of timed contacts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {analysis.contact.contactSpeed.map((row) => (
              <tr key={row.key}>
                <td className="px-3 py-3 font-medium">{row.label}</td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {row.contacted}
                </td>
                <td className="px-3 py-3 text-right">
                  {percent(row.rate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        First-contact speed is lead creation → first qualifying employee
        outbound. Leads without usable creation timestamps remain in the
        contact population but are excluded from the timed denominator.
      </p>
    </SectionPanel>
  );
}
