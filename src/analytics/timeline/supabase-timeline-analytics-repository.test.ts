import { describe, expect, it } from "vitest";

import { SupabaseTimelineAnalyticsRepository } from "./supabase-timeline-analytics-repository";

type QueryResult<T> = {
  data: T;
  error: { message: string } | null;
};

function createQuery<T>(result: QueryResult<T>) {
  const query = {
    select: () => query,
    order: async () => result,
  };

  return query;
}

function createFakeClient(result: QueryResult<unknown>) {
  return {
    from(table: string) {
      if (table !== "timeline_events") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return createQuery(result);
    },
  } as never;
}

describe("SupabaseTimelineAnalyticsRepository", () => {
  it("loads and normalizes persisted timeline events", async () => {
    const repository = new SupabaseTimelineAnalyticsRepository(
      createFakeClient({
        data: [
          {
            id: "event-1",
            timeline_record_id: "record-1",
            source_event_id: "tekion:event-1",
            source_file: "ana_yu.txt",
            occurred_at: "2026-01-01T10:00:00.000Z",
            raw_type: "Text Sent",
            actor: "Mark Armstrong",
            actor_type: "employee",
            category: "communication",
            channel: "text",
            direction: "outbound",
            details: "Hello",
            metadata: {},
            raw_data: {},
          },
        ],
        error: null,
      }),
    );

    await expect(repository.loadEvents()).resolves.toEqual([
      {
        timelineRecordId: "record-1",
        sourceEventId: "tekion:event-1",
        sourceFile: "ana_yu.txt",
        occurredAt: "2026-01-01T10:00:00.000Z",
        rawType: "Text Sent",
        actor: "Mark Armstrong",
        actorType: "employee",
        category: "communication",
        channel: "text",
        direction: "outbound",
        details: "Hello",
      },
    ]);
  });

  it("preserves unknown analytics channel and direction as null", async () => {
    const repository = new SupabaseTimelineAnalyticsRepository(
      createFakeClient({
        data: [
          {
            id: "event-1",
            timeline_record_id: "record-1",
            source_event_id: "tekion:event-1",
            source_file: "ana_yu.txt",
            occurred_at: "2026-01-01T10:00:00.000Z",
            raw_type: "Note",
            actor: "Mark Armstrong",
            actor_type: "employee",
            category: "note",
            channel: "carrier_pigeon",
            direction: "sideways",
            details: "Note",
            metadata: {},
            raw_data: {},
          },
        ],
        error: null,
      }),
    );

    await expect(repository.loadEvents()).resolves.toEqual([
      {
        timelineRecordId: "record-1",
        sourceEventId: "tekion:event-1",
        sourceFile: "ana_yu.txt",
        occurredAt: "2026-01-01T10:00:00.000Z",
        rawType: "Note",
        actor: "Mark Armstrong",
        actorType: "employee",
        category: "note",
        channel: null,
        direction: null,
        details: "Note",
      },
    ]);
  });

  it("surfaces timeline read failures", async () => {
    const repository = new SupabaseTimelineAnalyticsRepository(
      createFakeClient({
        data: [],
        error: {
          message: "database unavailable",
        },
      }),
    );

    await expect(repository.loadEvents()).rejects.toThrow(
      "Failed to load timeline analytics events: database unavailable",
    );
  });
});
