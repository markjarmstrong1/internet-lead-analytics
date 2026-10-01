import { describe, expect, it } from "vitest";
import { buildImportPersistencePlan } from "./build-import-persistence-plan";
import type { ImportBatch } from "@/components/import/import-types";
import type { TekionNormalizedTimelineEvent } from "@/integrations/tekion/timeline/normalized-timeline-event";

function createEvent(): TekionNormalizedTimelineEvent {
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
  };
}

describe("buildImportPersistencePlan", () => {
  it("creates canonical timeline persistence batches from imported files", () => {
    const batch: ImportBatch = {
      timelineFiles: [
        {
          sourceKey: "fixtures/ana_yu.txt",
          fileName: "ana_yu.txt",
          relativePath: "fixtures/ana_yu.txt",
          events: [createEvent()],
        },
      ],
      csvFiles: [],
    };

    const plan = buildImportPersistencePlan(batch);

    expect(plan.timelineBatches).toHaveLength(1);

    expect(plan.timelineBatches[0]?.record).toMatchObject({
      source_system: "tekion",
      source_type: "timeline",
      fixture_source_key: "fixtures/ana_yu.txt",
      source_file: "fixtures/ana_yu.txt",
    });

    expect(plan.timelineBatches[0]?.events).toHaveLength(1);

    expect(plan.timelineBatches[0]?.events[0]).toMatchObject({
      source_event_id: "tekion:event-1",
      raw_type: "Email Sent",
      channel: "email",
      direction: "outbound",
      actor_type: "employee",
    });
  });
});
