import { describe, expect, it, vi } from "vitest";

import { executeTimelineImportSync } from "./execute-timeline-import-sync";
import type { TimelineImportSyncPlan } from "./build-timeline-import-sync-plan";
import type { TimelineImportRepository } from "./timeline-import-repository";
import type {
  PersistedSourceImport,
  SourceImportPersistenceRow,
} from "./source-import";
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
    lead_id: null,
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
  executeAtomicImport: TimelineImportRepository["executeAtomicImport"],
): TimelineImportRepository {
  return {
    async loadSnapshot() {
      return {
        records: [],
        events: [],
      };
    },

    async createSourceImport(
      sourceImport: SourceImportPersistenceRow,
    ): Promise<PersistedSourceImport> {
      return {
        ...sourceImport,
        id: "import-1",
        imported_at: "2026-01-01T00:00:00.000Z",
        error_message: null,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      };
    },

    async updateSourceImportStatus(
      id,
      status,
      errorMessage = null,
    ): Promise<PersistedSourceImport> {
      return {
        source_system: "tekion",
        import_type: "timeline",
        file_name: null,
        status,
        record_count: 1,
        id,
        imported_at: "2026-01-01T00:00:00.000Z",
        error_message: errorMessage,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      };
    },

    executeAtomicImport,

  };
}

describe("executeTimelineImportSync", () => {
  it("delegates the complete plan to the atomic repository operation", async () => {
    const executeAtomicImport = vi.fn<
      TimelineImportRepository["executeAtomicImport"]
    >();

    const plan: TimelineImportSyncPlan = {
      records: [
        {
          status: "new",
          incoming: createRecord(),
        },
        {
          status: "unchanged",
          incoming: createRecord({
            fixture_source_key: "fixtures/jim_wilson.txt",
          }),
          existing: {
            ...createRecord({
              fixture_source_key: "fixtures/jim_wilson.txt",
            }),
            id: "record-2",
          } satisfies PersistedTimelineRecord,
        },
        {
          status: "updated",
          incoming: createRecord({
            fixture_source_key: "fixtures/jeffery_becker.txt",
            raw_data: {
              changed: true,
            },
          }),
          existing: {
            ...createRecord({
              fixture_source_key: "fixtures/jeffery_becker.txt",
            }),
            id: "record-3",
          } satisfies PersistedTimelineRecord,
        },
        {
          status: "invalid",
          incoming: createRecord({
            fixture_source_key: "fixtures/invalid.txt",
          }),
        },
      ],
      events: [
        {
          status: "new",
          recordIdentity:
            "tekion:timeline:fixture:fixtures/ana_yu.txt",
          incoming: createEvent(),
        },
        {
          status: "unchanged",
          recordIdentity:
            "tekion:timeline:fixture:fixtures/jim_wilson.txt",
          incoming: createEvent({
            source_event_id: "tekion:event-2",
          }),
          existing: {
            ...createEvent({
              source_event_id: "tekion:event-2",
            }),
            id: "event-2",
            timeline_record_id: "record-2",
          } satisfies PersistedTimelineEvent,
        },
        {
          status: "updated",
          recordIdentity:
            "tekion:timeline:fixture:fixtures/jeffery_becker.txt",
          incoming: createEvent({
            source_event_id: "tekion:event-3",
            details: "Updated",
          }),
          existing: {
            ...createEvent({
              source_event_id: "tekion:event-3",
            }),
            id: "event-3",
            timeline_record_id: "record-3",
          } satisfies PersistedTimelineEvent,
        },
        {
          status: "invalid",
          recordIdentity:
            "tekion:timeline:fixture:fixtures/invalid.txt",
          incoming: createEvent({
            source_event_id: "tekion:event-invalid",
          }),
        },
      ],
    };

    const repository = createRepository(
      executeAtomicImport,
    );

    const result = await executeTimelineImportSync(
      plan,
      repository,
      "import-123",
    );

    expect(executeAtomicImport).toHaveBeenCalledTimes(1);
    expect(executeAtomicImport).toHaveBeenCalledWith(
      "import-123",
      plan,
    );

    expect(result).toEqual({
      records: {
        total: 4,
        newCount: 1,
        updatedCount: 1,
        unchangedCount: 1,
        invalidCount: 1,
      },
      events: {
        total: 4,
        newCount: 1,
        updatedCount: 1,
        unchangedCount: 1,
        invalidCount: 1,
      },
    });
  });

  it("propagates an atomic persistence failure", async () => {
    const executeAtomicImport = vi.fn<
      TimelineImportRepository["executeAtomicImport"]
    >().mockRejectedValue(
      new Error("atomic import failed"),
    );

    const plan: TimelineImportSyncPlan = {
      records: [
        {
          status: "new",
          incoming: createRecord(),
        },
      ],
      events: [],
    };

    await expect(
      executeTimelineImportSync(
        plan,
        createRepository(executeAtomicImport),
        "import-123",
      ),
    ).rejects.toThrow("atomic import failed");

    expect(executeAtomicImport).toHaveBeenCalledWith(
      "import-123",
      plan,
    );
  });
});
