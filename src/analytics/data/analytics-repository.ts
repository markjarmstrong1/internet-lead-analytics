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
  firstContactedTime?: string | null;
  soldDate: string | null;
  closedTime: string | null;
  timelineRecordIds: string[];
};

export type AnalyticsTemplate = {
  templateCode: string;
  name: string;
};

export type AnalyticsDataset = {
  leads: AnalyticsLead[];
  events: AnalyticsEvent[];
  templates?: AnalyticsTemplate[];
};

export interface AnalyticsRepository {
  load(): Promise<AnalyticsDataset>;
}

function extractFirstContactedTime(
  rawData: Record<string, unknown> | null,
): string | null {
  if (!rawData || typeof rawData !== "object") {
    return null;
  }

  const row = rawData.row;

  if (!row || typeof row !== "object") {
    return null;
  }

  const value =
    (row as Record<string, unknown>)["First Contacted Time"];

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? null
    : parsed.toISOString();
}

const TIMELINE_EVENT_PAGE_SIZE = 500;

export class SupabaseAnalyticsRepository
  implements AnalyticsRepository
{
  constructor(
    private readonly client: SupabaseClient<TimelineDatabase>,
  ) {}

  private async loadTimelineEvents() {
    const events: Awaited<
      ReturnType<
        ReturnType<
          SupabaseClient<TimelineDatabase>["from"]
        >["select"]
      >
    >["data"] = [];

    for (let from = 0; ; from += TIMELINE_EVENT_PAGE_SIZE) {
      const to = from + TIMELINE_EVENT_PAGE_SIZE - 1;

      const result = await this.client
        .from("timeline_events")
        .select("*")
        .order("occurred_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to);

      if (result.error) {
        throw new Error(
          `Failed to load analytics timeline events: ${result.error.message}`,
        );
      }

      events.push(...(result.data ?? []));

      if ((result.data ?? []).length < TIMELINE_EVENT_PAGE_SIZE) {
        break;
      }
    }

    return events;
  }

  async load(): Promise<AnalyticsDataset> {
    const [
      leadsResult,
      recordsResult,
      events,
      templatesResult,
    ] = await Promise.all([
        this.client
          .from("leads")
          .select(
            "id, contact_name, source, lead_source_group, stage, status, creation_time, raw_data, sold_date, closed_time",
          ),
        this.client
          .from("timeline_records")
          .select("id, lead_id")
          .not("lead_id", "is", null),
        this.loadTimelineEvents(),
        this.client
          .from("templates")
          .select("template_code,name")
          .eq("is_active", true),
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

    if (templatesResult.error) {
      throw new Error(
        `Failed to load analytics templates: ${templatesResult.error.message}`,
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
        firstContactedTime:
          extractFirstContactedTime(lead.raw_data),
        soldDate: lead.sold_date ?? null,
        closedTime: lead.closed_time ?? null,
        timelineRecordIds:
          timelineIdsByLead.get(lead.id) ?? [],
      }),
    );

    return {
      leads,
      events: buildAnalyticsEvents(events),
      templates: (templatesResult.data ?? []).map(
        (template) => ({
          templateCode: template.template_code,
          name: template.name,
        }),
      ),
    };
  }
}
