import {
  reconcileImportRecords,
  type ImportReconciliationResult,
} from "@/integrations/import/import-reconciliation";
import type { TekionNormalizedTimelineEvent } from "./normalized-timeline-event";
import { getTimelineEventIdentity } from "./timeline-event-identity";

export function reconcileTimelineEvents(
  incomingEvents: TekionNormalizedTimelineEvent[],
  existingEvents: TekionNormalizedTimelineEvent[],
): ImportReconciliationResult<TekionNormalizedTimelineEvent> {
  return reconcileImportRecords(incomingEvents, existingEvents, {
    getIdentity: getTimelineEventIdentity,
    isEqual: areTimelineEventsEqual,
  });
}

function areTimelineEventsEqual(
  incoming: TekionNormalizedTimelineEvent,
  existing: TekionNormalizedTimelineEvent,
): boolean {
  return (
    incoming.sourceEventId === existing.sourceEventId &&
    incoming.sourceFile === existing.sourceFile &&
    incoming.rawType === existing.rawType &&
    incoming.occurredAt === existing.occurredAt &&
    incoming.actor === existing.actor &&
    incoming.details === existing.details &&
    incoming.category === existing.category &&
    incoming.communicationChannel === existing.communicationChannel &&
    incoming.communicationDirection === existing.communicationDirection &&
    incoming.actorType === existing.actorType
  );
}
