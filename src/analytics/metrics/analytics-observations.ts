import type {
  AnalyticsDataset,
  AnalyticsLead,
} from "@/analytics/data/analytics-repository";
import type { AnalyticsEvent } from "@/analytics/data/analytics-types";

const RESPONSE_WINDOW_MINUTES = 24 * 60;

export type ContactSpeedBucketKey =
  | "under_5m"
  | "5_to_15m"
  | "15_to_60m"
  | "1_to_4h"
  | "4_to_24h"
  | "over_24h"
  | "unknown";

export type ResponseSpeedBucketKey =
  | "under_5m"
  | "5_to_15m"
  | "15_to_60m"
  | "1_to_4h"
  | "4_to_24h"
  | "over_24h"
  | "no_response";

export type LeadObservation = {
  lead: AnalyticsLead;
  events: AnalyticsEvent[];
  firstOutbound: AnalyticsEvent | null;
  firstInbound: AnalyticsEvent | null;

  /**
   * Time from lead creation to first qualifying employee outbound.
   * Null means the lead was not contacted or either timestamp is unusable.
   */
  firstContactMinutes: number | null;

  /**
   * Time from first qualifying employee outbound to first subsequent inbound.
   */
  responseMinutes: number | null;

  respondedWithin24h: boolean;
  outboundCount: number;
  appointmentEvidence: boolean;
  soldClosed: boolean;
};

export const CONTACT_SPEED_BUCKETS: Array<{
  key: ContactSpeedBucketKey;
  label: string;
}> = [
  { key: "under_5m", label: "< 5 minutes" },
  { key: "5_to_15m", label: "5–15 minutes" },
  { key: "15_to_60m", label: "15–60 minutes" },
  { key: "1_to_4h", label: "1–4 hours" },
  { key: "4_to_24h", label: "4–24 hours" },
  { key: "over_24h", label: "> 24 hours" },
  { key: "unknown", label: "Unknown" },
];

export const RESPONSE_SPEED_BUCKETS: Array<{
  key: ResponseSpeedBucketKey;
  label: string;
}> = [
  { key: "under_5m", label: "< 5 minutes" },
  { key: "5_to_15m", label: "5–15 minutes" },
  { key: "15_to_60m", label: "15–60 minutes" },
  { key: "1_to_4h", label: "1–4 hours" },
  { key: "4_to_24h", label: "4–24 hours" },
  { key: "over_24h", label: "> 24 hours" },
  { key: "no_response", label: "No observed response" },
];

export function buildLeadObservations(
  dataset: AnalyticsDataset,
): LeadObservation[] {
  const eventsByRecord = groupEventsByRecord(dataset.events);

  return dataset.leads.map((lead) => {
    const events = lead.timelineRecordIds
      .flatMap(
        (recordId) =>
          eventsByRecord.get(recordId) ?? [],
      )
      .sort(
        (left, right) =>
          Date.parse(left.occurredAt) -
          Date.parse(right.occurredAt),
      );

    const firstOutbound =
      findFirstOutboundEmployeeCommunication(events);

    const firstInbound = firstOutbound
      ? findFirstInboundCommunication(
          events,
          firstOutbound.occurredAt,
        )
      : null;

    const firstContactMinutes =
      firstOutbound && lead.creationTime
        ? calculateElapsedMinutes(
            lead.creationTime,
            firstOutbound.occurredAt,
          )
        : null;

    const responseMinutes =
      firstOutbound && firstInbound
        ? calculateElapsedMinutes(
            firstOutbound.occurredAt,
            firstInbound.occurredAt,
          )
        : null;

    return {
      lead,
      events,
      firstOutbound,
      firstInbound,
      firstContactMinutes,
      responseMinutes,
      respondedWithin24h:
        responseMinutes !== null &&
        responseMinutes <= RESPONSE_WINDOW_MINUTES,
      outboundCount: events.filter(
        isEmployeeOutboundCommunication,
      ).length,
      appointmentEvidence:
        hasAppointmentEvidence(events),
      soldClosed: isSoldClosedStage(lead.stage),
    };
  });
}

