import type {
  AnalyticsDataset,
  AnalyticsLead,
} from "@/analytics/data/analytics-repository";
import type { AnalyticsEvent } from "@/analytics/data/analytics-types";
import {
  buildEvidenceAssessments,
  type ObservationEvidenceAssessments,
} from "./evidence-assessments";
import {
  findFirstInboundCommunication,
  isEmployeeOutboundCommunication,
} from "./communication-evidence";

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

export type TemplateSource =
  | "explicit"
  | "email_subject"
  | "none";

export type LeadAction = {
  event: AnalyticsEvent;
  actionType: string;
  channel: string | null;
  template: string | null;
  templateCode: string | null;
  templateSource: TemplateSource;
};

export type LeadObservation = {
  lead: AnalyticsLead;
  events: AnalyticsEvent[];

  firstOutbound: AnalyticsEvent | null;
  firstInbound: AnalyticsEvent | null;

  firstAction: LeadAction | null;
  responseAction: LeadAction | null;

  outboundActions: LeadAction[];
  templateActions: LeadAction[];

  firstContactedTime: string | null;
  firstContactMinutes: number | null;
  responseMinutes: number | null;

  outboundAttemptsBeforeResponse: number | null;

  appointmentAt: string | null;
  soldClosedAt: string | null;

  evidence: ObservationEvidenceAssessments;

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
      );

    return buildLeadObservation(
      lead,
      deduplicateOverlappingRecordEvents(events),
    );
  });
}

export function buildLeadObservation(
  lead: AnalyticsLead,
  events: AnalyticsEvent[],
): LeadObservation {
  const orderedEvents = [...events].sort(
    (left, right) =>
      Date.parse(left.occurredAt) -
      Date.parse(right.occurredAt),
  );

  const outboundActions = orderedEvents
    .filter(isEmployeeOutboundCommunication)
    .map(buildLeadAction);

  const firstOutbound =
    outboundActions[0]?.event ?? null;

  const firstAction =
    outboundActions[0] ?? null;

  const firstInbound = firstOutbound
    ? findFirstInboundCommunication(
        orderedEvents,
        firstOutbound.occurredAt,
      )
    : null;

  const responseAction = firstInbound
    ? findLastOutboundAtOrBefore(
        outboundActions,
        firstInbound.occurredAt,
      )
    : null;

  /*
   * Contact status and speed come from the lead export's
   * First Contacted Time. Timeline evidence is separate:
   * it explains what happened after contact.
   */
  const firstContactedTime =
    lead.firstContactedTime ?? null;

  const firstContactMinutes =
    firstContactedTime && lead.creationTime
      ? calculateElapsedMinutes(
          lead.creationTime,
          firstContactedTime,
        )
      : null;

  const responseMinutes =
    firstOutbound && firstInbound
      ? calculateElapsedMinutes(
          firstOutbound.occurredAt,
          firstInbound.occurredAt,
        )
      : null;

  const appointmentAt =
    findAppointmentEvidenceAt(orderedEvents);

  const soldClosed =
    isSoldClosedStage(lead.stage);

  const soldClosedAt =
    soldClosed
      ? lead.soldDate ??
        lead.closedTime ??
        findObservedSoldClosedAt(orderedEvents)
      : null;

  const actionsBeforeResponse =
    firstInbound
      ? outboundActions.filter(
          (action) =>
            Date.parse(action.event.occurredAt) <=
            Date.parse(firstInbound.occurredAt),
        ).length
      : null;

  const evidence = buildEvidenceAssessments({
    hasTimelineEvents: orderedEvents.length > 0,
    firstContactedTime,
    firstOutbound,
    firstInbound,
    appointmentAt,
    soldClosed,
  });

  return {
    lead,
    events: orderedEvents,
    firstOutbound,
    firstInbound,
    firstAction,
    responseAction,
    outboundActions,
    templateActions:
      outboundActions.filter(
        (action) => action.templateCode !== null,
      ),
    firstContactedTime,
    firstContactMinutes,
    responseMinutes,
    outboundAttemptsBeforeResponse:
      actionsBeforeResponse,
    appointmentAt,
    soldClosedAt,
    evidence,
    respondedWithin24h:
      responseMinutes !== null &&
      responseMinutes <= RESPONSE_WINDOW_MINUTES,
    outboundCount: outboundActions.length,
    appointmentEvidence:
      appointmentAt !== null,
    soldClosed,
  };
}

export function buildLeadAction(
  event: AnalyticsEvent,
): LeadAction {
  const template = extractTemplate(event);

  return {
    event,
    actionType:
      event.rawType.trim() || "Unknown action",
    channel: event.channel,
    template: template.value,
    templateCode:
      event.templateCode?.trim() || null,
    templateSource: template.source,
  };
}

