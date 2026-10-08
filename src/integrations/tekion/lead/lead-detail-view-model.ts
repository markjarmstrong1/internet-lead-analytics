import type {
  LeadDetail,
  LeadTimelineEvent,
  LeadTimelineRecord,
} from "./lead-detail-repository";
  buildLeadDetailObservation,
  findLeadDetailAppointmentEvidenceEvent,
} from "./lead-detail-observation";
import {
  buildLeadDetailObservation,
  findLeadDetailAppointmentEvidenceEvent,
} from "./lead-detail-observation";

export type LeadDetailViewModel = {
  events: LeadTimelineEvent[];
  communicationEvents: LeadTimelineEvent[];
  inboundEvents: LeadTimelineEvent[];
  outboundEvents: LeadTimelineEvent[];
  appointmentEvidenceEvent: LeadTimelineEvent | null;
  sourceFiles: string[];
  timelineRecordCount: number;
  firstOutbound: LeadTimelineEvent | null;
  lastInbound: LeadTimelineEvent | null;
  lastOutbound: LeadTimelineEvent | null;
  observation: LeadObservation;
};

function isValidDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

function compareNewestFirst(
  left: LeadTimelineEvent,
  right: LeadTimelineEvent,
): number {
  return (
    new Date(right.occurred_at).getTime() -
    new Date(left.occurred_at).getTime()
  );
}

function isCommunication(event: LeadTimelineEvent): boolean {
  return (
    event.category === "communication" &&
    (event.direction === "inbound" ||
      event.direction === "outbound") &&
    isValidDate(event.occurred_at)
  );
}

export function getLeadTimelineEvents(
  timeline: LeadTimelineRecord[],
): LeadTimelineEvent[] {
  return timeline
    .flatMap((record) => record.events)
    .filter(
      (event) =>
        Boolean(event.id) &&
        Boolean(event.occurred_at) &&
        isValidDate(event.occurred_at),
    )
    .sort(compareNewestFirst);
}

export function buildLeadDetailViewModel(
  lead: LeadDetail,
  timeline: LeadTimelineRecord[],
): LeadDetailViewModel {
  const events = getLeadTimelineEvents(timeline);

  const observation =
    buildLeadDetailObservation(
      lead,
      events,
    );

  const communicationEvents = events.filter(isCommunication);

  const inboundEvents = communicationEvents.filter(
    (event) => event.direction === "inbound",
  );

  const outboundEvents = communicationEvents.filter(
    (event) => event.direction === "outbound",
  );

  const appointmentEvidenceEvent =
    findLeadDetailAppointmentEvidenceEvent(events);

  const sourceFiles = [
    ...new Set(
      timeline
        .map((record) => record.source_file)
        .filter(
          (sourceFile): sourceFile is string =>
            Boolean(sourceFile),
        ),
    ),
  ];

  return {
    events,
    communicationEvents,
    inboundEvents,
    outboundEvents,
    appointmentEvidenceEvent,
    sourceFiles,
    timelineRecordCount: timeline.length,
    firstOutbound:
      [...outboundEvents].reverse()[0] ?? null,
    lastInbound: inboundEvents[0] ?? null,
    lastOutbound: outboundEvents[0] ?? null,
    observation,
  };
}

export function getRawString(
  rawData: Record<string, unknown>,
  key: string,
): string | null {
  const value = rawData[key];

  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

export function formatDateTime(
  value: string | null,
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}

export function getCommunicationLabel(
  event: LeadTimelineEvent | null,
): string {
  if (!event) {
    return "—";
  }

  return (
    event.channel ||
    event.raw_type ||
    "Observed communication"
  );
}
