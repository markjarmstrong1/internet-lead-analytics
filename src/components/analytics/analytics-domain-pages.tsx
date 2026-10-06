import type { DashboardAnalysis } from "@/analytics/metrics/dashboard";
import {
  Bars,
  Card,
  minutes,
  pct,
  Stat,
} from "./analytics-section-page";

export function AcquisitionPage({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Leads" value={String(analysis.acquisition.leads)} />
        <Stat
          label="Timeline coverage"
          value={pct(analysis.acquisition.timelineCoverageRate)}
          detail={`${analysis.acquisition.timelineCovered} leads`}
        />
        <Stat
          label="Unknown source"
          value={String(analysis.acquisition.unknownSource)}
        />
      </div>

      <Card
        title="Lead sources"
        description="Where the selected population came from."
      >
        <SourceTable analysis={analysis} />
      </Card>
    </>
  );
}

export function ContactPage({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Contact rate"
          value={pct(analysis.contact.contactRate)}
          detail={`${analysis.contact.contacted} contacted`}
        />
        <Stat
          label="Median first contact"
          value={minutes(analysis.contact.medianFirstContactMinutes)}
        />
        <Stat
          label="Not contacted"
          value={String(analysis.contact.notContacted)}
        />
      </div>

      <Card
        title="Speed-to-lead"
        description="Time from lead creation to first qualifying employee outbound."
      >
        <Bars
          rows={analysis.contact.contactSpeed.map((row) => ({
            label: row.label,
            value: row.contacted,
            detail: pct(row.rate),
          }))}
        />
      </Card>
    </>
  );
}

export function EngagementPage({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Response rate"
          value={pct(analysis.engagement.responseRate)}
          detail={`${analysis.engagement.responded} responded`}
        />
        <Stat
          label="Response ≤24h"
          value={pct(analysis.engagement.responseWithin24hRate)}
          detail={`${analysis.engagement.respondedWithin24h} contacted leads`}
        />
        <Stat
          label="Median response"
          value={minutes(analysis.engagement.medianResponseMinutes)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card
          title="Response speed"
          description="Response behavior among contacted leads."
        >
          <Bars
            rows={analysis.engagement.speed.map((row) => ({
              label: row.label,
              value: row.responded,
              detail: pct(row.responseRate),
            }))}
          />
        </Card>

        <Card
          title="First-touch channel"
          description="Observed response performance by first outbound channel."
        >
          <div className="divide-y divide-slate-100">
            {analysis.engagement.channels.map((row) => (
              <div
                key={row.channel}
                className="flex items-center justify-between gap-4 py-3"
              >
                <span className="font-medium capitalize">
                  {row.channel}
                </span>
                <span className="text-sm tabular-nums text-slate-500">
                  {row.contacted} contacted · {pct(row.responseRate)} response
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

export function ProgressionPage({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Appointment evidence"
          value={String(analysis.progression.appointmentEvidence)}
          detail={`${pct(analysis.progression.appointmentRateOfContacted)} of contacted`}
        />
        <Stat
          label="Sold / Closed"
          value={String(analysis.progression.soldClosed)}
          detail={`${pct(analysis.progression.soldClosedRateOfAll)} of all leads`}
        />
        <Stat
          label="Without timeline"
          value={String(analysis.progression.soldClosedWithoutTimeline)}
          detail="Sold / Closed states"
        />
      </div>

      <Card
        title="Outcome populations"
        description="These are independent observed populations, not a reconstructed sequential funnel."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Outcome
            label="Appointment evidence"
            count={analysis.progression.appointmentEvidence}
            rate={pct(analysis.progression.appointmentRateOfContacted)}
            detail="of contacted leads"
          />
          <Outcome
            label="Sold / Closed"
            count={analysis.progression.soldClosed}
            rate={pct(analysis.progression.soldClosedRateOfAll)}
            detail="of all leads"
          />
          <Outcome
            label="Sold / Closed with timeline"
            count={analysis.progression.soldClosedWithTimeline}
            rate="—"
            detail="count only; subset denominator is not calculated"
          />
        </div>
      </Card>

    </>
  );
}

export function SourcesPage({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  return (
    <Card
      title="Source performance"
      description="Compare volume, contact, response, appointment evidence, and observed outcomes by source."
    >
      <SourceTable analysis={analysis} detailed />
    </Card>
  );
}

export function TrendsPage({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  const max = Math.max(...analysis.trends.map((row) => row.leads), 1);

  return (
    <Card
      title="Performance by lead-creation month"
      description="Cohort view. Recent cohorts may be less mature than older cohorts."
    >
      {analysis.trends.length ? (
        <div className="space-y-3">
          {analysis.trends.map((row) => (
            <div key={row.month} className="grid grid-cols-[80px_1fr_260px] items-center gap-4">
              <span className="text-sm font-medium">{row.label}</span>

              <div className="h-8 overflow-hidden rounded bg-slate-100">
                <div
                  className="flex h-full items-center rounded bg-slate-900 px-2 text-xs font-semibold text-white"
                  style={{
                    width: `${Math.max((row.leads / max) * 100, row.leads ? 12 : 0)}%`,
                  }}
                >
                  {row.leads}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 text-right text-xs tabular-nums">
                <span>{pct(row.contactRate)}</span>
                <span>{pct(row.responseRate)}</span>
                <span>{pct(row.appointmentRate)}</span>
                <span>{pct(row.soldClosedRate)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-500">
          No valid creation dates are available.
        </p>
      )}
    </Card>
  );
}

function SourceTable({
  analysis,
  detailed = false,
}: {
  analysis: DashboardAnalysis;
  detailed?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="border-b border-slate-200 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          <tr>
            <th className="pb-3">Source</th>
            <th className="pb-3 text-right">Leads</th>
            <th className="pb-3 text-right">Contact</th>
            <th className="pb-3 text-right">Response</th>
            <th className="pb-3 text-right">Appointment</th>
            <th className="pb-3 text-right">Sold / Closed</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {analysis.sources.map((row) => (
            <tr key={row.source}>
              <td className="py-3">
                <div className="font-medium">{row.source}</div>
                {detailed ? (
                  <div className="text-xs text-slate-400">
                    {row.sourceGroup}
                  </div>
                ) : null}
              </td>
              <td className="py-3 text-right tabular-nums">{row.leads}</td>
              <td className="py-3 text-right tabular-nums">
                {pct(row.contactRate)}
              </td>
              <td className="py-3 text-right tabular-nums">
                {pct(row.responseRate)}
              </td>
              <td className="py-3 text-right tabular-nums">
                {pct(row.appointmentRate)}
              </td>
              <td className="py-3 text-right tabular-nums">
                {pct(row.soldClosedRate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Outcome({
  label,
  count,
  rate,
  detail,
}: {
  label: string;
  count: number;
  rate: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="text-2xl font-semibold tabular-nums">{count}</span>
        <span className="text-xs font-medium text-slate-500">{rate}</span>
      </div>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  );
}
