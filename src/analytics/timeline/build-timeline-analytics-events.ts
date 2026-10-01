import type { PersistedTimelineEvent } from "@/integrations/import/reconcile-timeline-import";
import type {
  TimelineAnalyticsCommunicationChannel,
  TimelineAnalyticsCommunicationDirection,
  TimelineAnalyticsEvent,
} from "./timeline-analytics-event";

const CHANNELS = new Set<TimelineAnalyticsCommunicationChannel>([
  "email",
  "text",
  "phone",
  "voicemail",
]);

const DIRECTIONS = new Set<TimelineAnalyticsCommunicationDirection>([
  "inbound",
  "outbound",
  "unknown",
]);

export function buildTimelineAnalyticsEvents(
  events: PersistedTimelineEvent[],
): TimelineAnalyticsEvent[] {
  return events.map((event) => ({
    timelineRecordId: event.timeline_record_id,
    sourceEventId: event.source_event_id,
    occurredAt: event.occurred_at,
    category: event.category,
    actorType: event.actor_type,
    channel: normalizeChannel(event.channel),
    direction: normalizeDirection(event.direction),
  }));
}

function normalizeChannel(
  channel: string | null,
): TimelineAnalyticsCommunicationChannel | null {
  if (!channel || !CHANNELS.has(channel as TimelineAnalyticsCommunicationChannel)) {
    return null;
  }

  return channel as TimelineAnalyticsCommunicationChannel;
}

function normalizeDirection(
  direction: string | null,
): TimelineAnalyticsCommunicationDirection | null {
  if (
    !direction ||
    !DIRECTIONS.has(
      direction as TimelineAnalyticsCommunicationDirection,
    )
  ) {
    return null;
  }

  return direction as TimelineAnalyticsCommunicationDirection;
}
