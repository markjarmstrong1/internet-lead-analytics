import { describe, expect, it } from "vitest";

import { executeTimelineImportSync } from "./execute-timeline-import-sync";
import type { TimelineImportSyncPlan } from "./build-timeline-import-sync-plan";
import type { TimelineImportRepository } from "./timeline-import-repository";
import type {
  PersistedTimelineEvent,
  PersistedTimelineRecord,
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
    raw_data: {},
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
    actor: "Mark Armstrong",
    actor_type: "employee",
    category: "communication",
    channel: "email",
    direction: "outbound",
    details: "Hello",
    metadata: {},
    raw_data: {},
    ...overrides,
  };
}

function createRepository(
  calls: string[],
): TimelineImportRepository {
  return {
    async loadSnapshot() {
      return {
        records: [],
        events: [],
      };
    },

    async insertRecord(record) {
      calls.push(
        `insert-record:${record.fixture_source_key}`,
      );

      return {
        ...record,
        id: "record-1",
      };
    },

    async updateRecord(id, record) {
      calls.push(`update-record:${id}`);

      return {
        ...record,
        id,
      };
    },

    async insertEvent(timelineRecordId, event) {
      calls.push(
        `insert-event:${timelineRecordId}:${event.source_event_id}`,
      );

      return {
        ...event,
        id: "event-1",
        timeline_record_id: timelineRecordId,
      };
    },

    async updateEvent(
      id,
      timelineRecordId,
      event,
    ) {
      calls.push(
        `update-event:${id}:${timelineRecordId}:${event.source_event_id}`,
      );

      return {
        ...event,
        id,
        timeline_record_id: timelineRecordId,
      };
    },
  };
}

describe("executeTimelineImportSync", () => {
  it("persists records before their events", async () => {
    const calls: string[] = [];

    const plan: TimelineImportSyncPlan = {
      records: [
        {
          status: "new",
          incoming: createRecord(),
        },
      ],
      events: [
        {
          status: "new",
          recordIdentity:
            "tekion:timeline:fixture:fixtures/ana_yu.txt",
          incoming: createEvent(),
        },
      ],
    };

    const result = await executeTimelineImportSync(
      plan,
      createRepository(calls),
    );

    expect(calls).toEqual([
      "insert-record:fixtures/ana_yu.txt",
      "insert-event:record-1:tekion:event-1",
    ]);

    expect(result).toEqual({
      records: {
        total: 1,
        newCount: 1,
        updatedCount: 0,
        unchangedCount: 0,
        invalidCount: 0,
      },
      events: {
        total: 1,
        newCount: 1,
        updatedCount: 0,
        unchangedCount: 0,
        invalidCount: 0,
      },
    });
  });

  it("does not write unchanged records or events", async () => {
    const calls: string[] = [];

    const plan: TimelineImportSyncPlan = {
      records: [
        {
          status: "unchanged",
          incoming: createRecord(),
          existing: {
            ...createRecord(),
            id: "record-1",
          } satisfies PersistedTimelineRecord,
        },
      ],
      events: [
        {
          status: "unchanged",
          recordIdentity:
            "tekion:timeline:fixture:fixtures/ana_yu.txt",
          incoming: createEvent(),
          existing: {
            ...createEvent(),
            id: "event-1",
            timeline_record_id: "record-1",
          } satisfies PersistedTimelineEvent,
        },
      ],
    };

    await executeTimelineImportSync(
      plan,
      createRepository(calls),
    );

    expect(calls).toEqual([]);
  });

  it("updates an event without updating an unchanged parent", async () => {
    const calls: string[] = [];

    const plan: TimelineImportSyncPlan = {
      records: [
        {
          status: "unchanged",
          incoming: createRecord(),
          existing: {
            ...createRecord(),
            id: "record-1",
          } satisfies PersistedTimelineRecord,
        },
      ],
      events: [
        {
          status: "updated",
          recordIdentity:
            "tekion:timeline:fixture:fixtures/ana_yu.txt",
          incoming: createEvent({
            details: "Updated",
          }),
          existing: {
            ...createEvent(),
            id: "event-1",
            timeline_record_id: "record-1",
          } satisfies PersistedTimelineEvent,
        },
      ],
    };

    await executeTimelineImportSync(
      plan,
      createRepository(calls),
    );

    expect(calls).toEqual([
      "update-event:event-1:record-1:tekion:event-1",
    ]);
  });

  it("updates a changed record", async () => {
    const calls: string[] = [];

    const plan: TimelineImportSyncPlan = {
      records: [
        {
          status: "updated",
          incoming: createRecord({
            raw_data: {
              changed: true,
            },
          }),
          existing: {
            ...createRecord(),
            id: "record-1",
          } satisfies PersistedTimelineRecord,
        },
      ],
      events: [],
    };

    await executeTimelineImportSync(
      plan,
      createRepository(calls),
    );

    expect(calls).toEqual([
      "update-record:record-1",
    ]);
  });

  it("fails closed when an event has no persisted record", async () => {
    const plan: TimelineImportSyncPlan = {
      records: [],
      events: [
        {
          status: "new",
          recordIdentity:
            "tekion:timeline:fixture:missing.txt",
          incoming: createEvent(),
        },
      ],
    };

    await expect(
      executeTimelineImportSync(
        plan,
        createRepository([]),
      ),
    ).rejects.toThrow(
      "Cannot execute timeline event tekion:event-1 without a persisted timeline record.",
    );
  });

  it("fails closed when an update has no existing record", async () => {
    const plan: TimelineImportSyncPlan = {
      records: [
        {
          status: "updated",
          incoming: createRecord(),
        },
      ],
      events: [],
    };

    await expect(
      executeTimelineImportSync(
        plan,
        createRepository([]),
      ),
    ).rejects.toThrow(
      "Cannot execute updated timeline record without an existing record.",
    );
  });
});
