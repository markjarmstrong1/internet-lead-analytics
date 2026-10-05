import { SectionPanel } from "@/components/app/section-panel";
import type { DashboardAnalysis } from "@/analytics/metrics/dashboard";

function minutes(value: number | null) {
  if (value === null) return "—";
  if (value < 60) return `${value.toFixed(1)}m`;
  return `${(value / 60).toFixed(1)}h`;
}

export function AnalyticsInvestigationSection({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  return (
    <SectionPanel
      title="Investigation"
      description="The filtered lead population behind the summary. Use this to inspect the records contributing to observed results."
    >
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[1150px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">Lead</th>
              <th className="px-3 py-3">Source</th>
              <th className="px-3 py-3">Stage</th>
              <th className="px-3 py-3">Timeline</th>
              <th className="px-3 py-3">First contact</th>
              <th className="px-3 py-3">Response</th>
              <th className="px-3 py-3">Appointment</th>
              <th className="px-3 py-3">Sold/Closed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {analysis.investigation.map((row) => (
              <tr key={row.leadId}>
                <td className="px-3 py-3">
                  <div className="font-medium">{row.contactName}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {row.leadId}
                  </div>
                </td>
                <td className="px-3 py-3">{row.source}</td>
                <td className="px-3 py-3">{row.stage}</td>
                <td className="px-3 py-3">
                  {row.timelineCovered ? "Covered" : "No timeline"}
                </td>
                <td className="px-3 py-3">
                  {row.firstContactAt
                    ? `${new Date(row.firstContactAt).toLocaleDateString()} · ${minutes(
                        row.firstContactMinutes,
                      )}`
                    : "Not observed"}
                </td>
                <td className="px-3 py-3">
                  {row.responseAt
                    ? minutes(row.responseMinutes)
                    : "No observed response"}
                </td>
                <td className="px-3 py-3">
                  {row.appointmentEvidence ? "Evidence" : "—"}
                </td>
                <td className="px-3 py-3">
                  {row.soldClosed ? "Yes" : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {analysis.investigation.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No leads match the current population.
        </p>
      ) : null}

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Investigation is intentionally tied to the active population. There
        is no arbitrary 75-row cutoff, so the table represents the complete
        filtered set.
      </p>
    </SectionPanel>
  );
}
