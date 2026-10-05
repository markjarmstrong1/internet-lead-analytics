import { loadAnalyticsPage } from "@/analytics/load-analytics-page";
import { AnalyticsSectionPage } from "@/components/analytics/analytics-section-page";
import { TrendsPage } from "@/components/analytics/analytics-domain-pages";

export const dynamic = "force-dynamic";

export default async function TrendsRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const data = await loadAnalyticsPage(await searchParams);
  return (
    <AnalyticsSectionPage
      title="Trends"
      description="See how acquisition, contact, response, appointment evidence, and observed outcomes vary across lead-creation cohorts."
      {...data}
    >
      <TrendsPage analysis={data.analysis} />
    </AnalyticsSectionPage>
  );
}
