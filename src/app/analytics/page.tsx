import { getFirstOutboundResponseRate } from "@/analytics/metrics/get-first-outbound-response-rate";
import { AppShell } from "@/components/app/app-shell";
import { AnalyticsPage } from "@/components/analytics/analytics-page";

export default async function AnalyticsRoute() {
  const metric = await getFirstOutboundResponseRate();

  return (
    <AppShell>
      <AnalyticsPage metric={metric} />
    </AppShell>
  );
}
