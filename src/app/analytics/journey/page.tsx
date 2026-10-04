import { AnalyticsLayout } from "@/components/analytics/analytics-layout";
import { AnalyticsJourneyPage } from "@/components/analytics/analytics-journey-page";
import { createServerAnalyticsRepository } from "@/analytics/data/create-server-analytics-repository";
import { buildJourneyAnalysis } from "@/analytics/metrics/journey";

export const dynamic = "force-dynamic";

export default async function AnalyticsJourneyRoute() {
  const dataset =
    await createServerAnalyticsRepository().load();

  return (
    <AnalyticsLayout
      active="/analytics/journey"
      title="Lead Journey"
      description="What happens to a lead from creation through observed engagement and outcome evidence?"
    >
      <AnalyticsJourneyPage
        analysis={buildJourneyAnalysis(dataset)}
      />
    </AnalyticsLayout>
  );
}
