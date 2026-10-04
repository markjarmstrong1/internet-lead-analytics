import type { SupabaseClient } from "@supabase/supabase-js";

import type { TimelineDatabase } from "@/integrations/tekion/timeline/timeline-database";
import type { TimelineAnalyticsRepository } from "./timeline-analytics-repository";
import type { TimelineAnalyticsLead } from "./timeline-analytics-lead";
import { buildTimelineAnalyticsEvents } from "./build-timeline-analytics-events";

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

  async loadLeads(): Promise<TimelineAnalyticsLead[]> {
    const [leadsResult, timelineResult] =
      await Promise.all([
        this.client
          .from("leads")
          .select("id, stage"),
        this.client
          .from("timeline_records")
          .select("id, lead_id"),
      ]);

    if (leadsResult.error) {
      throw new Error(
        `Failed to load analytics leads: ${leadsResult.error.message}`,
      );
    }

    if (timelineResult.error) {
      throw new Error(
        `Failed to load analytics timeline records: ${timelineResult.error.message}`,
      );
    }

    const timelineByLead = new Map<string, string>();

    for (const record of timelineResult.data) {
      if (
        record.lead_id &&
        !timelineByLead.has(record.lead_id)
      ) {
        timelineByLead.set(record.lead_id, record.id);
      }
    }

    return leadsResult.data.map((lead) => ({
      leadId: lead.id,
      timelineRecordId:
        timelineByLead.get(lead.id) ?? null,
      stage: lead.stage,
    }));
  }
}
