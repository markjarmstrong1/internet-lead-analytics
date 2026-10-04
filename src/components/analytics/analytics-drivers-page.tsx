import { SectionPanel } from "@/components/app/section-panel";
import type { DriversAnalysis } from "@/analytics/metrics/drivers";

function percent(
  numerator: number,
  denominator: number,
): string {
  return denominator === 0
    ? "—"
    : `${((numerator / denominator) * 100).toFixed(1)}%`;
}

export function AnalyticsDriversPage({
  analysis,
}: {
  analysis: DriversAnalysis;
}) {
  return (
    <>
      <SectionPanel
        title="What appears to help or hurt performance?"
        description="Drivers are associations in observed data, not causal conclusions."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3 text-right">Leads</th>
                <th className="px-4 py-3 text-right">Timeline</th>
                <th className="px-4 py-3 text-right">Contacted</th>
                <th className="px-4 py-3 text-right">24h response</th>
                <th className="px-4 py-3 text-right">Appt.</th>
                <th className="px-4 py-3 text-right">Sold / Closed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analysis.sources.map((row) => (
                <tr key={row.source}>
                  <td className="max-w-[420px] px-4 py-3 font-medium">
                    {row.source}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.leads}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.timelineCovered}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.contacted}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {percent(
                      row.respondedWithin24h,
                      row.contacted,
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.appointmentEvidence}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.soldClosed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-400">
          Source rows with very small populations are descriptive only.
          Do not use a one-lead source as evidence that the source itself
          performs better or worse.
        </p>
      </SectionPanel>

      <SectionPanel
        title="Outreach effort"
        description="Does the amount of observed outbound effort line up with response?"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Observed outbound attempts</th>
                <th className="px-4 py-3 text-right">Contacted</th>
                <th className="px-4 py-3 text-right">Response rate</th>
                <th className="px-4 py-3 text-right">24h responses</th>
                <th className="px-4 py-3 text-right">Appointments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analysis.outreach.map((row) => (
                <tr key={row.label}>
                  <td className="px-4 py-3 font-medium">
                    {row.label}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.contacted}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.responseRate === null
                      ? "—"
                      : `${(row.responseRate * 100).toFixed(1)}%`}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.respondedWithin24h}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.appointmentEvidence}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>

      <SectionPanel
        title="Process evidence"
        description="Tasks are workflow instructions/state. They are not treated as proof that an action occurred."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Leads with task evidence", analysis.process.taskLeads],
            ["Observed task events", analysis.process.taskEvents],
            [
              "Task events followed by outbound within 24h",
              analysis.process.taskEventsFollowedByOutbound24h,
            ],
            [
              "No observed outbound within 24h",
              analysis.process.taskEventsWithoutObservedOutbound24h,
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {label}
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {value}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-600">
          The process analysis intentionally measures observed events around
          tasks rather than inventing task completion. A task followed by
          an outbound communication is evidence of observed sequence, not
          proof that the task itself caused the communication.
        </p>
      </SectionPanel>
    </>
  );
}