export function extractTemplate(
  event: AnalyticsEvent,
): {
  value: string | null;
  source: TemplateSource;
} {
  const explicitKeys = [
    "templateName",
    "template_name",
    "template",
    "templateId",
    "template_id",
  ];

  for (const key of explicitKeys) {
    const value =
      readString(event.metadata?.[key]) ??
      readString(event.rawData?.[key]);

    if (value) {
      return {
        value,
        source: "explicit",
      };
    }
  }

  if (event.channel === "email") {
    const subject = extractEmailSubject(
      event.details,
    );

    if (subject) {
      return {
        value: subject,
        source: "email_subject",
      };
    }
  }

  return {
    value: null,
    source: "none",
  };
}

function extractEmailSubject(
  details: string,
): string | null {
  const match = details.match(
    /(?:^|\n)Subject:\s*(.+?)(?:\n|$)/i,
  );

  return match?.[1]?.trim() || null;
}

function readString(
  value: unknown,
): string | null {
  return typeof value === "string" &&
    value.trim()
    ? value.trim()
    : null;
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

function findLastOutboundAtOrBefore(
  actions: LeadAction[],
  inboundAt: string,
): LeadAction | null {
  const inboundTime = Date.parse(inboundAt);

  if (!Number.isFinite(inboundTime)) {
    return null;
  }

  let responseAction: LeadAction | null = null;

  for (const action of actions) {
    const actionTime = Date.parse(
      action.event.occurredAt,
    );

    if (
      Number.isFinite(actionTime) &&
      actionTime <= inboundTime
    ) {
      responseAction = action;
    }
  }

  return responseAction;
}

export function calculateElapsedMinutes(
  startAt: string,
  endAt: string,
): number | null {
  const start = Date.parse(startAt);
  const end = Date.parse(endAt);

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end)
  ) {
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
  return findAppointmentEvidenceAt(events) !== null;
}

export function findAppointmentEvidenceAt(
  events: AnalyticsEvent[],
): string | null {
  const event = events.find((candidate) => {
    if (!isAppointmentStageEvidence(candidate)) {
      return false;
    }

    return !events.some(
      (other) =>
        other.occurredAt === candidate.occurredAt &&
        isDeletedAppointmentEvidence(other),
    );
  });

  return event?.occurredAt ?? null;
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

function findObservedSoldClosedAt(
  events: AnalyticsEvent[],
): string | null {
  const event = events.find((candidate) => {
    if (
      candidate.rawType !== "Stage Changed" &&
      candidate.rawType !== "Status Changed"
    ) {
      return false;
    }

    const details = candidate.details.toLowerCase();

    return (
      details.includes("sold") ||
      details.includes("closed")
    );
  });

  return event?.occurredAt ?? null;
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

export function average(
  values: number[],
): number | null {
  if (values.length === 0) {
    return null;
  }

  return (
    values.reduce(
      (total, value) => total + value,
      0,
    ) / values.length
  );
}

function normalizeDuplicateSignatureValue(
  value: string | null | undefined,
): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function deduplicateOverlappingRecordEvents(
  events: AnalyticsEvent[],
): AnalyticsEvent[] {
  const eventsBySignature = new Map<
    string,
    Map<string, AnalyticsEvent[]>
  >();

  for (const event of events) {
    const signature = JSON.stringify([
      normalizeDuplicateSignatureValue(event.occurredAt),
      normalizeDuplicateSignatureValue(event.rawType),
      normalizeDuplicateSignatureValue(event.actor),
      normalizeDuplicateSignatureValue(event.actorType),
      normalizeDuplicateSignatureValue(event.category),
      normalizeDuplicateSignatureValue(event.channel),
      normalizeDuplicateSignatureValue(event.direction),
      normalizeDuplicateSignatureValue(event.details),
      normalizeDuplicateSignatureValue(event.templateCode),
    ]);

    let eventsByRecord = eventsBySignature.get(signature);

    if (!eventsByRecord) {
      eventsByRecord = new Map<string, AnalyticsEvent[]>();
      eventsBySignature.set(signature, eventsByRecord);
    }

    const recordEvents =
      eventsByRecord.get(event.timelineRecordId) ?? [];

    recordEvents.push(event);
    eventsByRecord.set(event.timelineRecordId, recordEvents);
  }

  const retainedEvents: AnalyticsEvent[] = [];

  for (const eventsByRecord of eventsBySignature.values()) {
    let largestRecordGroup: AnalyticsEvent[] = [];

    for (const recordEvents of eventsByRecord.values()) {
      if (recordEvents.length > largestRecordGroup.length) {
        largestRecordGroup = recordEvents;
      }
    }

    retainedEvents.push(...largestRecordGroup);
  }

  return retainedEvents;
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
