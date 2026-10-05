import { createServerAnalyticsRepository } from "@/analytics/data/create-server-analytics-repository";
import { buildDashboardAnalysis } from "@/analytics/metrics/dashboard";
import {
  analyticsFilterOptions,
  analyticsFiltersFromSearchParams,
  filterAnalyticsDataset,
  type AnalyticsFilters,
} from "@/analytics/filters/analytics-filters";
import { AnalyticsDashboardPage } from "@/components/analytics/analytics-dashboard-page";

export const dynamic = "force-dynamic";

type SearchParams = Record<
  string,
  string | string[] | undefined
>;

export default async function AnalyticsRoute({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  let filters: AnalyticsFilters;

  try {
    filters = analyticsFiltersFromSearchParams(params);
  } catch {
    filters = analyticsFiltersFromSearchParams({});
  }

  const dataset =
    await createServerAnalyticsRepository().load();

  const filteredDataset =
    filterAnalyticsDataset(dataset, filters);

  return (
    <AnalyticsDashboardPage
      analysis={buildDashboardAnalysis(filteredDataset)}
      filters={filters}
      options={analyticsFilterOptions(dataset)}
    />
  );
}
