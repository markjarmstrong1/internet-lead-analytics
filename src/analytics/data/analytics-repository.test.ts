import { describe, expect, it } from "vitest";

import { SupabaseAnalyticsRepository } from "./analytics-repository";

function createQuery<T>(result: {
  data: T;
  error: null;
}) {
  return {
    select: () => ({
      not: async () => result,
      order: async () => result,
    }),
  };
}

function createLeadQuery<T>(result: {
  data: T;
  error: null;
}) {
  return {
    select: async () => result,
  };
}

function createFakeClient() {
  const leadsResult = {
    data: [
      {
        id: "lead-1",
        contact_name: "Test Lead",
        source: "Cars.com",
        lead_source_group: "Internet",
        stage: "Engage",
        status: "active",
        creation_time: "2026-01-01T09:00:00.000Z",
        sold_date: null,
        closed_time: null,
      },
    ],
    error: null,
  };

  const recordsResult = {
    data: [
      {
        id: "record-1",
        lead_id: "lead-1",
      },
    ],
    error: null,
  };

  const eventsResult = {
    data: [
      {
        id: "event-row-1",
        timeline_record_id: "record-1",
        source_event_id: "event-1",
        source_file: "lead.txt",
        occurred_at: "2026-01-01T10:00:00.000Z",
        raw_type: "Text Sent",
        actor: "Employee",
        actor_type: "employee",
        category: "communication",
        channel: "text",
        direction: "outbound",
        details: "Hello",
        metadata: {},
        raw_data: {},
        created_at: "2026-01-01T10:00:00.000Z",
        updated_at: "2026-01-01T10:00:00.000Z",
      },
    ],
    error: null,
  };

  return {
    from(table: string) {
      if (table === "leads") {
        return createLeadQuery(leadsResult);
      }

      if (table === "timeline_records") {
        return createQuery(recordsResult);
      }

      if (table === "timeline_events") {
        return createQuery(eventsResult);
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  } as never;
}

describe("SupabaseAnalyticsRepository", () => {
  it("builds one analytics dataset from leads, timeline records, and events", async () => {
    const repository = new SupabaseAnalyticsRepository(
      createFakeClient(),
    );

    await expect(repository.load()).resolves.toEqual({
      leads: [
        {
          leadId: "lead-1",
          contactName: "Test Lead",
          source: "Cars.com",
          sourceGroup: "Internet",
          stage: "Engage",
          status: "active",
          creationTime: "2026-01-01T09:00:00.000Z",
          soldDate: null,
          closedTime: null,
          timelineRecordIds: ["record-1"],
        },
      ],
      events: [
        {
          timelineRecordId: "record-1",
          sourceEventId: "event-1",
          sourceFile: "lead.txt",
          occurredAt: "2026-01-01T10:00:00.000Z",
          rawType: "Text Sent",
          actor: "Employee",
          actorType: "employee",
          category: "communication",
          channel: "text",
          direction: "outbound",
          details: "Hello",
        },
      ],
    });
  });
});
