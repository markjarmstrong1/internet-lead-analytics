import "server-only";

import type { TimelineDatabase } from "@/integrations/tekion/timeline/timeline-database";
import type { SupabaseClient } from "@supabase/supabase-js";

import { buildAnalyticsEvents } from "./build-analytics-events";
import type { AnalyticsEvent } from "./analytics-types";

export type AnalyticsLead = {
  leadId: string;
  contactName: string;
  source: string;
  sourceGroup: string;
  stage: string;
  status: string;
  creationTime: string | null;
  soldDate: string | null;
  closedTime: string | null;
  timelineRecordIds: string[];
};

export type AnalyticsDataset = {
  leads: AnalyticsLead[];
  events: AnalyticsEvent[];
};

export interface AnalyticsRepository {
  load(): Promise<AnalyticsDataset>;
}

export class SupabaseAnalyticsRepository
  implements AnalyticsRepository
{
  constructor(
    private readonly client: SupabaseClient<TimelineDatabase>,
  ) {}

  async load(): Promise<AnalyticsDataset> {
    const [leadsResult, recordsResult, eventsResult] =
      await Promise.all([
        this.client
          .from("leads")
          .select(
            "id, contact_name, source, lead_source_group, stage, status, creation_time, sold_date, closed_time",
          ),
        this.client
          .from("timeline_records")
          .select("id, lead_id")
          .not("lead_id", "is", null),
        this.client
          .from("timeline_events")
          .select("*")
          .order("occurred_at", { ascending: true }),
      ]);

    if (leadsResult.error) {
      throw new Error(
        `Failed to load analytics leads: ${leadsResult.error.message}`,
      );
    }

    if (recordsResult.error) {
      throw new Error(
        `Failed to load analytics timeline records: ${recordsResult.error.message}`,
      );
    }

    if (eventsResult.error) {
      throw new Error(
        `Failed to load analytics timeline events: ${eventsResult.error.message}`,
      );
    }

    const timelineIdsByLead = new Map<string, string[]>();

    for (const record of recordsResult.data ?? []) {
      if (!record.lead_id) {
        continue;
      }

      const ids = timelineIdsByLead.get(record.lead_id) ?? [];
      ids.push(record.id);
      timelineIdsByLead.set(record.lead_id, ids);
    }

    const leads: AnalyticsLead[] = (leadsResult.data ?? []).map(
      (lead) => ({
        leadId: lead.id,
        contactName: lead.contact_name ?? "",
        source: lead.source ?? "",
        sourceGroup: lead.lead_source_group ?? "",
        stage: lead.stage ?? "",
        status: lead.status ?? "",
        creationTime: lead.creation_time ?? null,
        soldDate: lead.sold_date ?? null,
        closedTime: lead.closed_time ?? null,
        timelineRecordIds:
          timelineIdsByLead.get(lead.id) ?? [],
      }),
    );

    return {
      leads,
      events: buildAnalyticsEvents(
        eventsResult.data ?? [],
      ),
    };
  }
}
