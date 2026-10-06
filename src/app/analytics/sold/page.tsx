import { loadAnalyticsPage } from "@/analytics/load-analytics-page";
import { AnalyticsSectionPage } from "@/components/analytics/analytics-section-page";
import { AnalyticsSoldPage } from "@/components/analytics/analytics-sold-page";

export const dynamic = "force-dynamic";

export default async function SoldRoute({
  searchParams,
}: {
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
}) {
  const data = await loadAnalyticsPage(await searchParams);

  return (
    <AnalyticsSectionPage
      title="Sold Leads"
      description="Understand the leads that reached a current Sold or Closed state, what they have in common, where they came from, and how the outcome population changes across cohorts."
      {...data}
    >
      <AnalyticsSoldPage analysis={data.analysis} />
    </AnalyticsSectionPage>
  );
}
