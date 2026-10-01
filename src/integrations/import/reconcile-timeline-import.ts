import {
  reconcileImportRecords,
  type ImportReconciliationItem,
  type ImportReconciliationResult,
} from "./import-reconciliation";
import type {
  TimelineEventPersistenceRow,
  TimelineRecordPersistenceRow,
} from "@/integrations/tekion/timeline/timeline-persistence-row";

export type PersistedTimelineRecord = TimelineRecordPersistenceRow & {
  id: string;
};

export type PersistedTimelineEvent = TimelineEventPersistenceRow & {
  id: string;
  timeline_record_id: string;
};

export type TimelineImportEvent = {
  recordIdentity: string;
  event: TimelineEventPersistenceRow;
};

export type TimelineImportReconciliation = {
  records: ImportReconciliationResult<TimelineRecordPersistenceRow>;
  events: ImportReconciliationResult<TimelineEventPersistenceRow>;
};

export function reconcileTimelineImport(
  incomingRecords: TimelineRecordPersistenceRow[],
  existingRecords: PersistedTimelineRecord[],
  incomingEvents: TimelineImportEvent[],
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

  const recordIdentityById = new Map<string, string>();

  for (const record of existingRecords) {
    const identity = getTimelineRecordPersistenceIdentity(record);

    if (identity) {
      recordIdentityById.set(record.id, identity);
    }
  }

  const existingEventsByRecordIdentity = new Map<
    string,
    PersistedTimelineEvent[]
  >();

  for (const event of existingEvents) {
    const recordIdentity = recordIdentityById.get(event.timeline_record_id);

    if (!recordIdentity) {
      continue;
    }

    const events = existingEventsByRecordIdentity.get(recordIdentity) ?? [];
    events.push(event);
    existingEventsByRecordIdentity.set(recordIdentity, events);
  }

  const incomingEventsByRecordIdentity = new Map<
    string,
    TimelineEventPersistenceRow[]
  >();

  for (const item of incomingEvents) {
    const events = incomingEventsByRecordIdentity.get(item.recordIdentity) ?? [];
    events.push(item.event);
    incomingEventsByRecordIdentity.set(item.recordIdentity, events);
  }

  const eventItems: ImportReconciliationItem<TimelineEventPersistenceRow>[] =
    [];

  for (const [recordIdentity, events] of incomingEventsByRecordIdentity) {
    const result = reconcileImportRecords(
      events,
      existingEventsByRecordIdentity.get(recordIdentity) ?? [],
      {
        getIdentity: getTimelineEventPersistenceIdentity,
        isEqual: areTimelineEventsEqual,
      },
    );

    eventItems.push(...result.items);
  }

  return {
    records,
    events: buildReconciliationResult(eventItems),
  };
}

function buildReconciliationResult<T>(
  items: ImportReconciliationItem<T>[],
): ImportReconciliationResult<T> {
  return {
    items,
    summary: {
      total: items.length,
      newCount: items.filter((item) => item.status === "new").length,
      updatedCount: items.filter((item) => item.status === "updated").length,
      unchangedCount: items.filter((item) => item.status === "unchanged")
        .length,
      invalidCount: items.filter((item) => item.status === "invalid").length,
    },
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