export function findFirstOutboundEmployeeCommunication(
  events: AnalyticsEvent[],
): AnalyticsEvent | null {
  return (
    events.find(
      isEmployeeOutboundCommunication,
    ) ?? null
  );
}

export function isEmployeeOutboundCommunication(
  event: AnalyticsEvent,
): boolean {
  return (
    event.category === "communication" &&
    event.actorType === "employee" &&
    event.direction === "outbound" &&
    event.channel !== null
  );
}

export function findFirstInboundCommunication(
  events: AnalyticsEvent[],
  exposureAt: string,
): AnalyticsEvent | null {
  const exposureTime = Date.parse(exposureAt);

  if (!Number.isFinite(exposureTime)) {
    return null;
  }

  return (
    events.find((event) => {
      const occurredAt = Date.parse(event.occurredAt);

      return (
        event.category === "communication" &&
        event.direction === "inbound" &&
        Number.isFinite(occurredAt) &&
        occurredAt >= exposureTime
      );
    }) ?? null
  );
}

export function calculateElapsedMinutes(
  startAt: string,
  endAt: string,
): number | null {
  const start = Date.parse(startAt);
  const end = Date.parse(endAt);

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return null;
  }

  const elapsedMs = end - start;

  if (elapsedMs < 0) {
    return null;
  }

  return elapsedMs / 60000;
}

export function calculateResponseMinutes(
  exposureAt: string,
  responseAt: string,
): number | null {
  return calculateElapsedMinutes(
    exposureAt,
    responseAt,
  );
}

export function responseSpeedBucket(
  responseMinutes: number | null,
): ResponseSpeedBucketKey {
  if (responseMinutes === null) {
    return "no_response";
  }

  if (responseMinutes < 5) {
    return "under_5m";
  }

  if (responseMinutes <= 15) {
    return "5_to_15m";
  }

  if (responseMinutes <= 60) {
    return "15_to_60m";
  }

  if (responseMinutes <= 240) {
    return "1_to_4h";
  }

  if (responseMinutes <= 1440) {
    return "4_to_24h";
  }

  return "over_24h";
}

export function contactSpeedBucket(
  minutes: number | null,
): ContactSpeedBucketKey {
  if (minutes === null) {
    return "unknown";
  }

  if (minutes < 5) {
    return "under_5m";
  }

  if (minutes <= 15) {
    return "5_to_15m";
  }

  if (minutes <= 60) {
    return "15_to_60m";
  }

  if (minutes <= 240) {
    return "1_to_4h";
  }

  if (minutes <= 1440) {
    return "4_to_24h";
  }

  return "over_24h";
}

export function hasAppointmentEvidence(
  events: AnalyticsEvent[],
): boolean {
  return events.some((event) => {
    if (!isAppointmentStageEvidence(event)) {
      return false;
    }

    return !events.some(
      (other) =>
        other.occurredAt === event.occurredAt &&
        isDeletedAppointmentEvidence(other),
    );
  });
}

export function isAppointmentStageEvidence(
  event: AnalyticsEvent,
): boolean {
  if (event.rawType !== "Stage Changed") {
    return false;
  }

  const details = event.details.toLowerCase();

  return (
    details.includes("appt. created") &&
    !details.includes("appointment is deleted")
  );
}

function isDeletedAppointmentEvidence(
  event: AnalyticsEvent,
): boolean {
  return event.details
    .toLowerCase()
    .includes("appointment is deleted");
}

export function isSoldClosedStage(
  stage: string,
): boolean {
  const normalized = stage.trim().toLowerCase();

  return (
    normalized === "sold" ||
    normalized === "closed"
  );
}

export function median(
  values: number[],
): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort(
    (left, right) => left - right,
  );

  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (
      (sorted[middle - 1] + sorted[middle]) / 2
    );
  }

  return sorted[middle];
}

function groupEventsByRecord(
  events: AnalyticsEvent[],
): Map<string, AnalyticsEvent[]> {
  const grouped = new Map<
    string,
    AnalyticsEvent[]
  >();

  for (const event of events) {
    const existing =
      grouped.get(event.timelineRecordId);

    if (existing) {
      existing.push(event);
    } else {
      grouped.set(event.timelineRecordId, [
        event,
      ]);
    }
  }

  return grouped;
}
