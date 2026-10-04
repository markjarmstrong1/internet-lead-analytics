import { SectionPanel } from "@/components/app/section-panel";
import type { EngagementAnalysis } from "@/analytics/metrics/engagement";

function percent(
  value: number | null,
): string {
  return value === null
    ? "—"
    : `${(value * 100).toFixed(1)}%`;
}

function cell(
  numerator: number,
  denominator: number,
): string {
  if (denominator === 0) {
    return "—";
  }

  return `${numerator} / ${denominator} (${(
    (numerator / denominator) *
    100
  ).toFixed(1)}%)`;
}

export function AnalyticsEngagementPage({
  analysis,
}: {
  analysis: EngagementAnalysis;
}) {
  return (
    <>
      <SectionPanel
        title="Are customers responding to what we do?"
        description="Response is defined as the first observed inbound communication after the first qualifying employee outbound communication."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Contacted", analysis.contacted],
            ["Responded", analysis.responded],
            ["Responded within 24h", analysis.respondedWithin24h],
            ["Response rate", percent(analysis.responseRate)],
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
        title="First-touch channel performance"
        description="Small populations should not be treated as reliable rankings."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3 text-right">Contacted</th>
                <th className="px-4 py-3 text-right">Responded</th>
                <th className="px-4 py-3 text-right">Response</th>
                <th className="px-4 py-3 text-right">Within 24h</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analysis.channels.map((row) => (
                <tr key={row.channel}>
                  <td className="px-4 py-3 font-medium capitalize">
                    {row.channel}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.contacted}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.responded}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {percent(row.responseRate)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {percent(row.responseWithin24hRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>

      <SectionPanel
        title="Response-speed distribution"
        description="Mutually exclusive buckets show where responses actually fall."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Response speed</th>
                <th className="px-4 py-3 text-right">Leads</th>
                <th className="px-4 py-3 text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analysis.speed.map((row) => (
                <tr key={row.key}>
                  <td className="px-4 py-3 font-medium">
                    {row.label}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.count}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {percent(row.rate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>

      <SectionPanel
        title="Do fast responses line up with appointments or sales?"
        description="Associational analysis only. A fast response does not prove that the initial contact caused the outcome."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Response speed</th>
                <th className="px-4 py-3 text-right">Appointment evidence</th>
                <th className="px-4 py-3 text-right">Sold / Closed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analysis.appointmentSpeed.map((row, index) => {
                const sales = analysis.soldClosedSpeed[index];

                return (
                  <tr key={row.key}>
                    <td className="px-4 py-3 font-medium">
                      {row.label}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {cell(
                        row.numerator,
                        row.denominator,
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {analysis.soldClosedWithTimeline === 0
                        ? "Insufficient evidence"
                        : cell(
                            sales?.numerator ?? 0,
                            sales?.denominator ?? 0,
                          )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold">
              Appointment evidence
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {analysis.appointmentEvidenceLeads} leads currently have
              valid observed appointment evidence. Canceled and no-show
              appointments remain appointment evidence because they are
              not the same as an explicitly deleted appointment.
            </p>
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <p className="text-sm font-semibold">
              Sales evidence gap
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {analysis.soldClosedWithoutTimeline} current Sold / Closed
              leads have no linked timeline record. Their outcome is known,
              but initial-contact response speed is unknown.
            </p>
          </div>
        </div>
      </SectionPanel>
    </>
  );
}
