import Link from "next/link";

import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";

import { ReportBuilder } from "./report-builder";
import { ReportResults } from "./report-results";
import { SavedReports } from "./saved-reports";

import type {
  ReportDefinition,
  ReportResult,
  SavedReport,
} from "@/reports/report-types";

type ReportsPageProps = {
  definition: ReportDefinition;
  result: ReportResult;
  savedReports: SavedReport[];
  savedReport: SavedReport | null;
  options: {
    sources: string[];
    sourceGroups: string[];
    stages: string[];
    statuses: string[];
    templates: string[];
  };
};

export function ReportsPage({
  definition,
  result,
  savedReports,
  savedReport,
  options,
}: ReportsPageProps) {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8 lg:px-8">
        <PageHeader
          eyebrow="Reporting"
          title={
            savedReport
              ? savedReport.name
              : "Report builder"
          }
          description="Build reusable management reports from the same analytical evidence used throughout the application."
          actions={
            <>
              <Link
                href="/reports/template-responses"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Template response analysis
              </Link>
              <Link
                href="/reports"
                className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
              >
                New report
              </Link>
            </>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <SavedReports
            reports={savedReports}
            activeReportId={
              savedReport?.id ?? null
            }
          />

          <SectionPanel
            title="Build report"
            description="Define the population first, then narrow it with filters, grouping, and measures."
          >
            <ReportBuilder
              key={JSON.stringify(definition)}
              definition={definition}
              savedReport={savedReport}
              options={options}
            />
          </SectionPanel>
        </div>

        <SectionPanel
          title="Generated report"
          description={`${result.populationCount.toLocaleString()} leads match this report definition.`}
        >
          <ReportResults
            result={result}
          />
        </SectionPanel>
      </div>
    </AppShell>
  );
}
