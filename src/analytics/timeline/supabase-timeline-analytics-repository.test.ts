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

function createLeadQuery<T>(result: QueryResult<T>) {
  const query = {
    select: async () => result,
  };

  return query;
}

function createFakeClient(
  eventsResult: QueryResult<unknown>,
  leadsResult: QueryResult<unknown> = {
    data: [],
    error: null,
  },
  timelineResult: QueryResult<unknown> = {
    data: [],
    error: null,
  },
) {
  return {
    from(table: string) {
      if (table === "timeline_events") {
        return createQuery(eventsResult);
      }

      if (table === "leads") {
        return createLeadQuery(leadsResult);
      }

      if (table === "timeline_records") {
        return createLeadQuery(timelineResult);
      }

      throw new Error(`Unexpected table: ${table}`);
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

  it("loads lead stages and their timeline associations", async () => {
    const repository = new SupabaseTimelineAnalyticsRepository(
      createFakeClient(
        { data: [], error: null },
        {
          data: [
            {
              id: "lead-1",
              stage: "Sold",
            },
            {
              id: "lead-2",
              stage: "Engage",
            },
          ],
          error: null,
        },
        {
          data: [
            {
              id: "record-1",
              lead_id: "lead-1",
            },
          ],
          error: null,
        },
      ),
    );

    await expect(repository.loadLeads()).resolves.toEqual([
      {
        leadId: "lead-1",
        timelineRecordId: "record-1",
        stage: "Sold",
      },
      {
        leadId: "lead-2",
        timelineRecordId: null,
        stage: "Engage",
      },
    ]);
  });
});
