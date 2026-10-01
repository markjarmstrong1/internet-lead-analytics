import { describe, expect, it } from "vitest";
import {
  reconcileTimelineImport,
  type PersistedTimelineEvent,
  type PersistedTimelineRecord,
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

describe("reconcileTimelineImport", () => {
  it("classifies a first import as new", () => {
    const result = reconcileTimelineImport(
      [createRecord()],
      [],
      [createEvent()],
      [],
    );

    expect(result.records.summary.newCount).toBe(1);
    expect(result.records.summary.updatedCount).toBe(0);
    expect(result.records.summary.unchangedCount).toBe(0);

    expect(result.events.summary.newCount).toBe(1);
    expect(result.events.summary.updatedCount).toBe(0);
    expect(result.events.summary.unchangedCount).toBe(0);
  });

  it("classifies an identical repeat import as unchanged", () => {
    const record = createRecord();
    const event = createEvent();

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
      [event],
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
    const existingEvent: PersistedTimelineEvent = {
      ...createEvent(),
      id: "event-1",
      timeline_record_id: "record-1",
    };

    const incomingEvent = createEvent({
      details: "Updated details",
    });

    const result = reconcileTimelineImport(
      [],
      [],
      [incomingEvent],
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
});
