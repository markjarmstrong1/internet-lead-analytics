import { AnalyticsLayout } from "@/components/analytics/analytics-layout";
import { AnalyticsOverviewPage } from "@/components/analytics/analytics-overview-page";
import { createServerAnalyticsRepository } from "@/analytics/data/create-server-analytics-repository";
import { buildOverviewAnalysis } from "@/analytics/metrics/overview";
import { buildEngagementAnalysis } from "@/analytics/metrics/engagement";

export const dynamic = "force-dynamic";

export default async function AnalyticsRoute() {
  const dataset =
    await createServerAnalyticsRepository().load();

  return (
    <AnalyticsLayout
      active="/analytics"
      title="Overview"
      description="Are we getting value from the Internet leads we pay for?"
    >
      <AnalyticsOverviewPage
        overview={buildOverviewAnalysis(dataset)}
        engagement={buildEngagementAnalysis(dataset)}
      />
    </AnalyticsLayout>
  );
}
