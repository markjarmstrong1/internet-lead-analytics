import type { DashboardAnalysis } from "@/analytics/metrics/dashboard";

function minutes(value: number | null) {
  if (value === null) {
    return "—";
  }

  return value < 60
    ? `${value.toFixed(0)}m`
    : `${(value / 60).toFixed(1)}h`;
}

export function AnalyticsInvestigation({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  const uncontacted = analysis.investigation.filter(
    (row) => !row.firstContactAt,
  );

  const noResponse = analysis.investigation.filter(
    (row) => row.firstContactAt && !row.responseAt,
  );

  const appointments = analysis.investigation.filter(
    (row) => row.appointmentEvidence,
  );

  const outcomes = analysis.investigation.filter(
    (row) => row.soldClosed,
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold">
              Investigate the numbers
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Start with the lead populations most likely to explain the
              headline results.
            </p>
          </div>

          <span className="text-xs text-slate-400">
            {analysis.investigation.length} leads in population
          </span>
        </div>
      </div>

      <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 xl:grid-cols-4">
        <Queue
          label="Not contacted"
          count={uncontacted.length}
          detail="No qualifying outbound observed"
        />

        <Queue
          label="No response"
          count={noResponse.length}
          detail="Contacted, no inbound observed"
        />

        <Queue
          label="Appointment evidence"
          count={appointments.length}
          detail="Qualifying appointment signal"
        />

        <Queue
          label="Sold / Closed"
          count={outcomes.length}
          detail="Current observed state"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="bg-slate-50 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-3">Lead</th>
              <th className="px-3 py-3">Source</th>
              <th className="px-3 py-3">Stage</th>
              <th className="px-3 py-3">Contact</th>
              <th className="px-3 py-3">Response</th>
              <th className="px-3 py-3">Evidence</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {analysis.investigation
              .slice(0, 40)
              .map((row) => (
                <tr
                  key={row.leadId}
                  className="hover:bg-slate-50"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium">
                      {row.contactName}
                    </div>

                    <div className="mt-0.5 text-[10px] text-slate-400">
                      {row.leadId}
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    {row.source}
                  </td>

                  <td className="px-3 py-3">
                    {row.stage}
                  </td>

                  <td className="px-3 py-3">
                    {row.firstContactAt ? (
                      minutes(row.firstContactMinutes)
                    ) : (
                      <span className="text-slate-400">
                        Not observed
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    {row.responseAt ? (
                      minutes(row.responseMinutes)
                    ) : (
                      <span className="text-slate-400">
                        No response
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {row.appointmentEvidence ? (
                        <Tag>Appointment</Tag>
                      ) : null}

                      {row.soldClosed ? (
                        <Tag>Sold/Closed</Tag>
                      ) : null}

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

      {analysis.investigation.length > 40 ? (
        <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-400">
          Showing the 40 highest-priority rows. Use Reports for a complete
          exportable population.
        </div>
      ) : null}
    </section>
  );
}

function Queue({
  label,
  count,
  detail,
}: {
  label: string;
  count: number;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {count}
      </p>

      <p className="mt-1 text-[11px] text-slate-400">
        {detail}
      </p>
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
          : "rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-medium text-white"
      }
    >
      {children}
    </span>
  );
}
