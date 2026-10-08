// src/integrations/tekion/lead/supabase-lead-repository.ts

import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";
import {
  buildLeadObservation,
} from "@/analytics/observations/analytics-observations";
import type { LeadPersistenceRow } from "./lead-persistence-row";

export type LeadListEvidence = {
  outbound: "observed" | "not_observed" | "unknown" | "insufficient_evidence" | "unresolved";
  response: "observed" | "not_observed" | "unknown" | "insufficient_evidence" | "unresolved";
  appointment: "observed" | "not_observed" | "unknown" | "insufficient_evidence" | "unresolved";
  outcome: "observed" | "not_observed" | "unknown" | "insufficient_evidence" | "unresolved";
};

export type LeadListItem = LeadPersistenceRow & {
  id: string;
  created_at: string;
  updated_at: string;
  last_engaged_at: string | null;
  last_contacted_at: string | null;
  evidence: LeadListEvidence;
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

export async function listLeads(
  leadIds?: string[],
): Promise<LeadListItem[]> {
  const supabase = createServerSupabaseClient();

  let leadsQuery = supabase
    .from("leads")
    .select("*");

  if (leadIds && leadIds.length > 0) {
    leadsQuery = leadsQuery.in("id", leadIds);
  }

  leadsQuery = leadsQuery.order("creation_time", {
    ascending: false,
    nullsFirst: false,
  });

  const [{ data, error }, { data: timelineRecords, error: timelineError }] =
    await Promise.all([
      leadsQuery,

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

  const leadRows = (data ?? []).map((lead) => ({
    ...lead,
    last_engaged_at:
      activityByLead.get(lead.id)?.last_engaged_at ?? null,
    last_contacted_at:
      activityByLead.get(lead.id)?.last_contacted_at ?? null,
  }));

  const observations = new Map(
    leadRows.map((lead) => [
      lead.id,
      {
        outbound: "insufficient_evidence" as const,
        response: "insufficient_evidence" as const,
        appointment: "insufficient_evidence" as const,
        outcome:
          ["sold", "closed"].some((value) =>
            (lead.stage ?? "")
              .trim()
              .toLowerCase()
              .includes(value),
          )
            ? "observed" as const
            : "not_observed" as const,
      },
    ]),
  );

  return leadRows.map((lead) => {
    const observation = observations.get(lead.id);

    return {
      ...lead,
      evidence: observation?.evidence ?? {
        outbound: "insufficient_evidence",
        response: "insufficient_evidence",
        appointment: "insufficient_evidence",
        outcome: "unknown",
      },
    };
  });
}