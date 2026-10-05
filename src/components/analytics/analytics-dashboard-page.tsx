import Link from "next/link";

import { AppShell } from "@/components/app/app-shell";
import { EvidenceLegend } from "@/components/app/evidence-legend";
import { PageHeader } from "@/components/app/page-header";

import type { DashboardAnalysis } from "@/analytics/metrics/dashboard";
import type { AnalyticsFilters } from "@/analytics/filters/analytics-filters";

import { AnalyticsFilters as AnalyticsFilterPanel } from "./analytics-filters";
import { AnalyticsSummary } from "./analytics-summary";
import { AnalyticsContactSection } from "./analytics-contact-section";
import { AnalyticsEngagementSection } from "./analytics-engagement-section";
import { AnalyticsProgressionSection } from "./analytics-progression-section";
import { AnalyticsSourcesSection } from "./analytics-sources-section";
import { AnalyticsTrendsSection } from "./analytics-trends-section";
import { AnalyticsInvestigationSection } from "./analytics-investigation-section";

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
      <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8 lg:px-8">
        <PageHeader
          eyebrow="Analytics"
          title="Internet Lead Performance"
          description="A population-driven analytical workspace for acquisition, contact, engagement, progression, source differences, trends, and lead-level investigation."
        />

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/reports"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Open Reports
          </Link>
          <span className="text-xs text-slate-500">
            Reports are for custom dimensions and saved analyses.
          </span>
        </div>

        <AnalyticsFilterPanel
          filters={filters}
          options={options}
        />

        <EvidenceLegend />

        <AnalyticsSummary analysis={analysis} />

        <nav
          aria-label="Analytics sections"
          className="sticky top-0 z-20 -mx-6 overflow-x-auto border-y border-slate-200 bg-white/95 px-6 backdrop-blur lg:-mx-8 lg:px-8"
        >
          <div className="flex min-w-max gap-1">
            {[
              ["Contact", "contact"],
              ["Engagement", "engagement"],
              ["Progression", "progression"],
              ["Sources", "sources"],
              ["Trends", "trends"],
              ["Investigation", "investigation"],
            ].map(([label, id]) => (
              <a
                key={id}
                href={`#${id}`}
                className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-950"
              >
                {label}
              </a>
            ))}
          </div>
        </nav>

        <section id="contact" className="scroll-mt-20">
          <AnalyticsContactSection analysis={analysis} />
        </section>

        <section id="engagement" className="scroll-mt-20">
          <AnalyticsEngagementSection analysis={analysis} />
        </section>

        <section id="progression" className="scroll-mt-20">
          <AnalyticsProgressionSection analysis={analysis} />
        </section>

        <section id="sources" className="scroll-mt-20">
          <AnalyticsSourcesSection analysis={analysis} />
        </section>

        <section id="trends" className="scroll-mt-20">
          <AnalyticsTrendsSection analysis={analysis} />
        </section>

        <section id="investigation" className="scroll-mt-20">
          <AnalyticsInvestigationSection analysis={analysis} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-sm font-semibold">Methodology</h2>
          <div className="mt-3 grid gap-4 text-xs leading-5 text-slate-600 md:grid-cols-3">
            <p>
              <strong>Contact</strong> means a qualifying employee outbound
              communication was observed.
            </p>
            <p>
              <strong>Response</strong> means an inbound communication was
              observed at or after first qualifying outbound.
            </p>
            <p>
              <strong>Outcome</strong> uses the current Sold/Closed lead
              state. It is not a reconstructed transaction history.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
