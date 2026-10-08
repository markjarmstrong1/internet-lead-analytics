import type { AnalyticsEvent } from "./analytics-types";

export type CrossRecordDuplicateCandidate = {
  timelineRecordIds: string[];
  sourceFiles: string[];
  sourceEventIds: string[];
  matchingEventCount: number;
};

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function eventSignature(event: AnalyticsEvent): string {
  return JSON.stringify([
    event.occurredAt,
    normalize(event.rawType),
    normalize(event.actor),
    normalize(event.actorType),
    normalize(event.category),
    normalize(event.channel),
    normalize(event.direction),
    normalize(event.details),
  ]);
}

/**
 * Finds exact normalized event matches across distinct timeline records.
 * This is diagnostic only: it never removes or suppresses events.
 */
export function findCrossRecordDuplicateCandidates(
  events: AnalyticsEvent[],
): CrossRecordDuplicateCandidate[] {
  const groups = new Map<string, AnalyticsEvent[]>();

  for (const event of events) {
    const signature = eventSignature(event);
    const group = groups.get(signature) ?? [];
    group.push(event);
    groups.set(signature, group);
  }

  return [...groups.values()]
    .filter(
      (group) =>
        new Set(group.map((event) => event.timelineRecordId)).size > 1,
    )
    .map((group) => ({
      timelineRecordIds: [
        ...new Set(group.map((event) => event.timelineRecordId)),
      ].sort(),
      sourceFiles: [
        ...new Set(
          group
            .map((event) => event.sourceFile)
            .filter((file): file is string => Boolean(file)),
        ),
      ].sort(),
      sourceEventIds: [...new Set(group.map((event) => event.sourceEventId))].sort(),
      matchingEventCount: group.length,
    }));
}
