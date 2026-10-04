import { getFirstOutboundResponseRate } from "@/analytics/metrics/get-first-outbound-response-rate";
import { getResponseSpeedOutcomes } from "@/analytics/metrics/get-response-speed-outcomes";
import { AppShell } from "@/components/app/app-shell";
import { AnalyticsPage } from "@/components/analytics/analytics-page";

export default async function AnalyticsRoute() {
  const [metric, responseSpeedOutcomes] =
    await Promise.all([
      getFirstOutboundResponseRate(),
      getResponseSpeedOutcomes(),
    ]);

  return (
    <AppShell>
      <AnalyticsPage
        metric={metric}
        responseSpeedOutcomes={responseSpeedOutcomes}
      />
    </AppShell>
  );
}
