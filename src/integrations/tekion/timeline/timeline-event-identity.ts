import type { TekionNormalizedTimelineEvent } from "./normalized-timeline-event";

export function getTimelineEventIdentity(
  event: TekionNormalizedTimelineEvent,
): string | null {
  const identity = event.sourceEventId.trim();

  return identity || null;
}
