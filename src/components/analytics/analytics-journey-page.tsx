import { SectionPanel } from "@/components/app/section-panel";
import type { JourneyAnalysis } from "@/analytics/metrics/journey";

export function AnalyticsJourneyPage({
  analysis,
}: {
  analysis: JourneyAnalysis;
}) {
  return (
    <>
      <SectionPanel
        title="What happens to a lead?"
        description="Current CRM stage is shown alongside observed timeline behavior. Stage itself is not treated as customer behavior."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3 text-right">Leads</th>
                <th className="px-4 py-3 text-right">Timeline</th>
                <th className="px-4 py-3 text-right">Contacted</th>
                <th className="px-4 py-3 text-right">Responded</th>
                <th className="px-4 py-3 text-right">Appt. evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analysis.rows.map((row) => (
                <tr key={row.stage}>
                  <td className="px-4 py-3 font-medium">
                    {row.stage}
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
                    {row.responded}
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
        title="Observed journey populations"
        description="These populations overlap; they are not a guaranteed sequential funnel."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Timeline-covered", analysis.timelineLeads],
            ["Observed contacted", analysis.contactedLeads],
            ["Observed responded", analysis.respondedLeads],
            ["Appointment evidence", analysis.appointmentEvidenceLeads],
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
      </SectionPanel>

      <SectionPanel
        title="Interpretation"
        description="The canonical timeline is the backbone for observed behavior."
      >
        <p className="max-w-4xl text-sm leading-7 text-slate-600">
          A lead can move through CRM stages without having corresponding
          behavioral evidence in the imported timeline. This view therefore
          keeps stage progression and observed behavior side by side rather
          than pretending they are the same thing.
        </p>
      </SectionPanel>
    </>
  );
}
