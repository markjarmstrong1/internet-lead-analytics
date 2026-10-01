import type { TimelineAnalyticsEvent } from "../timeline/timeline-analytics-event";
import type {
  ReportableMetric,
  ReportableMetricBreakdown,
  ReportableMetricEvidence,
} from "./reportable-metric";

const RESPONSE_WINDOW_HOURS = 24;
const RESPONSE_WINDOW_MS =
  RESPONSE_WINDOW_HOURS * 60 * 60 * 1000;

const CHANNELS = [
  "email",
  "text",
  "phone",
  "voicemail",
] as const;

type Channel = (typeof CHANNELS)[number];

export function calculateFirstOutboundResponseRate(
  events: TimelineAnalyticsEvent[],
): ReportableMetric {
  const eventsByRecord = groupEventsByRecord(events);
  const evidence: ReportableMetricEvidence[] = [];

  for (const recordEvents of eventsByRecord.values()) {
    const exposure = findFirstOutboundEmployeeCommunication(
      recordEvents,
    );

    if (!exposure) {
      continue;
    }

    const response = findFirstInboundCommunication(
      recordEvents,
      exposure.occurredAt,
    );

    evidence.push({
      timelineRecordId: exposure.timelineRecordId,
      exposureEventId: exposure.sourceEventId,
      outcomeEventId: response?.sourceEventId ?? null,
      exposureAt: exposure.occurredAt,
      outcomeAt: response?.occurredAt ?? null,
    });
  }

  const denominator = evidence.length;
  const numerator = evidence.filter(
    (item) => item.outcomeEventId !== null,
  ).length;

  const breakdowns = CHANNELS.map((channel) =>
    buildChannelBreakdown(channel, evidence, events),
  );

  return {
    id: "first_outbound_response_rate_24h",
    title:
      "Customer response rate after first outbound employee communication",
    classification: "descriptive",
    denominator,
    numerator,
    rate: calculateRate(numerator, denominator),
    windowHours: RESPONSE_WINDOW_HOURS,
    breakdowns,
    evidence,
    limitations: [
      "This is an observational descriptive metric.",
      "It does not establish that the outbound communication caused the response.",
      "Only the first qualifying outbound employee communication per timeline record is used as the exposure.",
      "A response is defined as the first inbound communication within 24 hours after exposure.",
    ],
  };
}

function groupEventsByRecord(
  events: TimelineAnalyticsEvent[],
): Map<string, TimelineAnalyticsEvent[]> {
  const grouped = new Map<string, TimelineAnalyticsEvent[]>();

  for (const event of events) {
    const existing = grouped.get(event.timelineRecordId);

    if (existing) {
      existing.push(event);
      continue;
    }

    grouped.set(event.timelineRecordId, [event]);
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
        occurredAt >= exposureTime &&
        occurredAt <= exposureTime + RESPONSE_WINDOW_MS
      );
    }) ?? null
  );
}

function buildChannelBreakdown(
  channel: Channel,
  evidence: ReportableMetricEvidence[],
  events: TimelineAnalyticsEvent[],
): ReportableMetricBreakdown {
  const exposuresById = new Map(
    events
      .filter(
        (event) =>
          event.sourceEventId !== "" &&
          event.channel === channel &&
          event.category === "communication" &&
          event.actorType === "employee" &&
          event.direction === "outbound",
      )
      .map((event) => [event.sourceEventId, event]),
  );

  const channelEvidence = evidence.filter((item) =>
    exposuresById.has(item.exposureEventId),
  );

  const denominator = channelEvidence.length;
  const numerator = channelEvidence.filter(
    (item) => item.outcomeEventId !== null,
  ).length;

  return {
    key: channel,
    label: channel,
    denominator,
    numerator,
    rate: calculateRate(numerator, denominator),
  };
}

function calculateRate(
  numerator: number,
  denominator: number,
): number | null {
  if (denominator === 0) {
    return null;
  }

  return numerator / denominator;
}
