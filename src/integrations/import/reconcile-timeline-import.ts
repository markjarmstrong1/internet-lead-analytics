import {
  reconcileImportRecords,
  type ImportReconciliationItem,
  type ImportReconciliationResult,
} from "./import-reconciliation";
import {
  areIsoTimestampsEqual,
  areJsonValuesEqual,
} from "./values-equal";
import {
  getTimelineEventPersistenceIdentity,
  getTimelineRecordPersistenceIdentity,
} from "./timeline-persistence-identity";
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

export type TimelineEventReconciliationItem = {
  status: ImportReconciliationItem<TimelineEventPersistenceRow>["status"];
  recordIdentity: string;
  incoming: TimelineEventPersistenceRow;
  existing?: PersistedTimelineEvent;
  reason?: string;
};

export type TimelineEventReconciliationResult = {
  items: TimelineEventReconciliationItem[];
  summary: ImportReconciliationResult<TimelineEventPersistenceRow>["summary"];
};

export type TimelineImportReconciliation = {
  records: ImportReconciliationResult<
    TimelineRecordPersistenceRow,
    PersistedTimelineRecord
  >;
  events: TimelineEventReconciliationResult;
};

export function reconcileTimelineImport(
  incomingRecords: TimelineRecordPersistenceRow[],
  existingRecords: PersistedTimelineRecord[],
  incomingEvents: TimelineImportEvent[],
  existingEvents: PersistedTimelineEvent[],
): TimelineImportReconciliation {
  const records = reconcileImportRecords<
    TimelineRecordPersistenceRow,
    PersistedTimelineRecord
  >(
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

  const eventItems: TimelineEventReconciliationItem[] = [];

  for (const [recordIdentity, events] of incomingEventsByRecordIdentity) {
    const uniqueIncomingEvents =
      deduplicateIncomingTimelineEvents(
        recordIdentity,
        events,
      );

    const result = reconcileImportRecords<
      TimelineEventPersistenceRow,
      PersistedTimelineEvent
    >(
      uniqueIncomingEvents,
      existingEventsByRecordIdentity.get(recordIdentity) ?? [],
      {
        getIdentity: getTimelineEventPersistenceIdentity,
        isEqual: areTimelineEventsEqual,
      },
    );

    eventItems.push(
      ...result.items.map((item) => ({
        status: item.status,
        recordIdentity,
        incoming: item.incoming,
        existing: item.existing,
        reason: item.reason,
      })),
    );
  }

  return {
    records,
    events: {
      items: eventItems,
      summary: summarizeEventItems(eventItems),
    },
  };
}

function deduplicateIncomingTimelineEvents(
  recordIdentity: string,
  events: TimelineEventPersistenceRow[],
): TimelineEventPersistenceRow[] {
  const eventsByIdentity = new Map<
    string,
    TimelineEventPersistenceRow
  >();

  for (const event of events) {
    const identity =
      getTimelineEventPersistenceIdentity(event);

    if (!identity) {
      continue;
    }

    const existing = eventsByIdentity.get(identity);

    if (!existing) {
      eventsByIdentity.set(identity, event);
      continue;
    }

    if (!areTimelineEventsEqual(event, existing)) {
      throw new Error(
        [
          "Incoming Tekion timeline events have a persistence identity collision.",
          `Timeline record: ${recordIdentity}`,
          `Event identity: ${identity}`,
          "The same event identity was received with different payloads.",
        ].join(" "),
      );
    }
  }

  return Array.from(eventsByIdentity.values());
}

function summarizeEventItems(
  items: TimelineEventReconciliationItem[],
) {
  return {
    total: items.length,
    newCount: items.filter((item) => item.status === "new").length,
    updatedCount: items.filter((item) => item.status === "updated").length,
    unchangedCount: items.filter((item) => item.status === "unchanged")
      .length,
    invalidCount: items.filter((item) => item.status === "invalid").length,
  };
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
    areJsonValuesEqual(
      incoming.raw_data,
      existing.raw_data,
    )
  );
}

function areTimelineEventsEqual(
  incoming: TimelineEventPersistenceRow,
  existing: TimelineEventPersistenceRow,
): boolean {
  return (
    incoming.source_event_id === existing.source_event_id &&
    incoming.source_file === existing.source_file &&
    areIsoTimestampsEqual(
      incoming.occurred_at,
      existing.occurred_at,
    ) &&
    incoming.raw_type === existing.raw_type &&
    incoming.actor === existing.actor &&
    incoming.actor_type === existing.actor_type &&
    incoming.category === existing.category &&
    incoming.channel === existing.channel &&
    incoming.direction === existing.direction &&
    incoming.details === existing.details &&
    areJsonValuesEqual(
      incoming.metadata,
      existing.metadata,
    ) &&
    areJsonValuesEqual(
      incoming.raw_data,
      existing.raw_data,
    )
  );
}
