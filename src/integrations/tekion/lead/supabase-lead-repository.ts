// src/integrations/tekion/lead/supabase-lead-repository.ts

import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import type { LeadPersistenceRow } from "./lead-persistence-row";

export type LeadListItem = LeadPersistenceRow & {
  id: string;
  created_at: string;
  updated_at: string;
  last_engaged_at: string | null;
  last_contacted_at: string | null;
};

type TimelineEventRow = {
  occurred_at: string;
  direction: string | null;
  channel: string | null;
};

type TimelineRecordRow = {
  lead_id: string;
  timeline_events: TimelineEventRow[] | null;
};

export async function listLeads(): Promise<LeadListItem[]> {
  const supabase = createServerSupabaseClient();

  const [{ data, error }, { data: timelineRecords, error: timelineError }] =
    await Promise.all([
      supabase
        .from("leads")
        .select("*")
        .order("creation_time", {
          ascending: false,
          nullsFirst: false,
        }),

      supabase
        .from("timeline_records")
        .select(
          "lead_id, timeline_events(occurred_at, direction, channel)",
        )
        .not("lead_id", "is", null),
    ]);

  if (error) {
    throw new Error(`Failed to load leads: ${error.message}`);
  }

  if (timelineError) {
    throw new Error(
      `Failed to load lead engagement data: ${timelineError.message}`,
    );
  }

  const activityByLead = new Map<
    string,
    {
      last_engaged_at: string | null;
      last_contacted_at: string | null;
    }
  >();

  for (const record of (timelineRecords ?? []) as TimelineRecordRow[]) {
    const activity = activityByLead.get(record.lead_id) ?? {
      last_engaged_at: null,
      last_contacted_at: null,
    };

    for (const event of record.timeline_events ?? []) {
      if (!event.occurred_at) {
        continue;
      }

      if (
        event.direction === "inbound" &&
        (!activity.last_engaged_at ||
          event.occurred_at > activity.last_engaged_at)
      ) {
        activity.last_engaged_at = event.occurred_at;
      }

      if (
        event.direction === "outbound" &&
        event.channel &&
        (!activity.last_contacted_at ||
          event.occurred_at > activity.last_contacted_at)
      ) {
        activity.last_contacted_at = event.occurred_at;
      }
    }

    activityByLead.set(record.lead_id, activity);
  }

  return (data ?? []).map((lead) => ({
    ...lead,
    last_engaged_at:
      activityByLead.get(lead.id)?.last_engaged_at ?? null,
    last_contacted_at:
      activityByLead.get(lead.id)?.last_contacted_at ?? null,
  }));
}