import { MetricCard } from "@/components/app/metric-card";
import { SectionPanel } from "@/components/app/section-panel";
import type { DashboardAnalysis } from "@/analytics/metrics/dashboard";

function percent(value: number | null) {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

export function AnalyticsProgressionSection({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  return (
    <SectionPanel
      title="Progression"
      description="Appointment and outcome evidence are parallel evidence populations, not a proven sequential funnel."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Appointment evidence"
          value={String(analysis.progression.appointmentEvidence)}
          detail={`${percent(
            analysis.progression.appointmentRateOfContacted,
          )} of contacted`}
        />
        <MetricCard
          label="Appointment / contacted"
          value={percent(
            analysis.progression.appointmentRateOfContacted,
          )}
          detail="Observed appointment evidence"
        />
        <MetricCard
          label="Appointment / responded"
          value={percent(
            analysis.progression.appointmentRateOfResponded,
          )}
          detail="Observed appointment evidence"
        />
        <MetricCard
          label="Sold / Closed"
          value={String(analysis.progression.soldClosed)}
          detail={`${percent(
            analysis.progression.soldClosedRateOfAll,
          )} of population`}
        />
        <MetricCard
          label="Outcome without timeline"
          value={String(
            analysis.progression.soldClosedWithoutTimeline,
          )}
          detail="Current Sold/Closed state with no linked timeline"
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <EvidenceBox
          label="Appointment evidence"
          value={analysis.progression.appointmentEvidence}
          detail="Inferred from qualifying stage-change evidence."
        />
        <EvidenceBox
          label="Sold / Closed"
          value={analysis.progression.soldClosed}
          detail="Current lead stage, not a reconstructed sale transaction."
        />
        <EvidenceBox
          label="Outcome evidence coverage"
          value={analysis.progression.soldClosedWithTimeline}
          detail={`${analysis.progression.soldClosedWithoutTimeline} Sold/Closed leads have no timeline coverage.`}
        />
      </div>
    </SectionPanel>
  );
}

function EvidenceBox({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}
