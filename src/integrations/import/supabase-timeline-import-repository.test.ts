import { describe, expect, it } from "vitest";

import {
  SupabaseTimelineImportRepository,
} from "./supabase-timeline-import-repository";
import type {
  TimelineEventPersistenceRow,
  TimelineRecordPersistenceRow,
} from "@/integrations/tekion/timeline/timeline-persistence-row";

type QueryResult<T> = {
  data: T;
  error: { message: string } | null;
};

function createQuery<T>(result: QueryResult<T>) {
  const query = {
    select: () => query,
    order: () => query,
    insert: () => query,
    update: () => query,
    eq: () => query,
    single: async () => result,
    then: (
      onFulfilled: (value: QueryResult<T>) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(onFulfilled, onRejected),
  };

  return query;
}

function createFakeClient(results: {
  records: QueryResult<unknown>;
  events: QueryResult<unknown>;
}) {
  return {
    from(table: string) {
      return table === "timeline_records"
        ? createQuery(results.records)
        : createQuery(results.events);
    },
  } as never;
}

const record: TimelineRecordPersistenceRow = {
  source_system: "tekion",
  source_type: "timeline",
  external_record_id: null,
  fixture_source_key: "timelines/ana_yu.txt",
  source_file: "timelines/ana_yu.txt",
  raw_data: {
    sourceKey: "timelines/ana_yu.txt",
    eventCount: 42,
  },
};

const event: TimelineEventPersistenceRow = {
  source_event_id: "tekion:test-event",
  source_file: "timelines/ana_yu.txt",
  occurred_at: "2026-01-01T12:00:00.000Z",
  raw_type: "Email Sent",
  actor: "Mark Armstrong",
  actor_type: "employee",
  category: "communication",
  channel: "email",
  direction: "outbound",
  details: "Test email",
  metadata: {},
  raw_data: {
    rawType: "Email Sent",
  },
};

describe("SupabaseTimelineImportRepository", () => {
  it("loads timeline records and events", async () => {
    const persistedRecord = {
      ...record,
      id: "record-1",
    };

    const persistedEvent = {
      ...event,
      id: "event-1",
      timeline_record_id: "record-1",
    };

    const repository = new SupabaseTimelineImportRepository(
      createFakeClient({
        records: {
          data: [persistedRecord],
          error: null,
        },
        events: {
          data: [persistedEvent],
          error: null,
        },
      }),
    );

    await expect(repository.loadSnapshot()).resolves.toEqual({
      records: [persistedRecord],
      events: [persistedEvent],
    });
  });

  it("inserts and returns a timeline record", async () => {
    const persistedRecord = {
      ...record,
      id: "record-1",
    };

    const repository = new SupabaseTimelineImportRepository(
      createFakeClient({
        records: {
          data: persistedRecord,
          error: null,
        },
        events: {
          data: [],
          error: null,
        },
      }),
    );

    await expect(repository.insertRecord(record)).resolves.toEqual(
      persistedRecord,
    );
  });

  it("updates and returns a timeline record", async () => {
    const persistedRecord = {
      ...record,
      id: "record-1",
    };

    const repository = new SupabaseTimelineImportRepository(
      createFakeClient({
        records: {
          data: persistedRecord,
          error: null,
        },
        events: {
          data: [],
          error: null,
        },
      }),
    );

    await expect(
      repository.updateRecord("record-1", record),
    ).resolves.toEqual(persistedRecord);
  });

  it("inserts and returns a timeline event", async () => {
    const persistedEvent = {
      ...event,
      id: "event-1",
      timeline_record_id: "record-1",
    };

    const repository = new SupabaseTimelineImportRepository(
      createFakeClient({
        records: {
          data: [],
          error: null,
        },
        events: {
          data: persistedEvent,
          error: null,
        },
      }),
    );

    await expect(
      repository.insertEvent("record-1", event),
    ).resolves.toEqual(persistedEvent);
  });

  it("updates and returns a timeline event", async () => {
    const persistedEvent = {
      ...event,
      id: "event-1",
      timeline_record_id: "record-1",
    };

    const repository = new SupabaseTimelineImportRepository(
      createFakeClient({
        records: {
          data: [],
          error: null,
        },
        events: {
          data: persistedEvent,
          error: null,
        },
      }),
    );

    await expect(
      repository.updateEvent("event-1", "record-1", event),
    ).resolves.toEqual(persistedEvent);
  });

  it("surfaces database errors when loading records", async () => {
    const repository = new SupabaseTimelineImportRepository(
      createFakeClient({
        records: {
          data: [],
          error: {
            message: "database unavailable",
          },
        },
        events: {
          data: [],
          error: null,
        },
      }),
    );

    await expect(repository.loadSnapshot()).rejects.toThrow(
      "Failed to load timeline records: database unavailable",
    );
  });
});
