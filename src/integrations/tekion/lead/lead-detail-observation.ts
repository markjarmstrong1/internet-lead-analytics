import type {
  AnalyticsEvent,
  AnalyticsCommunicationChannel,
  AnalyticsCommunicationDirection,
} from "@/analytics/data/analytics-types";
import type { AnalyticsLead } from "@/analytics/data/analytics-repository";
import {
  buildLeadObservation,
  type LeadObservation,
} from "@/analytics/observations/analytics-observations";

import type {
  LeadDetail,
  LeadTimelineEvent,
} from "./lead-detail-repository";

const CHANNELS = new Set<AnalyticsCommunicationChannel>([
  "email",
  "text",
  "phone",
  "voicemail",
]);

const DIRECTIONS = new Set<AnalyticsCommunicationDirection>([
  "inbound",
  "outbound",
  "unknown",
]);

function normalizeChannel(
  value: string | null,
): AnalyticsCommunicationChannel | null {
  return value && CHANNELS.has(
    value as AnalyticsCommunicationChannel,
  )
    ? (value as AnalyticsCommunicationChannel)
    : null;
}

function normalizeDirection(
  value: string | null,
): AnalyticsCommunicationDirection | null {
  return value && DIRECTIONS.has(
    value as AnalyticsCommunicationDirection,
  )
    ? (value as AnalyticsCommunicationDirection)
    : null;
}

function extractFirstContactedTime(
  rawData: Record<string, unknown>,
): string | null {
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

function toAnalyticsLead(
  lead: LeadDetail,
): AnalyticsLead {
  return {
    leadId: lead.id,
    contactName: lead.contact_name,
    source: lead.source,
    sourceGroup: lead.lead_source_group,
    stage: lead.stage,
    status: lead.status,
    creationTime: lead.creation_time,
    firstContactedTime:
      extractFirstContactedTime(lead.raw_data),
    soldDate: lead.sold_date,
    closedTime: lead.closed_time,
    timelineRecordIds: [],
  };
}

function toAnalyticsEvent(
  event: LeadTimelineEvent,
): AnalyticsEvent {
  return {
    timelineRecordId: event.timeline_record_id,
    sourceEventId: event.source_event_id,
    sourceFile: event.source_file,
    occurredAt: event.occurred_at,
    rawType: event.raw_type,
    actor: event.actor,
    actorType: event.actor_type,
    category: event.category,
    channel: normalizeChannel(event.channel),
    direction: normalizeDirection(event.direction),
    details: event.details,
    templateCode: null,
    metadata: event.metadata,
    rawData: event.raw_data,
  };
}

export function buildLeadDetailObservation(
  lead: LeadDetail,
  events: LeadTimelineEvent[],
): LeadObservation {
  return buildLeadObservation(
    toAnalyticsLead(lead),
    events.map(toAnalyticsEvent),
  );
}

export function findLeadDetailAppointmentEvidenceEvent(
  events: LeadTimelineEvent[],
): LeadTimelineEvent | null {
  const analyticsEvents = events.map(toAnalyticsEvent);

  const appointmentEvent = analyticsEvents.find((event) => {
    if (
      event.rawType !== "Stage Changed" ||
      !event.details.toLowerCase().includes("appt. created") ||
      event.details.toLowerCase().includes("appointment is deleted")
    ) {
      return false;
    }

    return !analyticsEvents.some(
      (other) =>
        other.occurredAt === event.occurredAt &&
        other.rawType === "Stage Changed" &&
        other.details
          .toLowerCase()
          .includes("appointment is deleted"),
    );
  });

  if (!appointmentEvent) {
    return null;
  }

  const index = analyticsEvents.indexOf(appointmentEvent);

  return events[index] ?? null;
}
