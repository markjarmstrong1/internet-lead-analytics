import type { TimelineAnalyticsEvent } from "./timeline-analytics-event";

export interface TimelineAnalyticsRepository {
  loadEvents(): Promise<TimelineAnalyticsEvent[]>;
}
