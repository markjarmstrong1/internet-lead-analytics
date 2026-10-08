"use client";

import Link from "next/link";

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

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="text-sm font-semibold">
            Investigate this population
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Open the exact leads represented by this report.
          </p>
        </div>

        <LeadPopulationLink
          leadIds={result.leadIds}
          label={`View ${result.populationCount.toLocaleString()} leads`}
        />
      </div>

      <ManagementReadout result={result} />

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
                    <div className="flex items-center justify-between gap-4">
                      <span className="min-w-0">
                        <span className="block truncate">{row.label}</span>
                        <span className="mt-0.5 block text-[11px] font-normal text-slate-400">
                          {row.leadIds.length.toLocaleString()}{" "}
                          {row.leadIds.length === 1 ? "lead" : "leads"}
                        </span>
                      </span>

                      <LeadPopulationLink
                        leadIds={row.leadIds}
                        label="Investigate"
                        compact
                      />
                    </div>
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

function ManagementReadout({
  result,
}: {
  result: ReportResult;
}) {
  const evidence = result.definition.filters.evidence;

  const responseRateRows = result.rows
    .filter((row) => row.values.responseRate != null)
    .sort(
      (a, b) =>
        (b.values.responseRate ?? -1) -
        (a.values.responseRate ?? -1),
    );

  const strongest = responseRateRows[0] ?? null;

  const weakest =
    responseRateRows.length > 1
      ? responseRateRows[responseRateRows.length - 1]
      : null;

  const evidenceLabels = [
    evidence.outbound !== "any"
      ? `Outbound ${evidence.outbound.replace("_", " ")}`
      : null,
    evidence.response !== "any"
      ? `Response ${evidence.response.replace("_", " ")}`
      : null,
    evidence.appointment !== "any"
      ? `Appointment ${evidence.appointment.replace("_", " ")}`
      : null,
    evidence.outcome !== "any"
      ? `Outcome ${evidence.outcome.replace("_", " ")}`
      : null,
    evidence.responseWithin24h !== "any"
      ? `24h response ${evidence.responseWithin24h}`
      : null,
  ].filter((value): value is string => value !== null);

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Management readout
          </p>

          <h3 className="mt-1 text-base font-semibold text-slate-950">
            {result.populationCount.toLocaleString()} leads match the current definition
          </h3>

          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            This readout summarizes the report configuration and observed
            results. It does not infer causation from grouped comparisons.
          </p>
        </div>

        {strongest ? (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Highest displayed response rate
            </p>

            <p className="mt-1 text-lg font-semibold tabular-nums text-slate-950">
              {formatMetric(
                "responseRate",
                strongest.values.responseRate ?? null,
              )}
            </p>

            <p className="text-xs text-slate-500">
              {strongest.label}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <ReadoutItem
          label="Population"
          value={result.definition.name}
          detail={`${result.populationCount.toLocaleString()} matching leads`}
        />

        <ReadoutItem
          label="Grouped by"
          value={
            result.definition.groupBy === "none"
              ? "Entire population"
              : result.definition.groupBy
          }
          detail={`${result.rows.length.toLocaleString()} displayed group${result.rows.length === 1 ? "" : "s"}`}
        />

        <ReadoutItem
          label="Evidence posture"
          value={
            evidenceLabels.length > 0
              ? evidenceLabels.join(" · ")
              : "No evidence filter"
          }
          detail="Filters applied to canonical evidence states"
        />
      </div>

      {strongest && weakest && strongest.key !== weakest.key ? (
        <p className="mt-4 text-xs text-slate-500">
          Among the displayed groups, observed response rate ranges from{" "}
          <span className="font-semibold text-slate-700">
            {formatMetric(
              "responseRate",
              weakest.values.responseRate ?? null,
            )}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-slate-700">
            {formatMetric(
              "responseRate",
              strongest.values.responseRate ?? null,
            )}
          </span>
          . Treat this as an observed comparison, not a causal conclusion.
        </p>
      ) : null}
    </section>
  );
}

function ReadoutItem({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function LeadPopulationLink({
  leadIds,
  label,
  compact = false,
}: {
  leadIds: string[];
  label: string;
  compact?: boolean;
}) {
  if (leadIds.length === 0) {
    return null;
  }

  const href = `/leads/list?leadIds=${encodeURIComponent(
    leadIds.join(","),
  )}`;

  return (
    <Link
      href={href}
      className={
        compact
          ? "whitespace-nowrap text-xs font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-950"
          : "rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
      }
    >
      {label}
    </Link>
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
