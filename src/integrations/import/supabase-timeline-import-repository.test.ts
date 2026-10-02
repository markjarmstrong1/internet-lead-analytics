import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@Supabase/supabase-js";

import {
  SupabaseTimelineImportRepository,
} from "./supabase-timeline-import-repository";
import type {
  TimelineImportSyncPlan,
} from "./build-timeline-import-sync-plan";
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
  leads: QueryResult<unknown>;
  sourceImports: QueryResult<unknown>;
  rpcResult?: {
    error: { message: string } | null;
  };
}) {
  const client = {
    from(table: string) {
      if (table === "timeline_records") {
        return createQuery(results.records);
      }

      if (table === "timeline_events") {
        return createQuery(results.events);
      }

      if (table === "leads") {
        return createQuery(results.leads);
      }

      return createQuery(results.sourceImports);
    },

    rpc: vi.fn().mockResolvedValue(
      results.rpcResult ?? { error: null },
    ),
  };

  return client as unknown as SupabaseClient<never> & {
    rpc: ReturnType<typeof vi.fn>;
  };
}

const record: TimelineRecordPersistenceRow = {
  source_system: "tekion",
  lead_id: null,
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

const plan: TimelineImportSyncPlan = {
  records: [
    {
      status: "new",
      incoming: record,
    },
  ],
  events: [
    {
      status: "new",
      recordIdentity: "tekion:timeline:fixture:timelines/ana_yu.txt",
      incoming: event,
    },
  ],
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
        leads: {
          data: [],
          error: null,
        },
        sourceImports: {
          data: [],
          error: null,
        },
      }),
    );

    await expect(repository.loadSnapshot()).resolves.toEqual({
      records: [persistedRecord],
      events: [persistedEvent],
      leads: [],
    });
  });

  it("creates a source import", async () => {
    const persistedImport = {
      ...{
        source_system: "tekion",
        import_type: "timeline",
        file_name: "ana_yu.txt",
        status: "processing",
        record_count: 1,
      },
      id: "import-1",
      imported_at: "2026-01-01T00:00:00.000Z",
      error_message: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };

    const repository = new SupabaseTimelineImportRepository(
      createFakeClient({
        records: {
          data: [],
          error: null,
        },
        events: {
          data: [],
          error: null,
        },
        leads: {
          data: [],
          error: null,
        },
        sourceImports: {
          data: persistedImport,
          error: null,
        },
      }),
    );

    await expect(
      repository.createSourceImport({
        source_system: "tekion",
        import_type: "timeline",
        file_name: "ana_yu.txt",
        status: "processing",
        record_count: 1,
      }),
    ).resolves.toEqual(persistedImport);
  });

  it("updates source import status", async () => {
    const persistedImport = {
      source_system: "tekion",
      import_type: "timeline",
      file_name: "ana_yu.txt",
      status: "failed",
      record_count: 1,
      id: "import-1",
      imported_at: "2026-01-01T00:00:00.000Z",
      error_message: "database unavailable",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:01:00.000Z",
    };

    const repository = new SupabaseTimelineImportRepository(
      createFakeClient({
        records: {
          data: [],
          error: null,
        },
        events: {
          data: [],
          error: null,
        },
        leads: {
          data: [],
          error: null,
        },
        sourceImports: {
          data: persistedImport,
          error: null,
        },
      }),
    );

    await expect(
      repository.updateSourceImportStatus(
        "import-1",
        "failed",
        "database unavailable",
      ),
    ).resolves.toEqual(persistedImport);
  });

  it("executes the complete import through the database RPC", async () => {
    const client = createFakeClient({
      records: {
        data: [],
        error: null,
      },
      events: {
        data: [],
        error: null,
      },
      leads: {
        data: [],
        error: null,
      },
      sourceImports: {
        data: [],
        error: null,
      },
    });

    const repository =
      new SupabaseTimelineImportRepository(client);

    await expect(
      repository.executeAtomicImport(
        "import-1",
        plan,
        [],
        [],
      ),
    ).resolves.toBeUndefined();

    expect(client.rpc).toHaveBeenCalledWith(
      "apply_tekion_import_batch",
      {
        p_import_id: "import-1",
        lead_rows: [],
        source_record_rows: [],
        timeline_record_operations: plan.records,
        timeline_event_operations: plan.events,
      },
    );
  });

  it("surfaces RPC persistence errors", async () => {
    const repository = new SupabaseTimelineImportRepository(
      createFakeClient({
        records: {
          data: [],
          error: null,
        },
        events: {
          data: [],
          error: null,
        },
        leads: {
          data: [],
          error: null,
        },
        sourceImports: {
          data: [],
          error: null,
        },
        rpcResult: {
          error: {
            message: "transaction failed",
          },
        },
      }),
    );

    await expect(
      repository.executeAtomicImport(
        "import-1",
        plan,
        [],
        [],
      ),
    ).rejects.toThrow(
      "Failed to persist Tekion import import-1: transaction failed",
    );
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
        leads: {
          data: [],
          error: null,
        },
        sourceImports: {
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
