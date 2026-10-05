import type { DashboardAnalysis } from "@/analytics/metrics/dashboard";

function pct(value: number | null) {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

function minutes(value: number | null) {
  if (value === null) {
    return "—";
  }

  return value < 60
    ? `${value.toFixed(1)} min`
    : `${(value / 60).toFixed(1)} hr`;
}

export function AnalyticsManagementSummary({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  const noResponse =
    analysis.engagement.contacted -
    analysis.engagement.responded;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Management overview
        </p>

        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Where are the leads breaking down?
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Volume, speed, engagement, and observed outcomes at a glance.
            </p>
          </div>

          <span className="text-xs text-slate-400">
            Observed evidence · not a sequential funnel
          </span>
        </div>
      </div>

      <div className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        <Metric
          label="Leads"
          value={String(analysis.acquisition.leads)}
          detail="Selected population"
        />

        <Metric
          label="Contacted"
          value={pct(analysis.contact.contactRate)}
          detail={`${analysis.contact.contacted} contacted · ${analysis.contact.notContacted} not observed`}
        />

        <Metric
          label="Responded"
          value={pct(analysis.engagement.responseRate)}
          detail={`${analysis.engagement.responded} responded · ${noResponse} no response observed`}
        />

        <Metric
          label="Sold / Closed"
          value={pct(analysis.progression.soldClosedRateOfAll)}
          detail={`${analysis.progression.soldClosed} current Sold/Closed states`}
        />
      </div>

      <div className="grid gap-px border-t border-slate-200 bg-slate-200 sm:grid-cols-3">
        <Insight
          label="Median first contact"
          value={minutes(analysis.contact.medianFirstContactMinutes)}
          detail="Lead creation → first qualifying outbound"
        />

        <Insight
          label="Response within 24h"
          value={pct(analysis.engagement.responseWithin24hRate)}
          detail={`${analysis.engagement.respondedWithin24h} contacted leads`}
        />

        <Insight
          label="Appointment evidence"
          value={pct(analysis.progression.appointmentRateOfContacted)}
          detail={`${analysis.progression.appointmentEvidence} observed signals`}
        />
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>

      <p className="mt-1.5 text-xs leading-5 text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function Insight({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <p className="mt-1 text-lg font-semibold tabular-nums">
        {value}
      </p>

      <p className="mt-0.5 text-[11px] text-slate-400">
        {detail}
      </p>
    </div>
  );
}
