import Link from "next/link";

import { SectionPanel } from "@/components/app/section-panel";
import type { InvestigationRow } from "@/analytics/metrics/investigation";

function responseLabel(
  minutes: number | null,
): string {
  if (minutes === null) {
    return "No observed response";
  }

  if (minutes < 60) {
    return `${minutes.toFixed(1)} min`;
  }

  return `${(minutes / 60).toFixed(1)} hr`;
}

export function AnalyticsInvestigationPage({
  rows,
}: {
  rows: InvestigationRow[];
}) {
  return (
    <SectionPanel
      title="Show me why"
      description="Start with the contacted-lead population, then trace the observed first contact and response back to their source event."
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1250px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">First contact</th>
              <th className="px-4 py-3">Response</th>
              <th className="px-4 py-3">Outcome evidence</th>
              <th className="px-4 py-3">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.leadId}>
                <td className="px-4 py-4 align-top">
                  <Link
                    href={`/leads/${row.leadId}`}
                    className="font-medium text-slate-950 hover:underline"
                  >
                    {row.contactName}
                  </Link>
                  <p className="mt-1 text-xs text-slate-400">
                    {row.stage}
                  </p>
                </td>
                <td className="max-w-[260px] px-4 py-4 align-top">
                  {row.source}
                </td>
                <td className="px-4 py-4 align-top">
                  <p className="font-medium capitalize">
                    {row.firstOutboundChannel ?? "Unknown"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {row.firstOutboundAt
                      ? new Date(
                          row.firstOutboundAt,
                        ).toLocaleString()
                      : "—"}
                  </p>
                </td>
                <td className="px-4 py-4 align-top">
                  <p className="font-medium">
                    {responseLabel(
                      row.responseMinutes,
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {row.responseAt
                      ? new Date(
                          row.responseAt,
                        ).toLocaleString()
                      : "No inbound event"}
                  </p>
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="space-y-1 text-xs">
                    <p>
                      Appointment:{" "}
                      <span className="font-medium">
                        {row.appointmentEvidence
                          ? "Observed"
                          : "No evidence"}
                      </span>
                    </p>
                    <p>
                      Sold / Closed:{" "}
                      <span className="font-medium">
                        {row.soldClosed
                          ? "Stage evidence"
                          : "No"}
                      </span>
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4 align-top">
                  <p className="font-mono text-[11px] text-slate-500">
                    {row.firstOutboundEventId ??
                      "—"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {row.firstOutboundSource ??
                      "Unknown source"}
                  </p>
                  {row.responseEventId ? (
                    <p className="mt-2 font-mono text-[11px] text-slate-500">
                      {row.responseEventId}
                    </p>
                  ) : null}
                  {row.responseSource ? (
                    <p className="mt-1 text-xs text-slate-400">
                      {row.responseSource}
                    </p>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">
          No qualifying first-contact evidence is currently available.
        </div>
      ) : null}
    </SectionPanel>
  );
}
