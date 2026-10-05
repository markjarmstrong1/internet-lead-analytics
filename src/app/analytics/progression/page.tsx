import { loadAnalyticsPage } from "@/analytics/load-analytics-page";
import { AnalyticsSectionPage } from "@/components/analytics/analytics-section-page";
import { ProgressionPage } from "@/components/analytics/analytics-domain-pages";

export const dynamic = "force-dynamic";

export default async function ProgressionRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const data = await loadAnalyticsPage(await searchParams);
  return (
    <AnalyticsSectionPage
      title="Progression"
      description="Analyze appointment evidence and current Sold/Closed states without pretending the available data is a complete sales funnel."
      {...data}
    >
      <ProgressionPage analysis={data.analysis} />
    </AnalyticsSectionPage>
  );
}
