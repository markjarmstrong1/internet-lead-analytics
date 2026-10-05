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

  return (
    <Card
      title="What happened with Sold / Closed leads?"
      description="Observed timeline behavior for leads currently in Sold or Closed state. Action and template results describe associations in the observed data; they do not establish causation."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label="Average first contact"
          value={minutes(sold.averageFirstContactMinutes)}
          detail="lead creation → first qualifying outbound"
        />

        <Stat
          label="Median first contact"
          value={minutes(sold.medianFirstContactMinutes)}
          detail="lead creation → first qualifying outbound"
        />

        <Stat
          label="Average first response"
          value={minutes(sold.averageFirstResponseMinutes)}
          detail="first outbound → first inbound"
        />

        <Stat
          label="Median first response"
          value={minutes(sold.medianFirstResponseMinutes)}
          detail="first outbound → first inbound"
        />

        <Stat
          label="Response within 24h"
          value={pct(sold.responseWithin24hRate)}
          detail={`${sold.respondedWithin24h} contacted Sold / Closed leads`}
        />

        <Stat
          label="Outbound attempts"
          value={
            sold.averageOutboundBeforeResponse === null
              ? "—"
              : sold.averageOutboundBeforeResponse.toFixed(1)
          }
          detail="average qualifying outbound attempts before an observed response"
        />
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        <ResponseActionTable rows={sold.responseActions} />
        <TemplateTable rows={sold.templates} />
      </div>
    </Card>
  );
}

function ResponseActionTable({
  rows,
}: {
  rows: DashboardAnalysis["soldLeadAnalytics"]["responseActions"];
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
                  <div className="font-medium">
                    {row.action}
                  </div>

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
          No observed responses are available for the current Sold /
          Closed population.
        </p>
      ) : null}
    </div>
  );
}

function TemplateTable({
  rows,
}: {
  rows: DashboardAnalysis["soldLeadAnalytics"]["templates"];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">
        Observed templates / message subjects
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        Explicit template metadata is preferred. Email subjects are
        used only when no explicit template exists. Results describe
        observed template use, not causal performance.
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
          No template identifiers were observed in the current Sold /
          Closed population.
        </p>
      ) : null}
    </div>
  );
}
