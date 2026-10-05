import { MetricCard } from "@/components/app/metric-card";
import type { DashboardAnalysis } from "@/analytics/metrics/dashboard";

function percent(value: number | null) {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

export function AnalyticsSummary({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  return (
    <section className="rounded-2xl bg-slate-950 p-6 text-white lg:p-8">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Management summary
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          What is happening to the Internet lead population?
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          These measures describe observed evidence. They are deliberately
          not presented as a guaranteed sequential conversion funnel.
        </p>
      </div>

      <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <SummaryMetric
          label="Leads"
          value={String(analysis.acquisition.leads)}
          detail="Population"
        />
        <SummaryMetric
          label="Contact rate"
          value={percent(analysis.contact.contactRate)}
          detail={`${analysis.contact.contacted} contacted`}
        />
        <SummaryMetric
          label="Response rate"
          value={percent(analysis.engagement.responseRate)}
          detail={`${analysis.engagement.responded} responded`}
        />
        <SummaryMetric
          label="Appointment evidence"
          value={percent(
            analysis.progression.appointmentRateOfContacted,
          )}
          detail={`${analysis.progression.appointmentEvidence} observed`}
        />
        <SummaryMetric
          label="Sold / Closed"
          value={percent(
            analysis.progression.soldClosedRateOfAll,
          )}
          detail={`${analysis.progression.soldClosed} current states`}
        />
      </div>
    </section>
  );
}

function SummaryMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  );
}
