import { describe, expect, it } from "vitest";
import { buildTaskTimelineCorrelation } from "../../../../src/integrations/tekion/timeline/correlation/build-task-timeline-correlation";
import type { TekionNormalizedTimelineEvent } from "../../../../src/integrations/tekion/timeline/normalized-timeline-event";

function event(
  sourceEventId: string,
): TekionNormalizedTimelineEvent {
  return {
    sourceFile: "sample.txt",
    rawType: "Email Sent",
    occurredAt: "2026-09-24T13:14:00.000Z",
    actor: "Employee",
    details: "sample",
    category: "communication",
    sourceEventId,
    communicationChannel: "email",
    communicationDirection: "outbound",
    actorType: "employee",
  };
}

describe("buildTaskTimelineCorrelation", () => {
  it("preserves direct identity correlation and timeline event IDs", () => {
    const result = buildTaskTimelineCorrelation({
      taskSourceRecordId: "task-1",
      taskIdentity: "Ana Yu",
      timelineIdentity: "Ana Yu",
      timelineSourceFile: "ana_yu.txt",
      timelineEvents: [
        event("event-1"),
        event("event-2"),
      ],
    });

    expect(result).toEqual({
      taskSourceRecordId: "task-1",
      timelineSourceFile: "ana_yu.txt",
      status: "direct_match",
      similarity: 1,
      timelineEventIds: [
        "event-1",
        "event-2",
      ],
    });
  });

  it("preserves unresolved identity variants as unresolved evidence", () => {
    const result = buildTaskTimelineCorrelation({
      taskSourceRecordId: "task-2",
      taskIdentity: "Jeffrey Becker",
      timelineIdentity: "Jeffery Becker",
      timelineSourceFile: "jeffery_becker.txt",
      timelineEvents: [event("event-3")],
    });

    expect(result.status).toBe("unresolved_variant");
    expect(result.similarity).toBeGreaterThan(0.85);
    expect(result.similarity).toBeLessThan(1);
    expect(result.timelineEventIds).toEqual(["event-3"]);
  });

  it("does not attach timeline events for a no-match identity", () => {
    const result = buildTaskTimelineCorrelation({
      taskSourceRecordId: "task-3",
      taskIdentity: "Ana Yu",
      timelineIdentity: "Jim Wilson",
      timelineSourceFile: "jim_wilson.txt",
      timelineEvents: [event("event-4")],
    });

    expect(result).toEqual({
      taskSourceRecordId: "task-3",
      timelineSourceFile: "jim_wilson.txt",
      status: "no_match",
      similarity: expect.any(Number),
      timelineEventIds: [],
    });
  });

  it("preserves timeline event ordering", () => {
    const result = buildTaskTimelineCorrelation({
      taskSourceRecordId: "task-4",
      taskIdentity: "Ana Yu",
      timelineIdentity: "Ana Yu",
      timelineSourceFile: "ana_yu.txt",
      timelineEvents: [
        event("event-7"),
        event("event-2"),
        event("event-9"),
      ],
    });

    expect(result.timelineEventIds).toEqual([
      "event-7",
      "event-2",
      "event-9",
    ]);
  });

  it("allows a direct identity match even when the timeline has no events", () => {
    const result = buildTaskTimelineCorrelation({
      taskSourceRecordId: "task-5",
      taskIdentity: "Ana Yu",
      timelineIdentity: "Ana Yu",
      timelineSourceFile: "ana_yu.txt",
      timelineEvents: [],
    });

    expect(result).toEqual({
      taskSourceRecordId: "task-5",
      timelineSourceFile: "ana_yu.txt",
      status: "direct_match",
      similarity: 1,
      timelineEventIds: [],
    });
  });
});
