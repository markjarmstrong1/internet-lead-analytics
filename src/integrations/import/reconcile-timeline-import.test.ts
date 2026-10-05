import { describe, expect, it } from "vitest";
import {
  reconcileTimelineImport,
  type PersistedTimelineEvent,
  type PersistedTimelineRecord,
  type TimelineImportEvent,
} from "./reconcile-timeline-import";
import type {
  TimelineEventPersistenceRow,
  TimelineRecordPersistenceRow,
} from "@/integrations/tekion/timeline/timeline-persistence-row";

function createRecord(
  overrides: Partial<TimelineRecordPersistenceRow> = {},
): TimelineRecordPersistenceRow {
  return {
    source_system: "tekion",
    lead_id: null,
    source_type: "timeline",
    external_record_id: null,
    fixture_source_key: "fixtures/ana_yu.txt",
    source_file: "fixtures/ana_yu.txt",
    raw_data: {
      sourceKey: "fixtures/ana_yu.txt",
      fileName: "ana_yu.txt",
      relativePath: "fixtures/ana_yu.txt",
      eventCount: 2,
    },
    ...overrides,
  };
}

function createEvent(
  overrides: Partial<TimelineEventPersistenceRow> = {},
): TimelineEventPersistenceRow {
  return {
    source_event_id: "tekion:event-1",
    source_file: "fixtures/ana_yu.txt",
    occurred_at: "2026-01-01T12:00:00.000Z",
    raw_type: "Email Sent",
    actor: "Employee",
    actor_type: "employee",
    category: "communication",
    channel: "email",
    direction: "outbound",
    details: "Hello",
    metadata: {
      actorType: "employee",
      communicationChannel: "email",
      communicationDirection: "outbound",
    },
    raw_data: {
      sourceEventId: "tekion:event-1",
      rawType: "Email Sent",
    },
    ...overrides,
  };
}

function createImportEvent(
  recordIdentity: string,
  event: TimelineEventPersistenceRow,
): TimelineImportEvent {
  return {
    recordIdentity,
    event,
  };
}

