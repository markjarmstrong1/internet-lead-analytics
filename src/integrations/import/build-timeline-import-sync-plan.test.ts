import { describe, expect, it } from "vitest";
import { buildImportPersistencePlan } from "./build-import-persistence-plan";
import { buildTimelineImportSyncPlan } from "./build-timeline-import-sync-plan";
import type { ImportBatch } from "@/components/import/import-types";
import type { PersistedTimelineEvent, PersistedTimelineRecord } from "./reconcile-timeline-import";
import type { TekionNormalizedTimelineEvent } from "@/integrations/tekion/timeline/normalized-timeline-event";

function createEvent(
  overrides: Partial<TekionNormalizedTimelineEvent> = {},
): TekionNormalizedTimelineEvent {
  return {
    sourceFile: "ana_yu.txt",
    sourceEventId: "tekion:event-1",
    rawType: "Email Sent",
    occurredAt: "2026-01-01T12:00:00.000Z",
    actor: "Employee",
    details: "Hello",
    category: "communication",
    communicationChannel: "email",
    communicationDirection: "outbound",
    actorType: "employee",
    ...overrides,
  };
}

function createBatch(
  events: TekionNormalizedTimelineEvent[] = [createEvent()],
): ImportBatch {
  return {
    timelineFiles: [
      {
        sourceKey: "fixtures/ana_yu.txt",
        fileName: "ana_yu.txt",
        relativePath: "fixtures/ana_yu.txt",
        events,
      },
    ],
    csvFiles: [],
  };
}

function createExistingRecord(): PersistedTimelineRecord {
  return {
    id: "record-1",
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
      eventCount: 1,
    },
  };
}

function createExistingEvent(): PersistedTimelineEvent {
  return {
    id: "event-1",
    timeline_record_id: "record-1",
    source_event_id: "tekion:event-1",
    source_file: "ana_yu.txt",
    occurred_at: "2026-01-01T12:00:00.000Z",
    raw_type: "Email Sent",
    actor: "Employee",
    actor_type: "employee",
    category: "communication",
    channel: "email",
    direction: "outbound",
    details: "Hello",
    metadata: {
      communicationChannel: "email",
      communicationDirection: "outbound",
      actorType: "employee",
    },
    raw_data: {
      sourceEventId: "tekion:event-1",
      sourceFile: "ana_yu.txt",
      rawType: "Email Sent",
      occurredAt: "2026-01-01T12:00:00.000Z",
      actor: "Employee",
      details: "Hello",
      category: "communication",
      communicationChannel: "email",
      communicationDirection: "outbound",
      actorType: "employee",
    },
  };
}

describe("buildTimelineImportSyncPlan", () => {
  it("plans a first import as new records and events", () => {
    const plan = buildTimelineImportSyncPlan(
      buildImportPersistencePlan(createBatch()),
      {
        records: [],
        events: [],
      },
    );

    expect(plan.records).toHaveLength(1);
    expect(plan.records[0]?.status).toBe("new");

    expect(plan.events).toHaveLength(1);
    expect(plan.events[0]?.status).toBe("new");
    expect(plan.events[0]?.recordIdentity).toBe(
      "tekion:timeline:fixture:fixtures/ana_yu.txt",
    );
  });

  it("plans an identical repeat import as unchanged", () => {
    const plan = buildTimelineImportSyncPlan(
      buildImportPersistencePlan(createBatch()),
      {
        records: [createExistingRecord()],
        events: [createExistingEvent()],
      },
    );

    expect(plan.records[0]?.status).toBe("unchanged");
    expect(plan.events[0]?.status).toBe("unchanged");
    expect(plan.events[0]?.existing?.id).toBe("event-1");
  });

  it("plans changed event data as an update", () => {
    const plan = buildTimelineImportSyncPlan(
      buildImportPersistencePlan(
        createBatch([
          createEvent({
            details: "Updated details",
          }),
        ]),
      ),
      {
        records: [createExistingRecord()],
        events: [createExistingEvent()],
      },
    );

    expect(plan.records[0]?.status).toBe("unchanged");
    expect(plan.events[0]?.status).toBe("updated");
    expect(plan.events[0]?.existing?.id).toBe("event-1");
  });

  it("keeps event identity scoped to its timeline record", () => {
    const firstEvent = createEvent({
      sourceFile: "first.txt",
      sourceEventId: "tekion:event-shared",
    });

    const secondEvent = createEvent({
      sourceFile: "second.txt",
      sourceEventId: "tekion:event-shared",
    });

    const batch: ImportBatch = {
      timelineFiles: [
        {
          sourceKey: "fixtures/first.txt",
          fileName: "first.txt",
          relativePath: "fixtures/first.txt",
          events: [firstEvent],
        },
        {
          sourceKey: "fixtures/second.txt",
          fileName: "second.txt",
          relativePath: "fixtures/second.txt",
          events: [secondEvent],
        },
      ],
      csvFiles: [],
    };

    const plan = buildTimelineImportSyncPlan(
      buildImportPersistencePlan(batch),
      {
        records: [],
        events: [],
      },
    );

    expect(plan.events).toHaveLength(2);
    expect(plan.events.every((event) => event.status === "new")).toBe(true);
    expect(new Set(plan.events.map((event) => event.recordIdentity))).toEqual(
      new Set([
        "tekion:timeline:fixture:fixtures/first.txt",
        "tekion:timeline:fixture:fixtures/second.txt",
      ]),
    );
  });
});
