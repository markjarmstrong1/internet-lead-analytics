import type { DashboardAnalysis } from "@/analytics/metrics/dashboard";
import {
  Card,
  minutes,
  pct,
  Stat,
} from "./analytics-section-page";

export function AnalyticsSoldLeadAnalysis({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  const sold = analysis.soldLeadAnalytics;
  const hasTimelineEvidence = sold.timelineCovered > 0;

  return (
    <Card
      title="What happened with Sold / Closed leads?"
      description="Observed timeline behavior for leads currently in Sold or Closed state. Action and template results describe associations in the observed data; they do not establish causation."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label="Timeline evidence"
          value={`${sold.timelineCovered} / ${sold.soldClosed}`}
          detail="Sold / Closed leads with linked timeline records"
        />

        <Stat
          label="Average first contact"
          value={
            hasTimelineEvidence
              ? minutes(sold.averageFirstContactMinutes)
              : "—"
          }
          detail="lead creation → first qualifying outbound"
        />

        <Stat
          label="Median first contact"
          value={
            hasTimelineEvidence
              ? minutes(sold.medianFirstContactMinutes)
              : "—"
          }
          detail="lead creation → first qualifying outbound"
        />

        <Stat
          label="Average first response"
          value={
            hasTimelineEvidence
              ? minutes(sold.averageFirstResponseMinutes)
              : "—"
          }
          detail="first outbound → first inbound"
        />

        <Stat
          label="Median first response"
          value={
            hasTimelineEvidence
              ? minutes(sold.medianFirstResponseMinutes)
              : "—"
          }
          detail="first outbound → first inbound"
        />

        <Stat
          label="Response within 24h"
          value={
            hasTimelineEvidence
              ? pct(sold.responseWithin24hRate)
              : "—"
          }
          detail={
            hasTimelineEvidence
              ? `${sold.respondedWithin24h} contacted Sold / Closed leads`
              : "No communication evidence available"
          }
        />

        <Stat
          label="Outbound attempts"
          value={
            hasTimelineEvidence &&
            sold.averageOutboundBeforeResponse !== null
              ? sold.averageOutboundBeforeResponse.toFixed(1)
              : "—"
          }
          detail="average qualifying outbound attempts before an observed response"
        />
      </div>

      {!hasTimelineEvidence ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="font-semibold">
            No timeline evidence is available for the current Sold / Closed
            population.
          </div>
          <p className="mt-1 leading-6">
            Communication behavior, response speed, outbound actions, and
            message/template associations cannot be evaluated for these leads
            from the current dataset. The Sold / Closed state is observed from
            the lead record, but there are no linked timeline records to
            reconstruct what happened.
          </p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        <ResponseActionTable
          rows={sold.responseActions}
          hasTimelineEvidence={hasTimelineEvidence}
        />
        <TemplateTable
          rows={sold.templates}
          hasTimelineEvidence={hasTimelineEvidence}
        />
      </div>
    </Card>
  );
}

function ResponseActionTable({
  rows,
  hasTimelineEvidence,
}: {
  rows: DashboardAnalysis["soldLeadAnalytics"]["responseActions"];
  hasTimelineEvidence: boolean;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">
        Action preceding the observed first response
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        The last qualifying outbound action at or before the first
        observed inbound response timestamp.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-slate-200 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <tr>
              <th className="pb-3">Action</th>
              <th className="pb-3 text-right">Responses</th>
              <th className="pb-3 text-right">Avg response</th>
              <th className="pb-3 text-right">Median</th>
              <th className="pb-3 text-right">Appointment</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={`${row.action}-${row.channel ?? "none"}`}>
                <td className="py-3">
                  <div className="font-medium">{row.action}</div>

                  {row.channel ? (
                    <div className="text-xs capitalize text-slate-400">
                      {row.channel}
                    </div>
                  ) : null}
                </td>

                <td className="py-3 text-right tabular-nums">
                  {row.responses}
                </td>

                <td className="py-3 text-right tabular-nums">
                  {minutes(row.averageResponseMinutes)}
                </td>

                <td className="py-3 text-right tabular-nums">
                  {minutes(row.medianResponseMinutes)}
                </td>

                <td className="py-3 text-right tabular-nums">
                  {pct(row.appointmentRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!rows.length ? (
        <p className="mt-4 text-sm text-slate-500">
          {hasTimelineEvidence
            ? "No observed responses are available for the current Sold / Closed population."
            : "No action-level response evidence is available because the current Sold / Closed population has no linked timeline records."}
        </p>
      ) : null}
    </div>
  );
}

function TemplateTable({
  rows,
  hasTimelineEvidence,
}: {
  rows: DashboardAnalysis["soldLeadAnalytics"]["templates"];
  hasTimelineEvidence: boolean;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">
        Observed templates / message subjects
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        Explicit template metadata is preferred. Email subjects are used only
        when no explicit template exists. Results describe observed template
        use, not causal performance.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-slate-200 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <tr>
              <th className="pb-3">Template / subject</th>
              <th className="pb-3 text-right">Uses</th>
              <th className="pb-3 text-right">Leads</th>
              <th className="pb-3 text-right">Response</th>
              <th className="pb-3 text-right">Avg response</th>
              <th className="pb-3 text-right">Appointment</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={`${row.templateSource}-${row.template}`}>
                <td className="max-w-[260px] py-3">
                  <div className="truncate font-medium">
                    {row.template}
                  </div>

                  <div className="text-xs text-slate-400">
                    {row.templateSource === "explicit"
                      ? "Explicit template"
                      : "Email subject"}
                  </div>
                </td>

                <td className="py-3 text-right tabular-nums">
                  {row.uses}
                </td>

                <td className="py-3 text-right tabular-nums">
                  {row.leads}
                </td>

                <td className="py-3 text-right tabular-nums">
                  {pct(row.responseRate)}
                </td>

                <td className="py-3 text-right tabular-nums">
                  {minutes(row.averageResponseMinutes)}
                </td>

                <td className="py-3 text-right tabular-nums">
                  {pct(row.appointmentRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!rows.length ? (
        <p className="mt-4 text-sm text-slate-500">
          {hasTimelineEvidence
            ? "No template identifiers were observed in the current Sold / Closed population."
            : "No template or message-subject evidence is available because the current Sold / Closed population has no linked timeline records."}
        </p>
      ) : null}
    </div>
  );
}