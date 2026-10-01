import { assignTimelineEventIdentities } from "./assign-timeline-event-identities";
import { normalizeTimelineEvent } from "./normalize-timeline-event";
import { parseTimeline } from "./parse-timeline";
import type { TekionNormalizedTimelineEvent } from "./normalized-timeline-event";

export type TekionTimelineImport = {
  sourceFile: string;
  events: TekionNormalizedTimelineEvent[];
};

export function importTimelineFile(
  content: string,
  sourceFile: string,
): TekionTimelineImport {
  const parsedEvents = parseTimeline(content, sourceFile);

  const normalizedEvents = parsedEvents.map(normalizeTimelineEvent);

  return {
    sourceFile,
    events: assignTimelineEventIdentities(normalizedEvents),
  };
}
