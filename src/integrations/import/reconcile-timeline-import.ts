import {
  reconcileImportRecords,
  type ImportReconciliationResult,
} from "./import-reconciliation";
import type { TimelineEventPersistenceRow } from "@/integrations/tekion/timeline/timeline-persistence-row";
import type { TimelineRecordPersistenceRow } from "@/integrations/tekion/timeline/timeline-persistence-row";

export type PersistedTimelineRecord = TimelineRecordPersistenceRow & {
  id: string;
};

export type PersistedTimelineEvent = TimelineEventPersistenceRow & {
  id: string;
  timeline_record_id: string;
};

export type TimelineImportReconciliation = {
  records: ImportReconciliationResult<TimelineRecordPersistenceRow>;
  events: ImportReconciliationResult<TimelineEventPersistenceRow>;
};

export function reconcileTimelineImport(
  incomingRecords: TimelineRecordPersistenceRow[],
  existingRecords: PersistedTimelineRecord[],
  incomingEvents: TimelineEventPersistenceRow[],
  existingEvents: PersistedTimelineEvent[],
): TimelineImportReconciliation {
  const records = reconcileImportRecords(
    incomingRecords,
    existingRecords,
    {
      getIdentity: getTimelineRecordPersistenceIdentity,
      isEqual: areTimelineRecordsEqual,
    },
  );

  const events = reconcileImportRecords(
    incomingEvents,
    existingEvents,
    {
      getIdentity: getTimelineEventPersistenceIdentity,
      isEqual: areTimelineEventsEqual,
    },
  );

  return {
    records,
    events,
  };
}

function getTimelineRecordPersistenceIdentity(
  record: TimelineRecordPersistenceRow,
): string | null {
  if (record.external_record_id?.trim()) {
    return [
      record.source_system,
      record.source_type,
      "external",
      record.external_record_id.trim(),
    ].join(":");
  }

  if (record.fixture_source_key?.trim()) {
    return [
      record.source_system,
      record.source_type,
      "fixture",
      record.fixture_source_key.trim(),
    ].join(":");
  }

  return null;
}

function getTimelineEventPersistenceIdentity(
  event: TimelineEventPersistenceRow,
): string | null {
  const sourceEventId = event.source_event_id.trim();

  return sourceEventId || null;
}

function areTimelineRecordsEqual(
  incoming: TimelineRecordPersistenceRow,
  existing: TimelineRecordPersistenceRow,
): boolean {
  return (
    incoming.source_system === existing.source_system &&
    incoming.source_type === existing.source_type &&
    incoming.external_record_id === existing.external_record_id &&
    incoming.fixture_source_key === existing.fixture_source_key &&
    incoming.source_file === existing.source_file &&
    JSON.stringify(incoming.raw_data) === JSON.stringify(existing.raw_data)
  );
}

function areTimelineEventsEqual(
  incoming: TimelineEventPersistenceRow,
  existing: TimelineEventPersistenceRow,
): boolean {
  return (
    incoming.source_event_id === existing.source_event_id &&
    incoming.source_file === existing.source_file &&
    incoming.occurred_at === existing.occurred_at &&
    incoming.raw_type === existing.raw_type &&
    incoming.actor === existing.actor &&
    incoming.actor_type === existing.actor_type &&
    incoming.category === existing.category &&
    incoming.channel === existing.channel &&
    incoming.direction === existing.direction &&
    incoming.details === existing.details &&
    JSON.stringify(incoming.metadata) ===
      JSON.stringify(existing.metadata) &&
    JSON.stringify(incoming.raw_data) === JSON.stringify(existing.raw_data)
  );
}
