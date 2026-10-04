import {
  REPORT_METRICS,
  metricDefinition,
} from "@/reports/report-catalog";
import type {
  ReportMetricKey,
  ReportResult,
} from "@/reports/report-types";

export function ReportResults({
  result,
}: {
  result: ReportResult;
}) {
  const metrics =
    result.definition.metrics;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Report population"
          value={formatCount(
            result.populationCount,
          )}
          detail="Leads matching the report definition"
        />

        {metrics
          .slice(0, 3)
          .map((metric) => (
            <SummaryCard
              key={metric}
              label={
                metricDefinition(metric)
                  ?.label ?? metric
              }
              value={formatMetric(
                metric,
                result.rows.length === 1
                  ? result.rows[0].values[
                      metric
                    ] ?? null
                  : aggregateSummary(
                      result,
                      metric,
                    ),
              )}
              detail="Report-level summary"
            />
          ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left font-semibold">
                {result.definition.groupBy ===
                "none"
                  ? "Report"
                  : "Group"}
              </th>

              {metrics.map(
                (metric) => (
                  <th
                    key={metric}
                    className="px-4 py-3 text-right font-semibold"
                  >
                    {metricDefinition(
                      metric,
                    )?.label ?? metric}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {result.rows.map(
              (row) => (
                <tr
                  key={row.key}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <td className="px-4 py-3 font-medium">
                    {row.label}
                  </td>

                  {metrics.map(
                    (metric) => (
                      <td
                        key={metric}
                        className="px-4 py-3 text-right tabular-nums"
                      >
                        {formatMetric(
                          metric,
                          row.values[
                            metric
                          ] ?? null,
                        )}
                      </td>
                    ),
                  )}
                </tr>
              ),
            )}

            {result.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={metrics.length + 1}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  No leads match this report definition.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-400">
        {detail}
      </p>
    </article>
  );
}

function aggregateSummary(
  result: ReportResult,
  metric: ReportMetricKey,
): number | null {
  if (
    metric === "responseRate" ||
    metric ===
      "responseWithin24hRate" ||
    metric ===
      "medianResponseMinutes"
  ) {
    return null;
  }

  const values = result.rows
    .map(
      (row) =>
        row.values[metric] ?? null,
    )
    .filter(
      (value): value is number =>
        value !== null,
    );

  return values.reduce(
    (total, value) =>
      total + value,
    0,
  );
}

function formatMetric(
  metric: ReportMetricKey,
  value: number | null,
): string {
  if (value === null) {
    return "—";
  }

  const definition =
    metricDefinition(metric);

  if (!definition) {
    return String(value);
  }

  if (definition.format === "percent") {
    return `${(value * 100).toFixed(1)}%`;
  }

  if (definition.format === "minutes") {
    if (value < 60) {
      return `${value.toFixed(1)} min`;
    }

    return `${(value / 60).toFixed(1)} hr`;
  }

  return formatCount(value);
}

function formatCount(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 1,
    },
  ).format(value);
}
