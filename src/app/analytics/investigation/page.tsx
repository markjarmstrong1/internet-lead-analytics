import { AnalyticsLayout } from "@/components/analytics/analytics-layout";
import { AnalyticsInvestigationPage } from "@/components/analytics/analytics-investigation-page";
import { createServerAnalyticsRepository } from "@/analytics/data/create-server-analytics-repository";
import { buildInvestigationRows } from "@/analytics/metrics/investigation";

export const dynamic = "force-dynamic";

export default async function AnalyticsInvestigationRoute() {
  const dataset =
    await createServerAnalyticsRepository().load();

  return (
    <AnalyticsLayout
      active="/analytics/investigation"
      title="Investigation"
      description="Show me the actual leads and evidence behind the analytical results."
    >
      <AnalyticsInvestigationPage
        rows={buildInvestigationRows(dataset)}
      />
    </AnalyticsLayout>
  );
}
