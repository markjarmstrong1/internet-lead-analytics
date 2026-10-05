import { createServerAnalyticsRepository } from "@/analytics/data/create-server-analytics-repository";
import { buildDashboardAnalysis } from "@/analytics/metrics/dashboard";
import { AnalyticsDashboardPage } from "@/components/analytics/analytics-dashboard-page";

export const dynamic = "force-dynamic";

export default async function AnalyticsRoute() {
  const dataset =
    await createServerAnalyticsRepository().load();

  return (
    <AnalyticsDashboardPage
      analysis={buildDashboardAnalysis(dataset)}
    />
  );
}
