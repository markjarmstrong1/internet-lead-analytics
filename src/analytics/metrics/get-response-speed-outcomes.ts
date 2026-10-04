import { createServerTimelineAnalyticsRepository } from "../timeline/create-server-timeline-analytics-repository";
import {
  calculateResponseSpeedOutcomes,
  type ResponseSpeedOutcomesMetric,
} from "./response-speed-outcomes";

export async function getResponseSpeedOutcomes(): Promise<ResponseSpeedOutcomesMetric> {
  const repository =
    createServerTimelineAnalyticsRepository();

  const [events, leads] = await Promise.all([
    repository.loadEvents(),
    repository.loadLeads(),
  ]);

  return calculateResponseSpeedOutcomes(events, leads);
}
