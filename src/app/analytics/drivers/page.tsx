import { AnalyticsLayout } from "@/components/analytics/analytics-layout";
import { AnalyticsDriversPage } from "@/components/analytics/analytics-drivers-page";
import { createServerAnalyticsRepository } from "@/analytics/data/create-server-analytics-repository";
import { buildDriversAnalysis } from "@/analytics/metrics/drivers";

export const dynamic = "force-dynamic";

export default async function AnalyticsDriversRoute() {
  const dataset =
    await createServerAnalyticsRepository().load();

  return (
    <AnalyticsLayout
      active="/analytics/drivers"
      title="Drivers"
      description="What appears to help or hurt performance?"
    >
      <AnalyticsDriversPage
        analysis={buildDriversAnalysis(dataset)}
      />
    </AnalyticsLayout>
  );
}
