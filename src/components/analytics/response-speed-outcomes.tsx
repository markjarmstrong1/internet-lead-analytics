import type {
  ResponseSpeedOutcomeSummary,
  ResponseSpeedOutcomesMetric,
} from "@/analytics/metrics/response-speed-outcomes";
import { SectionPanel } from "@/components/app/section-panel";

type ResponseSpeedOutcomesProps = {
  metric: ResponseSpeedOutcomesMetric;
};

function formatCell(
  numerator: number,
  denominator: number,
): string {
  if (denominator === 0) {
    return "—";
  }

  return `${numerator} / ${denominator}`;
}

function formatPercent(
  numerator: number,
  denominator: number,
): string {
  if (denominator === 0) {
    return "—";
  }

  return `${Math.round((numerator / denominator) * 100)}%`;
}

function OutcomeSummary({
  title,
  description,
  summary,
}: {
  title: string;
  description: string;
  summary: ResponseSpeedOutcomeSummary;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">
        {summary.evidenceLeads}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-400">
            Initial contact observed
          </p>
          <p className="mt-1 font-semibold text-slate-800">
            {summary.withInitialContact}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-400">
            Any inbound response
          </p>
          <p className="mt-1 font-semibold text-slate-800">
            {summary.responded}
          </p>
        </div>
      </div>
    </div>
  );
}

function SpeedTable({
  appointments,
  soldClosed,
}: {
  appointments: ResponseSpeedOutcomeSummary;
  soldClosed: ResponseSpeedOutcomeSummary;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[700px] text-sm">
        <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
          <tr>
            <th className="px-5 py-3">Response speed</th>
            <th className="px-5 py-3 text-right">
              Appointment evidence
            </th>
            <th className="px-5 py-3 text-right">
              Sold / Closed stage
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {appointments.buckets.map((bucket, index) => {
            const salesBucket = soldClosed.buckets[index];

            return (
              <tr key={bucket.key}>
                <td className="px-5 py-3 font-medium text-slate-700">
                  {bucket.label}
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="font-medium text-slate-800">
                    {formatCell(
                      bucket.numerator,
                      bucket.denominator,
                    )}
                  </span>
                  <span className="ml-2 text-xs text-slate-400">
                    {formatPercent(
                      bucket.numerator,
                      bucket.denominator,
                    )}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="font-medium text-slate-800">
                    {formatCell(
                      salesBucket.numerator,
                      salesBucket.denominator,
                    )}
                  </span>
                  <span className="ml-2 text-xs text-slate-400">
                    {formatPercent(
                      salesBucket.numerator,
                      salesBucket.denominator,
                    )}
                  </span>
                </td>
              </tr>
            );
          })}

          <tr>
            <td className="px-5 py-3 font-medium text-slate-700">
              No observed inbound response
            </td>
            <td className="px-5 py-3 text-right text-slate-600">
              {formatCell(
                appointments.noResponse,
                appointments.withInitialContact,
              )}
            </td>
            <td className="px-5 py-3 text-right text-slate-600">
              {formatCell(
                soldClosed.noResponse,
                soldClosed.withInitialContact,
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function ResponseSpeedOutcomes({
  metric,
}: ResponseSpeedOutcomesProps) {
  return (
    <SectionPanel
      title="Do fast responses line up with appointments or sales?"
      description="This is an observational comparison of response speed after the first qualifying employee contact."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <OutcomeSummary
          title="Appointment evidence"
          description="Leads with observed Appt. Created stage evidence, excluding explicitly deleted appointments."
          summary={metric.appointments}
        />

        <OutcomeSummary
          title="Sold / Closed stage"
          description="Leads currently classified as Sold or Closed. This is stage evidence, not a populated sales record."
          summary={metric.soldClosed}
        />
      </div>

      <div className="mt-6">
        <SpeedTable
          appointments={metric.appointments}
          soldClosed={metric.soldClosed}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-800">
            What the current evidence says
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {metric.appointments.evidenceLeads > 0
              ? `${metric.appointments.buckets[0].numerator} of ${metric.appointments.evidenceLeads} appointment-evidence leads responded within 5 minutes, and ${metric.appointments.buckets[2].numerator} responded within 1 hour.`
              : "No appointment evidence is currently available."}
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5">
          <p className="text-sm font-semibold text-slate-800">
            Sales evidence gap
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {metric.soldClosedWithoutTimeline > 0
              ? `${metric.soldClosedWithoutTimeline} Sold / Closed leads have no linked timeline record, so their initial-contact response speed cannot currently be calculated.`
              : "Sold / Closed leads have sufficient timeline linkage for this comparison."}
          </p>
        </div>
      </div>

      <p className="mt-5 text-xs leading-5 text-slate-400">
        Association only: a fast response is not evidence that the initial
        contact caused the appointment or sale. Inbound communication is
        treated as response evidence because the current source data does not
        reliably identify every inbound actor as the customer.
      </p>
    </SectionPanel>
  );
}
