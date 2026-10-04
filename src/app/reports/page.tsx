import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";
import { createServerAnalyticsRepository } from "@/analytics/data/create-server-analytics-repository";

import {
  DEFAULT_REPORT_DEFINITION,
  reportDefinitionFromSearchParams,
} from "@/reports/report-definition";
import { buildReport } from "@/reports/build-report";
import { createServerReportRepository } from "@/reports/create-server-report-repository";

import { ReportsPage } from "@/components/reports/reports-page";

export const dynamic = "force-dynamic";

type SearchParams = Record<
  string,
  string | string[] | undefined
>;

export default async function ReportsRoute({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const reportRepository =
    createServerReportRepository();

  const savedReports =
    await reportRepository.list();

  const reportId =
    typeof params.reportId === "string"
      ? params.reportId
      : null;

  const savedReport = reportId
    ? await reportRepository.findById(
        reportId,
      )
    : null;

  const definition = savedReport
    ? savedReport.definition
    : reportId
      ? DEFAULT_REPORT_DEFINITION
      : reportDefinitionFromSearchParams(
          params,
        );

  const dataset =
    await createServerAnalyticsRepository().load();

  const result = buildReport(
    dataset,
    definition,
  );

  return (
    <ReportsPage
      definition={definition}
      result={result}
      savedReports={savedReports}
      savedReport={savedReport}
      options={buildOptions(dataset)}
    />
  );
}

function buildOptions(
  dataset: AnalyticsDataset,
) {
  return {
    sources: uniqueSorted(
      dataset.leads.map(
        (lead) =>
          lead.source.trim() ||
          "Unknown",
      ),
    ),
    sourceGroups: uniqueSorted(
      dataset.leads.map(
        (lead) =>
          lead.sourceGroup.trim() ||
          "Unknown",
      ),
    ),
    stages: uniqueSorted(
      dataset.leads.map(
        (lead) =>
          lead.stage.trim() ||
          "Unknown",
      ),
    ),
    statuses: uniqueSorted(
      dataset.leads.map(
        (lead) =>
          lead.status.trim() ||
          "Unknown",
      ),
    ),
  };
}

function uniqueSorted(
  values: string[],
): string[] {
  return [
    ...new Set(values),
  ].sort((left, right) =>
    left.localeCompare(right),
  );
}
