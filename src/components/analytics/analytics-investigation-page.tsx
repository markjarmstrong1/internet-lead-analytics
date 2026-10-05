import type { DashboardAnalysis } from "@/analytics/metrics/dashboard";
import { Card, minutes } from "./analytics-section-page";

export function AnalyticsInvestigationPage({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  const rows = analysis.investigation;

  return (
    <Card
      title="Lead investigation"
      description="Start with the individual leads behind the aggregate metrics."
    >
      <div className="grid gap-3 border-b border-slate-200 pb-5 sm:grid-cols-2 xl:grid-cols-4">
        <Queue
          label="Not contacted"
          count={rows.filter((r) => !r.firstContactAt).length}
        />
        <Queue
          label="No response"
          count={rows.filter((r) => r.firstContactAt && !r.responseAt).length}
        />
        <Queue
          label="Appointment evidence"
          count={rows.filter((r) => r.appointmentEvidence).length}
        />
        <Queue
          label="Sold / Closed"
          count={rows.filter((r) => r.soldClosed).length}
        />
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[950px] text-sm">
          <thead className="border-b border-slate-200 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <tr>
              <th className="pb-3">Lead</th>
              <th className="pb-3">Source</th>
              <th className="pb-3">Stage</th>
              <th className="pb-3">First contact</th>
              <th className="pb-3">Response</th>
              <th className="pb-3">Evidence</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.leadId} className="hover:bg-slate-50">
                <td className="py-3">
                  <div className="font-medium">{row.contactName}</div>
                  <div className="text-[10px] text-slate-400">{row.leadId}</div>
                </td>
                <td className="py-3">{row.source}</td>
                <td className="py-3">{row.stage}</td>
                <td className="py-3">
                  {row.firstContactAt
                    ? minutes(row.firstContactMinutes)
                    : "Not observed"}
                </td>
                <td className="py-3">
                  {row.responseAt
                    ? minutes(row.responseMinutes)
                    : "No response"}
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {row.appointmentEvidence ? <Tag>Appointment</Tag> : null}
                    {row.soldClosed ? <Tag>Sold/Closed</Tag> : null}
                    {!row.timelineCovered ? (
                      <Tag muted>No timeline</Tag>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!rows.length ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No leads match the current filters.
        </p>
      ) : null}
    </Card>
  );
}

function Queue({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{count}</p>
    </div>
  );
}

function Tag({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <span
      className={
        muted
          ? "rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500"
          : "rounded-full bg-slate-950 px-2 py-0.5 text-[10px] text-white"
      }
    >
      {children}
    </span>
  );
}
