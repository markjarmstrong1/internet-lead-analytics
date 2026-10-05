import type { TimelineDatabase } from "@/integrations/tekion/timeline/timeline-database";

import type {
  AnalyticsCommunicationChannel,
  AnalyticsCommunicationDirection,
  AnalyticsEvent,
} from "./analytics-types";

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

type PersistedAnalyticsEvent =
  TimelineDatabase["public"]["Tables"]["timeline_events"]["Row"];

export function buildAnalyticsEvents(
  events: PersistedAnalyticsEvent[],
): AnalyticsEvent[] {
  return events.map((event) => ({
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
    metadata: event.metadata ?? {},
    rawData: event.raw_data ?? {},
  }));
}

function normalizeChannel(
  channel: string | null,
): AnalyticsCommunicationChannel | null {
  if (
    !channel ||
    !CHANNELS.has(channel as AnalyticsCommunicationChannel)
  ) {
    return null;
  }

  return channel as AnalyticsCommunicationChannel;
}

function normalizeDirection(
  direction: string | null,
): AnalyticsCommunicationDirection | null {
  if (
    !direction ||
    !DIRECTIONS.has(
      direction as AnalyticsCommunicationDirection,
    )
  ) {
    return null;
  }

  return direction as AnalyticsCommunicationDirection;
}
