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
    <div id="report-export-content" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {result.rows.length.toLocaleString()}{" "}
          {result.rows.length === 1
            ? "row"
            : "rows"}{" "}
          · {result.populationCount.toLocaleString()}{" "}
          leads in the report population
        </p>

        <div className="no-print flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            disabled={result.rows.length === 0}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Export PDF
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={result.rows.length === 0}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
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

      {result.definition.groupBy === "responseSpeed" &&
      (metrics.includes("responseRate") ||
        metrics.includes("responseWithin24hRate")) ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">Response rates are not comparable within response-speed groups</p>
          <p className="mt-1">
            Response speed is defined by whether and how quickly a lead responded.
            Showing a response rate inside those groups would make the comparison circular.
            The overall response rates above still use the observed-outbound population.
          </p>
        </div>
      ) : null}

      <ComparisonReadout result={result} />

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

      <MetricEvidencePanel result={result} />

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
              (row) => {
                const comparison = comparisonState(result, row);

                return (
                <tr
                  key={row.key}
                  className={[
                    "border-b border-slate-100 last:border-b-0 hover:bg-slate-50",
                    comparison === "strongest"
                      ? "bg-emerald-50/60"
                      : comparison === "weakest"
                        ? "bg-amber-50/60"
                        : "",
                  ].join(" ")}
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
                        context={`${result.definition.name} · ${row.label}`}
                      />
                    </div>
                  </td>

                  {metrics.map(
                    (metric) => (
                      <td
                        key={metric}
                        className="px-4 py-3 text-right tabular-nums"
                      >
                        <MetricCell
                          metric={metric}
                          value={row.values[metric] ?? null}
                        />
                      </td>
                    ),
                  )}
                </tr>
                );
              },
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

