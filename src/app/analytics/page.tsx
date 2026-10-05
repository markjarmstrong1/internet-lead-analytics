import { loadAnalyticsPage } from "@/analytics/load-analytics-page";
import { AnalyticsSectionPage } from "@/components/analytics/analytics-section-page";
import { AnalyticsOverview } from "@/components/analytics/analytics-overview";

export const dynamic = "force-dynamic";

export default async function AnalyticsRoute({
  searchParams,
}: {
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
}) {
  const data = await loadAnalyticsPage(await searchParams);

  return (
    <AnalyticsSectionPage
      title="Internet lead analytics"
      description="A management view of acquisition, contact, engagement, progression, sources, trends, and individual lead behavior."
      {...data}
    >
      <AnalyticsOverview analysis={data.analysis} />
    </AnalyticsSectionPage>
  );
}
