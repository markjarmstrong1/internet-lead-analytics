import type { DashboardAnalysis } from "@/analytics/metrics/dashboard";
import {
  Card,
  minutes,
  pct,
} from "./analytics-section-page";

export function FirstResponseAnalysisCard({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  const firstResponse =
    analysis.engagement.firstResponse;

  return (
    <Card
      title="First response analysis"
      description="What happens after we contact a lead: whether they respond, how quickly, which channel they use, and which outbound action immediately preceded the response."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Response rate"
          value={pct(
            firstResponse.responseRate,
          )}
          detail={`${firstResponse.responded} responses`}
        />

        <Metric
          label="No observed response"
          value={String(
            firstResponse.noResponse,
          )}
          detail={`${firstResponse.eligible} leads with observed outbound`}
        />

        <Metric
          label="Median first response"
          value={minutes(
            firstResponse.medianMinutes,
          )}
        />

        <Metric
          label="Response ≤24h"
          value={pct(
            firstResponse.responseWithin24hRate,
          )}
          detail={`${firstResponse.respondedWithin24h} leads`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold">
            Response speed
          </h3>

          <p className="mt-1 text-xs text-[var(--muted)]">
            Distribution of first observed customer responses.
          </p>

          <div className="mt-4 space-y-3">
            {firstResponse.speed.map(
              (row) => (
                <div key={row.key}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium">
                      {row.label}
                    </span>

                    <span className="tabular-nums text-[var(--muted)]">
                      {row.responded} · {pct(row.rate)}
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{
                        width: `${Math.max(
                          Math.min(
                            (row.rate ?? 0) * 100,
                            100,
                          ),
                          row.responded ? 2 : 0,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold">
            First response channel
          </h3>

          <p className="mt-1 text-xs text-[var(--muted)]">
            The communication channel of the customer&apos;s first observed inbound.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="border-b border-[var(--border)] text-left text-[10px] font-semibold uppercase tracking-[0.11em] text-[var(--muted)]">
                <tr>
                  <th className="pb-3">Channel</th>
                  <th className="pb-3 text-right">Responses</th>
                  <th className="pb-3 text-right">Rate</th>
                  <th className="pb-3 text-right">Median</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {firstResponse.channels.map(
                  (row) => (
                    <tr key={row.channel}>
                      <td className="py-3 font-medium capitalize">
                        {row.channel}
                      </td>
                      <td className="py-3 text-right tabular-nums">
                        {row.responses}
                      </td>
                      <td className="py-3 text-right tabular-nums">
                        {pct(row.responseRate)}
                      </td>
                      <td className="py-3 text-right tabular-nums">
                        {minutes(row.medianMinutes)}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold">
          Action immediately before response
        </h3>

        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
          This is an observed association. It does not prove that the action caused the response.
        </p>

        {firstResponse.actions.length === 0 ? (
          <div className="mt-4 rounded-lg bg-[var(--surface-muted)] p-4 text-sm text-[var(--muted)]">
            No qualifying outbound action can currently be associated with an observed response.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead className="border-b border-[var(--border)] text-left text-[10px] font-semibold uppercase tracking-[0.11em] text-[var(--muted)]">
                <tr>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Channel</th>
                  <th className="pb-3 text-right">Responses</th>
                  <th className="pb-3 text-right">Median response</th>
                  <th className="pb-3 text-right">Appointment</th>
                  <th className="pb-3 text-right">Sold / Closed</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {firstResponse.actions.map(
                  (row) => (
                    <tr
                      key={`${row.action}-${row.channel ?? "none"}`}
                    >
                      <td className="py-3 font-medium">
                        {row.action}
                      </td>
                      <td className="py-3 capitalize">
                        {row.channel ?? "—"}
                      </td>
                      <td className="py-3 text-right tabular-nums">
                        {row.responses}
                      </td>
                      <td className="py-3 text-right tabular-nums">
                        {minutes(row.medianMinutes)}
                      </td>
                      <td className="py-3 text-right tabular-nums">
                        {row.appointmentEvidence} · {pct(row.appointmentRate)}
                      </td>
                      <td className="py-3 text-right tabular-nums">
                        {row.soldClosed} · {pct(row.soldClosedRate)}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
      <p className="text-xs font-medium text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold tabular-nums">
        {value}
      </p>

      {detail ? (
        <p className="mt-1 text-xs text-[var(--muted)]">
          {detail}
        </p>
      ) : null}
    </div>
  );
}
