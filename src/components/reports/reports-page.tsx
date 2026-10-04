import Link from "next/link";

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
    <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-8 lg:px-8">
      <PageHeader
        eyebrow="Reporting"
        title={
          savedReport
            ? savedReport.name
            : "Report builder"
        }
        description="Build management reports from the same analytical evidence used throughout the application."
        actions={
          <Link
            href="/reports"
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            New report
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <SavedReports
          reports={savedReports}
        />

        <SectionPanel
          title="Customize report"
          description="Choose the population, filters, grouping, and measures. Generate updates the report immediately."
        >
          <ReportBuilder
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
  );
}
