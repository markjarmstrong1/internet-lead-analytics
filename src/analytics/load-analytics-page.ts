import { createServerAnalyticsRepository } from "@/analytics/data/create-server-analytics-repository";
import { buildDashboardAnalysis } from "@/analytics/metrics/dashboard";
import {
  analyticsFilterOptions,
  analyticsFiltersFromSearchParams,
  filterAnalyticsDataset,
  type AnalyticsFilters,
} from "@/analytics/filters/analytics-filters";

export type AnalyticsSearchParams = Record<
  string,
  string | string[] | undefined
>;

export async function loadAnalyticsPage(
  searchParams: AnalyticsSearchParams,
) {
  let filters: AnalyticsFilters;

  try {
    filters = analyticsFiltersFromSearchParams(searchParams);
  } catch {
    filters = analyticsFiltersFromSearchParams({});
  }

  const dataset =
    await createServerAnalyticsRepository().load();

  const filteredDataset =
    filterAnalyticsDataset(dataset, filters);

  return {
    analysis: buildDashboardAnalysis(filteredDataset),
    filters,
    options: analyticsFilterOptions(dataset),
  };
}
