import { describe, expect, it } from "vitest";
import { correlateTaskTimeline } from "../../../../src/integrations/tekion/timeline/correlation/correlate-task-timeline";

describe("correlateTaskTimeline", () => {
  it("correlates a task to timeline evidence using a direct identity match", () => {
    const result = correlateTaskTimeline({
      taskIdentity: "Ana Yu",
      timelineIdentity: "Ana Yu",
      taskSourceRecordId: "task-1",
      timelineEventIds: ["event-1", "event-2"],
    });

    expect(result).toEqual({
      status: "direct_match",
      taskSourceRecordId: "task-1",
      timelineEventIds: ["event-1", "event-2"],
    });
  });

  it("does not correlate an unresolved identity variant as a direct match", () => {
    const result = correlateTaskTimeline({
      taskIdentity: "Jeffrey Becker",
      timelineIdentity: "Jeffery Becker",
      taskSourceRecordId: "task-2",
      timelineEventIds: ["event-3"],
    });

    expect(result.status).toBe("unresolved_variant");
    expect(result.taskSourceRecordId).toBe("task-2");
    expect(result.timelineEventIds).toEqual(["event-3"]);
  });

  it("does not correlate unrelated identities", () => {
    const result = correlateTaskTimeline({
      taskIdentity: "Ana Yu",
      timelineIdentity: "Jim Wilson",
      taskSourceRecordId: "task-3",
      timelineEventIds: ["event-4"],
    });

    expect(result).toEqual({
      status: "no_match",
      taskSourceRecordId: "task-3",
      timelineEventIds: [],
    });
  });

  it("preserves the timeline event IDs without changing their order", () => {
    const result = correlateTaskTimeline({
      taskIdentity: "Jim Wilson",
      timelineIdentity: "Jim Wilson",
      taskSourceRecordId: "task-4",
      timelineEventIds: ["event-7", "event-2", "event-9"],
    });

    expect(result.timelineEventIds).toEqual([
      "event-7",
      "event-2",
      "event-9",
    ]);
  });

  it("does not infer identity from timeline activity itself", () => {
    const result = correlateTaskTimeline({
      taskIdentity: "Unknown Person",
      timelineIdentity: "Unknown Person",
      taskSourceRecordId: "task-5",
      timelineEventIds: [],
    });

    expect(result.status).toBe("direct_match");
    expect(result.timelineEventIds).toEqual([]);
  });
});
