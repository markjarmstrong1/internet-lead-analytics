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

  const topSoldSources = [...analysis.sources]
    .filter((row) => row.soldClosed > 0)
    .sort(
      (left, right) =>
        right.soldClosed - left.soldClosed ||
        right.soldClosedRate - left.soldClosedRate,
    )
    .slice(0, 8);

  const maxTrend = Math.max(
    ...analysis.trends.map((row) => row.soldClosed),
    1,
  );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Sold / Closed"
          value={String(sold.soldClosed)}
          detail="Current Sold or Closed stage"
        />

        <Stat
          label="Timeline coverage"
          value={pct(sold.timelineCoverageRate)}
          detail={`${sold.timelineCovered} of ${sold.soldClosed} have timeline evidence`}
        />

        <Stat
          label="Recorded contact"
          value={
            sold.soldClosed
              ? pct(sold.contacted / sold.soldClosed)
              : "—"
          }
          detail={`${sold.contacted} have a recorded First Contacted Time`}
        />

        <Stat
          label="Observed responses"
          value={String(sold.responded)}
          detail="Only among Sold / Closed leads with timeline evidence"
        />
      </div>

      <Card
        title="What do Sold / Closed leads have in common?"
        description="The page looks for recurring characteristics inside the observed Sold / Closed population. These are descriptive similarities and associations, not proof that any behavior caused the sale."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Similarity
            label="Contacted"
            value={
              sold.soldClosed
                ? pct(sold.contacted / sold.soldClosed)
                : "—"
            }
            detail={`${sold.contacted} of ${sold.soldClosed} have recorded contact`}
          />

          <Similarity
            label="Median first contact"
            value={minutes(sold.medianFirstContactMinutes)}
            detail="Lead creation → recorded First Contacted Time"
          />

          <Similarity
            label="Median response"
            value={minutes(sold.medianFirstResponseMinutes)}
            detail="Observed first outbound → inbound response"
          />

          <Similarity
            label="Response ≤24h"
            value={pct(sold.responseWithin24hRate)}
            detail={`${sold.respondedWithin24h} observed responses within 24 hours`}
          />
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold">
            Evidence interpretation
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            A Sold / Closed lead is included because its current lead stage
            says Sold or Closed. Timeline-derived behavior is only discussed
            where linked timeline evidence exists. A missing timeline does not
            mean the lead was not contacted or did not respond.
          </p>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card
          title="Where are Sold / Closed leads coming from?"
          description="Sources with observed Sold / Closed outcomes. The rate is Sold / Closed divided by all leads from that source."
        >
          {topSoldSources.length ? (
            <div className="space-y-4">
              {topSoldSources.map((row) => (
                <div
                  key={row.source}
                  className="grid grid-cols-[minmax(0,1fr)_80px_80px] items-center gap-4"
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
          title="Sold / Closed trend"
          description="Sold / Closed counts by the month the lead was created. This is a cohort view, not a sales-date trend."
        >
          {analysis.trends.length ? (
            <div className="space-y-3">
              {analysis.trends.map((row) => (
                <div
                  key={row.month}
                  className="grid grid-cols-[80px_1fr_60px] items-center gap-3"
                >
                  <span className="text-sm font-medium">
                    {row.label}
                  </span>

                  <div className="h-7 overflow-hidden rounded bg-slate-100">
                    <div
                      className="flex h-full min-w-0 items-center rounded bg-slate-900 px-2 text-xs font-semibold text-white"
                      style={{
                        width: row.soldClosed
                          ? `${Math.max(
                              (row.soldClosed / maxTrend) * 100,
                              12,
                            )}%`
                          : "0%",
                      }}
                    >
                      {row.soldClosed || ""}
                    </div>
                  </div>

                  <span className="text-right text-sm tabular-nums">
                    {row.soldClosed}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">
              No valid creation dates are available.
            </p>
          )}
        </Card>
      </div>

      <AnalyticsSoldLeadAnalysis analysis={analysis} />

      <Card
        title="Sold / Closed leads"
        description={`${soldLeads.length} individual leads currently in a Sold or Closed stage.`}
      >
        {soldLeads.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-slate-200 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="pb-3">Lead</th>
                  <th className="pb-3">Source</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3">Contact</th>
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
                        <div>
                          <div>{formatDate(lead.firstContactAt)}</div>
                          <div className="text-xs text-slate-400">
                            {minutes(lead.firstContactMinutes)}
                          </div>
                        </div>
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
    </>
  );
}

function Similarity({
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
  if (!value) {
    return "Unknown";
  }

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
