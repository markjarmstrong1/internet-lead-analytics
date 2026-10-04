"use client";

import { metricDefinition } from "@/reports/report-catalog";
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

  function downloadCsv() {
    const headers = [
      result.definition.groupBy === "none"
        ? "Report"
        : "Group",
      ...metrics.map(
        (metric) =>
          metricDefinition(metric)?.label ??
          metric,
      ),
    ];

    const rows = result.rows.map((row) => [
      row.label,
      ...metrics.map((metric) =>
        formatMetric(
          metric,
          row.values[metric] ?? null,
        ),
      ),
    ]);

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row.map(csvCell).join(","),
      )
      .join("\n");

    const blob = new Blob(
      [csv],
      { type: "text/csv;charset=utf-8" },
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${safeFilename(
      result.definition.name,
    )}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {result.rows.length.toLocaleString()}{" "}
          {result.rows.length === 1
            ? "row"
            : "rows"}{" "}
          · {result.populationCount.toLocaleString()}{" "}
          leads in the report population
        </p>

        <button
          type="button"
          onClick={downloadCsv}
          disabled={result.rows.length === 0}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>

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
                result.summary[metric] ?? null,
              )}
              detail="Overall report result"
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
                  className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
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
                  className="px-4 py-12 text-center"
                >
                  <p className="text-sm font-medium text-slate-700">
                    No leads match this report.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Try widening the date range or
                    removing one or more filters.
                  </p>
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

function csvCell(
  value: string,
): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function safeFilename(
  value: string,
): string {
  const cleaned = value
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned || "report";
}