function MetricEvidencePanel({
  result,
}: {
  result: ReportResult;
}) {
  const entries = result.definition.metrics
    .map((metric) => ({
      metric,
      diagnostic: result.summaryDiagnostics[metric],
    }))
    .filter(
      (entry): entry is {
        metric: ReportMetricKey;
        diagnostic: NonNullable<
          ReportResult["summaryDiagnostics"][ReportMetricKey]
        >;
      } => entry.diagnostic != null,
    );

  if (entries.length === 0) {
    return null;
  }

  const populationLabels = {
    report_population: "Report population",
    observed_outbound_population: "Leads with observed outbound",
    responding_population: "Leads with observed response",
  };

  const evidenceLabels = {
    none: "No specific evidence requirement",
    crm_state: "CRM state",
    observed_outbound: "Observed outbound activity",
    observed_response: "Observed customer response",
    observed_appointment: "Observed appointment evidence",
    crm_outcome: "CRM outcome",
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <h3 className="text-base font-semibold text-slate-950">
          Evidence &amp; metric definitions
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          See which population each metric uses and how much timeline coverage is available.
          Timeline coverage does not by itself guarantee that every event was captured.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {entries.map(({ metric, diagnostic }) => (
          <article
            key={metric}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            <h4 className="text-sm font-semibold text-slate-900">
              {metricDefinition(metric)?.label ?? metric}
            </h4>

            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Population</dt>
                <dd className="text-right font-medium text-slate-800">
                  {populationLabels[diagnostic.population]}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Evidence basis</dt>
                <dd className="text-right font-medium text-slate-800">
                  {evidenceLabels[diagnostic.evidence]}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Eligible leads</dt>
                <dd className="font-medium tabular-nums text-slate-800">
                  {formatCount(diagnostic.eligibleLeadCount)}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Leads with timeline records</dt>
                <dd className="font-medium tabular-nums text-slate-800">
                  {formatCount(diagnostic.timelineCoveredLeadCount)}
                </dd>
              </div>

              {diagnostic.denominatorMetric !== null ? (
                <div className="border-t border-slate-200 pt-2">
                  <dt className="text-slate-500">Calculation</dt>
                  <dd className="mt-1 font-medium text-slate-800">
                    {diagnostic.numerator === null
                      ? "Numerator unavailable"
                      : formatMetric(
                          metric === "responseRate"
                            ? "responded"
                            : "responseWithin24h",
                          diagnostic.numerator,
                        )}
                    {" / "}
                    {diagnostic.denominator === null
                      ? "—"
                      : formatMetric(
                          diagnostic.denominatorMetric,
                          diagnostic.denominator,
                        )}
                    {" "}
                    <span className="font-normal text-slate-500">
                      ({metricDefinition(diagnostic.denominatorMetric)?.label ??
                        diagnostic.denominatorMetric})
                    </span>
                  </dd>
                </div>
              ) : null}
            </dl>
          </article>
        ))}
      </div>
    </section>
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

function ComparisonReadout({
  result,
}: {
  result: ReportResult;
}) {
  if (
    result.definition.groupBy === "none" ||
    !result.definition.metrics.includes("responseRate")
  ) {
    return null;
  }

  const rows = result.rows.filter(
    (row) => row.values.responseRate != null,
  );

  if (rows.length < 2) {
    return null;
  }

  const sorted = [...rows].sort(
    (a, b) =>
      (b.values.responseRate ?? -1) -
      (a.values.responseRate ?? -1),
  );

  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  if (!strongest || !weakest) {
    return null;
  }

  const spread =
    (strongest.values.responseRate ?? 0) -
    (weakest.values.responseRate ?? 0);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Group comparison
          </p>

          <h3 className="mt-1 text-base font-semibold text-slate-950">
            The largest observed response-rate gap is{" "}
            {formatPercentagePoints(spread)}
          </h3>

          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Rates are calculated from leads with observed outbound evidence.
            Null values remain unranked rather than being treated as zero.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <ComparisonBadge
            label="Strongest"
            row={strongest}
          />

          <ComparisonBadge
            label="Weakest"
            row={weakest}
          />
        </div>
      </div>
    </section>
  );
}

function ComparisonBadge({
  label,
  row,
}: {
  label: string;
  row: ReportResult["rows"][number];
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="font-semibold text-slate-700">
        {label}
      </p>

      <p className="mt-0.5 text-slate-500">
        {row.label} ·{" "}
        {formatMetric(
          "responseRate",
          row.values.responseRate ?? null,
        )}
      </p>
    </div>
  );
}

function comparisonState(
  result: ReportResult,
  row: ReportResult["rows"][number],
): "strongest" | "weakest" | null {
  if (
    result.definition.groupBy === "none" ||
    !result.definition.metrics.includes("responseRate") ||
    row.values.responseRate == null
  ) {
    return null;
  }

  const ranked = result.rows.filter(
    (candidate) => candidate.values.responseRate != null,
  );

  if (ranked.length < 2) {
    return null;
  }

  const max = Math.max(
    ...ranked.map(
      (candidate) => candidate.values.responseRate ?? -1,
    ),
  );

  const min = Math.min(
    ...ranked.map(
      (candidate) => candidate.values.responseRate ?? 2,
    ),
  );

  if (row.values.responseRate === max) {
    return "strongest";
  }

  if (row.values.responseRate === min) {
    return "weakest";
  }

  return null;
}

function MetricCell({
  metric,
  value,
}: {
  metric: ReportMetricKey;
  value: number | null;
}) {
  if (value === null) {
    return <span>—</span>;
  }

  if (
    metric === "responseRate" ||
    metric === "responseWithin24hRate"
  ) {
    return (
      <span className="inline-flex flex-col items-end">
        <span>{formatMetric(metric, value)}</span>
        <span className="text-[10px] font-normal text-slate-400">
          of observed outbound
        </span>
      </span>
    );
  }

  return <span>{formatMetric(metric, value)}</span>;
}

function formatPercentagePoints(value: number): string {
  return (
    (value * 100).toFixed(1) +
    " percentage points"
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
  context,
}: {
  leadIds: string[];
  label: string;
  compact?: boolean;
  context?: string;
}) {
  if (leadIds.length === 0) {
    return null;
  }

  const params = new URLSearchParams({
    leadIds: leadIds.join(","),
  });

  if (context) {
    params.set("context", context);
  }

  const href = `/leads/list?${params.toString()}`;

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
