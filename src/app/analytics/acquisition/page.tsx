import { loadAnalyticsPage } from "@/analytics/load-analytics-page";
import { AnalyticsSectionPage } from "@/components/analytics/analytics-section-page";
import { AcquisitionPage } from "@/components/analytics/analytics-domain-pages";

export const dynamic = "force-dynamic";

export default async function AcquisitionRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const data = await loadAnalyticsPage(await searchParams);
  return (
    <AnalyticsSectionPage
      title="Acquisition"
      description="Understand how much Internet lead volume is entering the system and where it comes from."
      {...data}
    >
      <AcquisitionPage analysis={data.analysis} />
    </AnalyticsSectionPage>
  );
}
