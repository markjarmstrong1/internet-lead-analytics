import type { TimelineAnalyticsEvent } from "./timeline-analytics-event";
import type { TimelineAnalyticsLead } from "./timeline-analytics-lead";

export interface TimelineAnalyticsRepository {
  loadEvents(): Promise<TimelineAnalyticsEvent[]>;
  loadLeads(): Promise<TimelineAnalyticsLead[]>;
}
