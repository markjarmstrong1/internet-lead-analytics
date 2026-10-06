import type { DashboardAnalysis } from "@/analytics/metrics/dashboard";

import {
  Card,
  minutes,
  pct,
  Stat,
} from "./analytics-section-page";
import { AnalyticsSoldLeadAnalysis } from "./analytics-sold-lead-analysis";

export function AnalyticsSoldPage({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  const sold = analysis.soldLeadAnalytics;

  const soldLeads = analysis.investigation.filter(
    (lead) => lead.soldClosed,
  );

  const soldSources = [...analysis.sources]
    .filter((row) => row.soldClosed > 0)
    .sort(
      (left, right) =>
        right.soldClosed - left.soldClosed ||
        (right.soldClosedRate ?? 0) -
          (left.soldClosedRate ?? 0),
    );

  const maxSoldTrend = Math.max(
    ...analysis.trends.map((row) => row.soldClosed),
    1,
  );

  const contactedRate =
    sold.soldClosed > 0
      ? sold.contacted / sold.soldClosed
      : null;

  const timelineRate =
    sold.soldClosed > 0
      ? sold.timelineCovered / sold.soldClosed
      : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Sold / Closed"
          value={String(sold.soldClosed)}
          detail="Current observed lead state"
        />

        <Stat
          label="Timeline coverage"
          value={pct(timelineRate)}
          detail={`${sold.timelineCovered} of ${sold.soldClosed} have timeline evidence`}
        />

        <Stat
          label="Recorded contact"
          value={pct(contactedRate)}
          detail={`${sold.contacted} have First Contacted Time`}
        />

        <Stat
          label="Observed response"
          value={String(sold.responded)}
          detail="Among contacted leads with timeline evidence"
        />
      </div>

      <Card
        title="What do Sold / Closed leads have in common?"
        description="These are characteristics observed inside the Sold / Closed population. They describe associations in the available data; they do not establish that any characteristic caused a sale."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Insight
            label="First contact"
            value={minutes(sold.medianFirstContactMinutes)}
            detail="Median lead creation → First Contacted Time"
          />

          <Insight
            label="First response"
            value={minutes(sold.medianFirstResponseMinutes)}
            detail="Median observed outbound → inbound response"
          />

          <Insight
            label="Response ≤24h"
            value={pct(sold.responseWithin24hRate)}
            detail={`${sold.respondedWithin24h} observed responses within 24 hours`}
          />

          <Insight
            label="Outbound before response"
            value={
              sold.averageOutboundBeforeResponse === null
                ? "—"
                : sold.averageOutboundBeforeResponse.toFixed(1)
            }
            detail="Average qualifying outbound attempts"
          />
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold">
            How to read this
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Sold / Closed is an observed current lead state. Contact
            comes from First Contacted Time in the lead export.
            Response behavior requires linked timeline evidence.
            Therefore, a Sold / Closed lead without a timeline is not
            treated as a non-responder.
          </p>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card
          title="Where do Sold / Closed leads come from?"
          description="Sources ranked by the number of observed Sold / Closed leads."
        >
          {soldSources.length ? (
            <div className="space-y-4">
              {soldSources.map((row) => (
                <div
                  key={row.source}
                  className="grid grid-cols-[minmax(0,1fr)_70px_80px] items-center gap-4"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {row.source}
                    </div>
                    <div className="text-xs text-slate-400">
                      {row.sourceGroup}
                    </div>
                  </div>

                  <div className="text-right text-sm tabular-nums">
                    {row.soldClosed}
                  </div>

                  <div className="text-right text-sm tabular-nums text-slate-500">
                    {pct(row.soldClosedRate)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">
              No Sold / Closed source observations are available.
            </p>
          )}
        </Card>

        <Card
          title="Sold / Closed cohort trend"
          description="Sold / Closed count by the month the lead was created. This is a cohort view, not a sales-date trend."
        >
          {analysis.trends.length ? (
            <div className="space-y-3">
              {analysis.trends.map((row) => {
                const width = row.soldClosed
                  ? Math.max(
                      (row.soldClosed / maxSoldTrend) * 100,
                      10,
                    )
                  : 0;

                return (
                  <div
                    key={row.month}
                    className="grid grid-cols-[80px_minmax(0,1fr)_50px] items-center gap-3"
                  >
                    <span className="text-sm font-medium">
                      {row.label}
                    </span>

                    <div className="h-7 overflow-hidden rounded bg-slate-100">
                      {row.soldClosed > 0 ? (
                        <div
                          className="flex h-full items-center rounded bg-slate-900 px-2 text-xs font-semibold text-white"
                          style={{ width: `${width}%` }}
                        >
                          {row.soldClosed}
                        </div>
                      ) : null}
                    </div>

                    <span className="text-right text-sm tabular-nums">
                      {row.soldClosed}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">
              No valid lead creation dates are available.
            </p>
          )}
        </Card>
      </div>

      <AnalyticsSoldLeadAnalysis analysis={analysis} />

      <Card
        title="Sold / Closed leads"
        description={`${soldLeads.length} individual leads currently classified as Sold or Closed.`}
      >
        {soldLeads.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-sm">
              <thead className="border-b border-slate-200 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="pb-3">Lead</th>
                  <th className="pb-3">Source</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3">First Contact</th>
                  <th className="pb-3">Response</th>
                  <th className="pb-3">Appointment</th>
                  <th className="pb-3">Timeline</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {soldLeads.map((lead) => (
                  <tr key={lead.leadId}>
                    <td className="py-3">
                      <div className="font-medium">
                        {lead.contactName}
                      </div>
                      <div className="text-xs text-slate-400">
                        {lead.leadId}
                      </div>
                    </td>

                    <td className="py-3">
                      <div>{lead.source}</div>
                      <div className="text-xs text-slate-400">
                        {lead.sourceGroup}
                      </div>
                    </td>

                    <td className="py-3 text-slate-500">
                      {formatDate(lead.createdAt)}
                    </td>

                    <td className="py-3">
                      {lead.firstContactAt ? (
                        <>
                          <div>
                            {formatDate(lead.firstContactAt)}
                          </div>
                          <div className="text-xs text-slate-400">
                            {minutes(lead.firstContactMinutes)}
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-400">
                          Unknown
                        </span>
                      )}
                    </td>

                    <td className="py-3">
                      {lead.responseMinutes !== null
                        ? minutes(lead.responseMinutes)
                        : lead.timelineCovered
                          ? "No observed response"
                          : "Unknown"}
                    </td>

                    <td className="py-3">
                      {lead.appointmentEvidence
                        ? "Evidence"
                        : "—"}
                    </td>

                    <td className="py-3">
                      {lead.timelineCovered
                        ? "Covered"
                        : "Not available"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">
            No Sold / Closed leads are present in the selected population.
          </p>
        )}
      </Card>
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
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
