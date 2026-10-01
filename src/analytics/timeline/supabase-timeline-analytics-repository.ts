import type { SupabaseClient } from "@supabase/supabase-js";

import type { TimelineAnalyticsRepository } from "./timeline-analytics-repository";
import { buildTimelineAnalyticsEvents } from "./build-timeline-analytics-events";
import type { TimelineDatabase } from "@/integrations/tekion/timeline/timeline-database";

export class SupabaseTimelineAnalyticsRepository
  implements TimelineAnalyticsRepository
{
  constructor(
    private readonly client: SupabaseClient<TimelineDatabase>,
  ) {}

  async loadEvents() {
    const { data, error } = await this.client
      .from("timeline_events")
      .select("*")
      .order("occurred_at", { ascending: true });

    if (error) {
      throw new Error(
        `Failed to load timeline analytics events: ${error.message}`,
      );
    }

    return buildTimelineAnalyticsEvents(data);
  }
}
