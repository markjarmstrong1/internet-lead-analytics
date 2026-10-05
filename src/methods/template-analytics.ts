import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type TemplateMetric = {
  templateId: string;
  templateCode: string;
  name: string;
  sourceKind: "email" | "text";
  isActive: boolean;
  matchedUses: number;
  reviewUses: number;
  uniqueLeads: number;
  responses: number;
  responseRate: number | null;
  averageResponseMinutes: number | null;
  medianResponseMinutes: number | null;
  appointmentEvidenceLeads: number;
  appointmentRate: number | null;
  soldClosedLeads: number;
  soldClosedRate: number | null;
};

type TemplateRow = {
  id: string;
  template_code: string;
  name: string;
  source_kind: string | null;
  is_active: boolean;
};

type MatchRow = {
  timeline_event_id: string;
  template_id: string | null;
  match_status: "matched" | "review" | "unmatched";
};

type TimelineEventRow = {
  id: string;
  timeline_record_id: string;
  occurred_at: string;
  direction: string | null;
  details: string;
};

type TimelineRecordRow = {
  id: string;
  lead_id: string | null;
};

type LeadRow = {
  id: string;
  stage: string | null;
};

function ratio(
  numerator: number,
  denominator: number,
): number | null {
  return denominator === 0
    ? null
    : numerator / denominator;
}

function average(values: number[]): number | null {
  if (!values.length) return null;

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
}

function median(values: number[]): number | null {
  if (!values.length) return null;

  const sorted = [...values].sort(
    (a, b) => a - b,
  );

  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function isSoldClosedStage(
  stage: string | null,
): boolean {
  const normalized = (stage ?? "")
    .trim()
    .toLowerCase();

  return (
    normalized === "sold" ||
    normalized === "closed"
  );
}

function hasAppointmentEvidence(
  details: string,
): boolean {
  return /\bappt\.\s*created\b/i.test(
    details,
  );
}

export async function loadTemplateAnalytics(
  supabase: SupabaseClient,
): Promise<TemplateMetric[]> {
  const [
    templatesResult,
    matchesResult,
    eventsResult,
    recordsResult,
    leadsResult,
  ] = await Promise.all([
    supabase
      .from("templates")
      .select(
        "id,template_code,name,source_kind,is_active",
      )
      .order("source_kind")
      .order("template_code"),

    supabase
      .from("timeline_event_template_matches")
      .select(
        "timeline_event_id,template_id,match_status",
      ),

    supabase
      .from("timeline_events")
      .select(
        "id,timeline_record_id,occurred_at,direction,details",
      )
      .order("occurred_at"),

    supabase
      .from("timeline_records")
      .select("id,lead_id"),

    supabase
      .from("leads")
      .select("id,stage"),
  ]);

  for (const result of [
    templatesResult,
    matchesResult,
    eventsResult,
    recordsResult,
    leadsResult,
  ]) {
    if (result.error) {
      throw result.error;
    }
  }

  const templates =
    (templatesResult.data ?? []) as TemplateRow[];

  const matches =
    (matchesResult.data ?? []) as MatchRow[];

  const events =
    (eventsResult.data ?? []) as TimelineEventRow[];

  const records =
    (recordsResult.data ?? []) as TimelineRecordRow[];

  const leads =
    (leadsResult.data ?? []) as LeadRow[];

  const eventById = new Map(
    events.map((event) => [
      event.id,
      event,
    ]),
  );

  const recordToLead = new Map(
    records
      .filter((record) => record.lead_id)
      .map((record) => [
        record.id,
        record.lead_id as string,
      ]),
  );

  const leadById = new Map(
    leads.map((lead) => [
      lead.id,
      lead,
    ]),
  );

  const eventsByLead = new Map<
    string,
    TimelineEventRow[]
  >();

  for (const event of events) {
    const leadId = recordToLead.get(
      event.timeline_record_id,
    );

    if (!leadId) continue;

    const existing =
      eventsByLead.get(leadId);

    if (existing) {
      existing.push(event);
    } else {
      eventsByLead.set(leadId, [event]);
    }
  }

  for (const leadEvents of eventsByLead.values()) {
    leadEvents.sort(
      (a, b) =>
        new Date(a.occurred_at).getTime() -
        new Date(b.occurred_at).getTime(),
    );
  }

  const matchedByTemplate = new Map<
    string,
    MatchRow[]
  >();

  for (const match of matches) {
    if (!match.template_id) continue;

    if (
      match.match_status !== "matched" &&
      match.match_status !== "review"
    ) {
      continue;
    }

    const existing =
      matchedByTemplate.get(
        match.template_id,
      );

    if (existing) {
      existing.push(match);
    } else {
      matchedByTemplate.set(
        match.template_id,
        [match],
      );
    }
  }

  return templates.map((template) => {
    const templateMatches =
      matchedByTemplate.get(template.id) ?? [];

    const matched = templateMatches.filter(
      (match) =>
        match.match_status === "matched",
    );

    const review = templateMatches.filter(
      (match) =>
        match.match_status === "review",
    );

    const matchedLeadIds = new Set<string>();

    const responseTimes: number[] = [];

    let responses = 0;

    for (const match of matched) {
      const event =
        eventById.get(
          match.timeline_event_id,
        );

      if (!event) continue;

      const leadId = recordToLead.get(
        event.timeline_record_id,
      );

      if (!leadId) continue;

      matchedLeadIds.add(leadId);

      const leadEvents =
        eventsByLead.get(leadId) ?? [];

      const eventTime =
        new Date(event.occurred_at).getTime();

      const inbound = leadEvents.find(
        (candidate) =>
          candidate.direction === "inbound" &&
          new Date(
            candidate.occurred_at,
          ).getTime() >= eventTime,
      );

      if (inbound) {
        const responseMinutes =
          (new Date(
            inbound.occurred_at,
          ).getTime() -
            eventTime) /
          60000;

        if (responseMinutes >= 0) {
          responses += 1;
          responseTimes.push(
            responseMinutes,
          );
        }
      }
    }

    let appointmentEvidenceLeads = 0;
    let soldClosedLeads = 0;

    for (const leadId of matchedLeadIds) {
      const lead =
        leadById.get(leadId);

      if (
        lead &&
        isSoldClosedStage(lead.stage)
      ) {
        soldClosedLeads += 1;
      }

      const leadEvents =
        eventsByLead.get(leadId) ?? [];

      if (
        leadEvents.some(
          (event) =>
            hasAppointmentEvidence(
              event.details,
            ),
        )
      ) {
        appointmentEvidenceLeads += 1;
      }
    }

    return {
      templateId: template.id,
      templateCode:
        template.template_code,
      name: template.name,
      sourceKind:
        template.source_kind === "email"
          ? "email"
          : "text",
      isActive: template.is_active,
      matchedUses: matched.length,
      reviewUses: review.length,
      uniqueLeads:
        matchedLeadIds.size,
      responses,
      responseRate: ratio(
        responses,
        matched.length,
      ),
      averageResponseMinutes:
        average(responseTimes),
      medianResponseMinutes:
        median(responseTimes),
      appointmentEvidenceLeads,
      appointmentRate: ratio(
        appointmentEvidenceLeads,
        matchedLeadIds.size,
      ),
      soldClosedLeads,
      soldClosedRate: ratio(
        soldClosedLeads,
        matchedLeadIds.size,
      ),
    };
  });
}
