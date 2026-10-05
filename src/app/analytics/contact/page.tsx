import { loadAnalyticsPage } from "@/analytics/load-analytics-page";
import { AnalyticsSectionPage } from "@/components/analytics/analytics-section-page";
import { ContactPage } from "@/components/analytics/analytics-domain-pages";

export const dynamic = "force-dynamic";

export default async function ContactRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const data = await loadAnalyticsPage(await searchParams);
  return (
    <AnalyticsSectionPage
      title="Contact"
      description="Measure whether leads receive a qualifying employee outbound and how quickly it happens."
      {...data}
    >
      <ContactPage analysis={data.analysis} />
    </AnalyticsSectionPage>
  );
}
