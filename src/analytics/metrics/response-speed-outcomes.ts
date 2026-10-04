import type { TimelineAnalyticsEvent } from "../timeline/timeline-analytics-event";
import type { TimelineAnalyticsLead } from "../timeline/timeline-analytics-lead";

const BUCKETS = [
  { key: "under_5m", label: "< 5 minutes", maxMinutes: 5 },
  { key: "under_15m", label: "< 15 minutes", maxMinutes: 15 },
  { key: "under_1h", label: "< 1 hour", maxMinutes: 60 },
  { key: "under_4h", label: "< 4 hours", maxMinutes: 240 },
  { key: "under_24h", label: "< 24 hours", maxMinutes: 1440 },
] as const;

export type ResponseSpeedBucket = {
  key: string;
  label: string;
  numerator: number;
  denominator: number;
};

export type ResponseSpeedOutcomeSummary = {
  evidenceLeads: number;
  withInitialContact: number;
  responded: number;
  buckets: ResponseSpeedBucket[];
  noResponse: number;
};

export type ResponseSpeedOutcomesMetric = {
  contactedLeads: number;
  respondedLeads: number;
  overallBuckets: ResponseSpeedBucket[];
  overallNoResponse: number;
  appointments: ResponseSpeedOutcomeSummary;
  soldClosed: ResponseSpeedOutcomeSummary;
  soldClosedWithoutTimeline: number;
};

type LeadResponseObservation = {
  leadId: string;
  responseMinutes: number | null;
  appointmentEvidence: boolean;
  soldClosedStage: boolean;
};

export function calculateResponseSpeedOutcomes(
  events: TimelineAnalyticsEvent[],
  leads: TimelineAnalyticsLead[],
): ResponseSpeedOutcomesMetric {
  const eventsByRecord = groupEventsByRecord(events);
  const observations: LeadResponseObservation[] = [];

  for (const lead of leads) {
    if (!lead.timelineRecordId) {
      continue;
    }

    const recordEvents =
      eventsByRecord.get(lead.timelineRecordId) ?? [];

    const firstOutbound =
      findFirstOutboundEmployeeCommunication(recordEvents);

    if (!firstOutbound) {
      continue;
    }

    const firstInbound = findFirstInboundCommunication(
      recordEvents,
      firstOutbound.occurredAt,
    );

    observations.push({
      leadId: lead.leadId,
      responseMinutes: calculateResponseMinutes(
        firstOutbound.occurredAt,
        firstInbound?.occurredAt ?? null,
      ),
      appointmentEvidence:
        recordEvents.some(hasAppointmentEvidence),
      soldClosedStage: isSoldClosedStage(lead.stage),
    });
  }

  const appointmentObservations = observations.filter(
    (observation) => observation.appointmentEvidence,
  );

  const soldClosedLeads = leads.filter((lead) =>
    isSoldClosedStage(lead.stage),
  );

  const soldClosedObservations = observations.filter(
    (observation) => observation.soldClosedStage,
  );

  return {
    contactedLeads: observations.length,
    respondedLeads: observations.filter(
      (observation) => observation.responseMinutes !== null,
    ).length,
    overallBuckets: buildBuckets(observations),
    overallNoResponse: countNoResponse(observations),
    appointments: buildOutcomeSummary(
      appointmentObservations,
    ),
    soldClosed: buildOutcomeSummary(
      soldClosedObservations,
    ),
    soldClosedWithoutTimeline: soldClosedLeads.filter(
      (lead) => !lead.timelineRecordId,
    ).length,
  };
}

function buildOutcomeSummary(
  observations: LeadResponseObservation[],
): ResponseSpeedOutcomeSummary {
  return {
    evidenceLeads: observations.length,
    withInitialContact: observations.length,
    responded: observations.filter(
      (observation) => observation.responseMinutes !== null,
    ).length,
    buckets: buildBuckets(observations),
    noResponse: countNoResponse(observations),
  };
}

function buildBuckets(
  observations: LeadResponseObservation[],
): ResponseSpeedBucket[] {
  return BUCKETS.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    numerator: observations.filter(
      (observation) =>
        observation.responseMinutes !== null &&
        observation.responseMinutes < bucket.maxMinutes,
    ).length,
    denominator: observations.length,
  }));
}

function countNoResponse(
  observations: LeadResponseObservation[],
): number {
  return observations.filter(
    (observation) => observation.responseMinutes === null,
  ).length;
}

function groupEventsByRecord(
  events: TimelineAnalyticsEvent[],
): Map<string, TimelineAnalyticsEvent[]> {
  const grouped = new Map<string, TimelineAnalyticsEvent[]>();

  for (const event of events) {
    const existing = grouped.get(event.timelineRecordId);

    if (existing) {
      existing.push(event);
    } else {
      grouped.set(event.timelineRecordId, [event]);
    }
  }

  for (const recordEvents of grouped.values()) {
    recordEvents.sort(
      (left, right) =>
        Date.parse(left.occurredAt) -
        Date.parse(right.occurredAt),
    );
  }

  return grouped;
}

function findFirstOutboundEmployeeCommunication(
  events: TimelineAnalyticsEvent[],
): TimelineAnalyticsEvent | null {
  return (
    events.find(
      (event) =>
        event.category === "communication" &&
        event.actorType === "employee" &&
        event.direction === "outbound" &&
        event.channel !== null,
    ) ?? null
  );
}

function findFirstInboundCommunication(
  events: TimelineAnalyticsEvent[],
  exposureAt: string,
): TimelineAnalyticsEvent | null {
  const exposureTime = Date.parse(exposureAt);

  return (
    events.find((event) => {
      const occurredAt = Date.parse(event.occurredAt);

      return (
        event.category === "communication" &&
        event.direction === "inbound" &&
        occurredAt >= exposureTime
      );
    }) ?? null
  );
}

function calculateResponseMinutes(
  exposureAt: string,
  responseAt: string | null,
): number | null {
  if (!responseAt) {
    return null;
  }

  const elapsedMs =
    Date.parse(responseAt) - Date.parse(exposureAt);

  if (elapsedMs < 0) {
    return null;
  }

  return elapsedMs / 60000;
}

function hasAppointmentEvidence(
  event: TimelineAnalyticsEvent,
): boolean {
  const searchableText =
    `${event.rawType} ${event.details}`.toLowerCase();

  return searchableText.includes("appointment");
}

function isSoldClosedStage(stage: string): boolean {
  const normalizedStage = stage.trim().toLowerCase();

  return normalizedStage === "sold" ||
    normalizedStage === "closed";
}