describe("reconcileTimelineImport", () => {
  it("classifies a first import as new", () => {
    const record = createRecord();
    const recordIdentity = "tekion:timeline:fixture:fixtures/ana_yu.txt";

    const result = reconcileTimelineImport(
      [record],
      [],
      [createImportEvent(recordIdentity, createEvent())],
      [],
    );

    expect(result.records.summary.newCount).toBe(1);
    expect(result.records.summary.updatedCount).toBe(0);
    expect(result.records.summary.unchangedCount).toBe(0);

    expect(result.events.summary.newCount).toBe(1);
    expect(result.events.summary.updatedCount).toBe(0);
    expect(result.events.summary.unchangedCount).toBe(0);
  });

  it("deduplicates identical incoming events before persistence", () => {
    const record = createRecord();
    const recordIdentity =
      "tekion:timeline:fixture:fixtures/ana_yu.txt";
    const event = createEvent();

    const result = reconcileTimelineImport(
      [record],
      [],
      [
        createImportEvent(recordIdentity, event),
        createImportEvent(recordIdentity, {
          ...event,
          metadata: {
            ...event.metadata,
          },
          raw_data: {
            ...event.raw_data,
          },
        }),
      ],
      [],
    );

    expect(result.events.summary.total).toBe(1);
    expect(result.events.summary.newCount).toBe(1);
    expect(result.events.items).toHaveLength(1);
    expect(result.events.items[0]?.status).toBe("new");
  });

  it("rejects conflicting incoming events that share an identity", () => {
    const record = createRecord();
    const recordIdentity =
      "tekion:timeline:fixture:fixtures/ana_yu.txt";

    expect(() =>
      reconcileTimelineImport(
        [record],
        [],
        [
          createImportEvent(
            recordIdentity,
            createEvent(),
          ),
          createImportEvent(
            recordIdentity,
            createEvent({
              details: "Different payload",
            }),
          ),
        ],
        [],
      ),
    ).toThrow(
      "Incoming Tekion timeline events have a persistence identity collision.",
    );
  });

  it("classifies an identical repeat import as unchanged", () => {
    const record = createRecord();
    const event = createEvent();
    const recordIdentity = "tekion:timeline:fixture:fixtures/ana_yu.txt";

    const existingRecord: PersistedTimelineRecord = {
      ...record,
      id: "record-1",
    };

    const existingEvent: PersistedTimelineEvent = {
      ...event,
      id: "event-1",
      timeline_record_id: "record-1",
    };

    const result = reconcileTimelineImport(
      [record],
      [existingRecord],
      [createImportEvent(recordIdentity, event)],
      [existingEvent],
    );

    expect(result.records.summary.unchangedCount).toBe(1);
    expect(result.records.summary.updatedCount).toBe(0);
    expect(result.events.summary.unchangedCount).toBe(1);
    expect(result.events.summary.updatedCount).toBe(0);
  });

  it("classifies changed record data as updated", () => {
    const existingRecord: PersistedTimelineRecord = {
      ...createRecord(),
      id: "record-1",
    };

    const incomingRecord = createRecord({
      raw_data: {
        sourceKey: "fixtures/ana_yu.txt",
        fileName: "ana_yu.txt",
        relativePath: "fixtures/ana_yu.txt",
        eventCount: 3,
      },
    });

    const result = reconcileTimelineImport(
      [incomingRecord],
      [existingRecord],
      [],
      [],
    );

    expect(result.records.summary.updatedCount).toBe(1);
  });

  it("classifies changed event data as updated", () => {
    const record = createRecord();
    const recordIdentity = "tekion:timeline:fixture:fixtures/ana_yu.txt";

    const existingRecord: PersistedTimelineRecord = {
      ...record,
      id: "record-1",
    };

    const existingEvent: PersistedTimelineEvent = {
      ...createEvent(),
      id: "event-1",
      timeline_record_id: "record-1",
    };

    const incomingEvent = createEvent({
      details: "Updated details",
    });

    const result = reconcileTimelineImport(
      [record],
      [existingRecord],
      [createImportEvent(recordIdentity, incomingEvent)],
      [existingEvent],
    );

    expect(result.events.summary.updatedCount).toBe(1);
  });

  it("does not create a second record for the same fixture source key", () => {
    const existingRecord: PersistedTimelineRecord = {
      ...createRecord(),
      id: "record-1",
    };

    const incomingRecord = createRecord();

    const result = reconcileTimelineImport(
      [incomingRecord],
      [existingRecord],
      [],
      [],
    );

    expect(result.records.items[0]?.status).toBe("unchanged");
  });

  it("uses external record identity before fixture identity", () => {
    const existingRecord: PersistedTimelineRecord = {
      ...createRecord({
        external_record_id: "customer-123",
        fixture_source_key: "fixtures/old-name.txt",
      }),
      id: "record-1",
    };

    const incomingRecord = createRecord({
      external_record_id: "customer-123",
      fixture_source_key: "fixtures/new-name.txt",
    });

    const result = reconcileTimelineImport(
      [incomingRecord],
      [existingRecord],
      [],
      [],
    );

    expect(result.records.items[0]?.status).toBe("updated");
  });

  it("scopes event identity to the owning timeline record", () => {
    const firstRecord = createRecord({
      fixture_source_key: "fixtures/first.txt",
      source_file: "fixtures/first.txt",
    });

    const secondRecord = createRecord({
      fixture_source_key: "fixtures/second.txt",
      source_file: "fixtures/second.txt",
    });

    const firstIdentity =
      "tekion:timeline:fixture:fixtures/first.txt";
    const secondIdentity =
      "tekion:timeline:fixture:fixtures/second.txt";

    const sharedEventId = "tekion:event-shared";

    const firstEvent = createEvent({
      source_event_id: sharedEventId,
      source_file: "fixtures/first.txt",
      raw_data: {
        sourceEventId: sharedEventId,
        rawType: "Email Sent",
        record: "first",
      },
    });

    const secondEvent = createEvent({
      source_event_id: sharedEventId,
      source_file: "fixtures/second.txt",
      raw_data: {
        sourceEventId: sharedEventId,
        rawType: "Email Sent",
        record: "second",
      },
    });

    const result = reconcileTimelineImport(
      [firstRecord, secondRecord],
      [],
      [
        createImportEvent(firstIdentity, firstEvent),
        createImportEvent(secondIdentity, secondEvent),
      ],
      [],
    );

    expect(result.events.summary.total).toBe(2);
    expect(result.events.summary.newCount).toBe(2);
    expect(result.events.items).toHaveLength(2);
    expect(result.events.items.every((item) => item.status === "new")).toBe(
      true,
    );
  });

  it("matches existing events only within the owning timeline record", () => {
    const firstRecord = createRecord({
      fixture_source_key: "fixtures/first.txt",
      source_file: "fixtures/first.txt",
    });

    const secondRecord = createRecord({
      fixture_source_key: "fixtures/second.txt",
      source_file: "fixtures/second.txt",
    });

    const firstIdentity =
      "tekion:timeline:fixture:fixtures/first.txt";
    const secondIdentity =
      "tekion:timeline:fixture:fixtures/second.txt";

    const sharedEventId = "tekion:event-shared";

    const firstEvent = createEvent({
      source_event_id: sharedEventId,
      source_file: "fixtures/first.txt",
    });

    const secondEvent = createEvent({
      source_event_id: sharedEventId,
      source_file: "fixtures/second.txt",
    });

    const existingFirstRecord: PersistedTimelineRecord = {
      ...firstRecord,
      id: "record-1",
    };

    const existingSecondRecord: PersistedTimelineRecord = {
      ...secondRecord,
      id: "record-2",
    };

    const existingFirstEvent: PersistedTimelineEvent = {
      ...firstEvent,
      id: "event-1",
      timeline_record_id: "record-1",
    };

    const result = reconcileTimelineImport(
      [firstRecord, secondRecord],
      [existingFirstRecord, existingSecondRecord],
      [
        createImportEvent(firstIdentity, firstEvent),
        createImportEvent(secondIdentity, secondEvent),
      ],
      [existingFirstEvent],
    );

    expect(result.events.summary.total).toBe(2);
    expect(result.events.summary.unchangedCount).toBe(1);
    expect(result.events.summary.newCount).toBe(1);

    expect(result.events.items[0]?.status).toBe("unchanged");
    expect(result.events.items[1]?.status).toBe("new");
  });
});
