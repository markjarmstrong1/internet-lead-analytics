import { loadAnalyticsPage } from "@/analytics/load-analytics-page";
import { AnalyticsSectionPage } from "@/components/analytics/analytics-section-page";
import { AnalyticsInvestigationPage } from "@/components/analytics/analytics-investigation-page";

export const dynamic = "force-dynamic";

export default async function InvestigationRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const data = await loadAnalyticsPage(await searchParams);
  return (
    <AnalyticsSectionPage
      title="Investigation"
      description="Move from aggregate statistics to the individual leads behind the results."
      {...data}
    >
      <AnalyticsInvestigationPage analysis={data.analysis} />
    </AnalyticsSectionPage>
  );
}
