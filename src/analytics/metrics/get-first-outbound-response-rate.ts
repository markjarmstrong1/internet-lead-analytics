import type { ReportableMetric } from "./reportable-metric";
import { calculateFirstOutboundResponseRate } from "./first-outbound-response-rate";
import { createServerTimelineAnalyticsRepository } from "../timeline/create-server-timeline-analytics-repository";

export async function getFirstOutboundResponseRate(): Promise<ReportableMetric> {
  const repository =
    createServerTimelineAnalyticsRepository();

  const events = await repository.loadEvents();

  return calculateFirstOutboundResponseRate(events);
}
