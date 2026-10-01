import type { TekionNormalizedTimelineEvent } from "./normalized-timeline-event";

export function assignTimelineEventIdentities(
  events: TekionNormalizedTimelineEvent[],
): TekionNormalizedTimelineEvent[] {
  const occurrences = new Map<string, number>();

  return events.map((event) => {
    const occurrence = (occurrences.get(event.sourceEventId) ?? 0) + 1;

    occurrences.set(event.sourceEventId, occurrence);

    return {
      ...event,
      sourceEventId:
        occurrence === 1
          ? event.sourceEventId
          : `${event.sourceEventId}:occurrence:${occurrence}`,
    };
  });
}
