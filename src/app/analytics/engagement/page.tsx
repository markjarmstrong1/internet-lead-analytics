import { AnalyticsLayout } from "@/components/analytics/analytics-layout";
import { AnalyticsEngagementPage } from "@/components/analytics/analytics-engagement-page";
import { createServerAnalyticsRepository } from "@/analytics/data/create-server-analytics-repository";
import { buildEngagementAnalysis } from "@/analytics/metrics/engagement";

export const dynamic = "force-dynamic";

export default async function AnalyticsEngagementRoute() {
  const dataset =
    await createServerAnalyticsRepository().load();

  return (
    <AnalyticsLayout
      active="/analytics/engagement"
      title="Engagement"
      description="Are customers responding to what we do, and how quickly?"
    >
      <AnalyticsEngagementPage
        analysis={buildEngagementAnalysis(dataset)}
      />
    </AnalyticsLayout>
  );
}
