import { loadAnalyticsPage } from "@/analytics/load-analytics-page";
import { AnalyticsSectionPage } from "@/components/analytics/analytics-section-page";
import { EngagementPage } from "@/components/analytics/analytics-domain-pages";

export const dynamic = "force-dynamic";

export default async function EngagementRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const data = await loadAnalyticsPage(await searchParams);
  return (
    <AnalyticsSectionPage
      title="Engagement"
      description="Understand how contacted leads respond, how quickly they respond, and which first-touch channels are associated with response."
      {...data}
    >
      <EngagementPage analysis={data.analysis} />
    </AnalyticsSectionPage>
  );
}
