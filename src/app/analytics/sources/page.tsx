import { loadAnalyticsPage } from "@/analytics/load-analytics-page";
import { AnalyticsSectionPage } from "@/components/analytics/analytics-section-page";
import { SourcesPage } from "@/components/analytics/analytics-domain-pages";

export const dynamic = "force-dynamic";

export default async function SourcesRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const data = await loadAnalyticsPage(await searchParams);
  return (
    <AnalyticsSectionPage
      title="Sources"
      description="Compare Internet lead sources across volume, contact, response, appointment evidence, and observed outcomes."
      {...data}
    >
      <SourcesPage analysis={data.analysis} />
    </AnalyticsSectionPage>
  );
}
