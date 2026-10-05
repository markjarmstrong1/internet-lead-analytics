import Link from "next/link";

import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";

import type { DashboardAnalysis } from "@/analytics/metrics/dashboard";
import type { AnalyticsFilters } from "@/analytics/filters/analytics-filters";

import { AnalyticsFilters } from "./analytics-filters";
import { AnalyticsManagementSummary } from "./analytics-management-summary";
import { AnalyticsPerformance } from "./analytics-performance";
import { AnalyticsTrends } from "./analytics-trends";
import { AnalyticsInvestigation } from "./analytics-investigation";

type Props = {
  analysis: DashboardAnalysis;
  filters: AnalyticsFilters;
  options: {
    sources: string[];
    sourceGroups: string[];
    stages: string[];
    statuses: string[];
  };
};

export function AnalyticsDashboardPage({
  analysis,
  filters,
  options,
}: Props) {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1500px] space-y-6 px-6 py-7 lg:px-8">
        <PageHeader
          eyebrow="Analytics"
          title="Internet lead performance"
          description="Understand volume, contact speed, customer response, and observed outcomes—then investigate the leads behind the numbers."
          actions={
            <Link
              href="/reports"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Build a report
            </Link>
          }
        />

        <AnalyticsFilters
          filters={filters}
          options={options}
        />

        <AnalyticsManagementSummary analysis={analysis} />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">
                  Acquisition
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  How much volume is entering the system, and how much
                  evidence do we have to analyze it?
                </p>
              </div>

              <span className="text-xs font-medium text-slate-400">
                {analysis.acquisition.sourceGroups} source groups
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <Mini
                label="Leads"
                value={String(analysis.acquisition.leads)}
              />

              <Mini
                label="Timeline coverage"
                value={pct(
                  analysis.acquisition.timelineCoverageRate,
                )}
              />

              <Mini
                label="Unknown source"
                value={String(
                  analysis.acquisition.unknownSource,
                )}
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-950 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Evidence check
            </p>

            <p className="mt-2 text-lg font-semibold">
              Know what the data can support.
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Timeline coverage is{" "}
              {pct(
                analysis.acquisition.timelineCoverageRate,
              )}
              . Communication conclusions are incomplete for leads without
              timeline evidence.
            </p>

            <p className="mt-4 text-xs font-medium text-slate-300">
              {analysis.progression.soldClosedWithoutTimeline} Sold/Closed
              leads have no timeline evidence.
            </p>
          </section>
        </div>

        <AnalyticsPerformance analysis={analysis} />

        <AnalyticsTrends analysis={analysis} />

        <AnalyticsInvestigation analysis={analysis} />

        <footer className="border-t border-slate-200 pt-4 text-xs leading-5 text-slate-400">
          Contact = qualifying employee outbound. Response = observed inbound
          at or after first qualifying outbound. Sold/Closed = current observed
          lead state, not a reconstructed transaction record. Source differences
          are associations, not causal findings.
        </footer>
      </div>
    </AppShell>
  );
}

function pct(value: number | null) {
  return value === null
    ? "—"
    : `${(value * 100).toFixed(1)}%`;
}

function Mini({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}
