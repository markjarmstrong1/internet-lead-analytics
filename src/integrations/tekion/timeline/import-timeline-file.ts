import { normalizeTimelineEvent } from "./normalize-timeline-event";
import { parseTimeline } from "./parse-timeline";
import type { TekionTimelineEvent } from "./timeline-event";

export type TekionTimelineImport = {
  sourceFile: string;
  events: TekionTimelineEvent[];
};

export function importTimelineFile(
  content: string,
  sourceFile: string,
): TekionTimelineImport {
  const parsedEvents = parseTimeline(content, sourceFile);

  return {
    sourceFile,
    events: parsedEvents.map(normalizeTimelineEvent),
  };
}
