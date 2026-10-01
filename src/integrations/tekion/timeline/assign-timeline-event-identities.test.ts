import { describe, expect, it } from "vitest";

import { assignTimelineEventIdentities } from "./assign-timeline-event-identities";
import type { TekionNormalizedTimelineEvent } from "./normalized-timeline-event";

function event(sourceEventId: string): TekionNormalizedTimelineEvent {
  return {
    sourceFile: "ana_yu.txt",
    rawType: "Day 5 Internet Lead Tasking - Touch",
    occurredAt: "2026-09-28T09:04:00.000Z",
    actor: "System",
    details: "Day 5 Internet Lead Tasking - Touch",
    category: "task",
    sourceEventId,
    actorType: "system",
  };
}

describe("assignTimelineEventIdentities", () => {
  it("preserves the first identity and distinguishes repeated observations", () => {
    const result = assignTimelineEventIdentities([
      event("tekion:abc123"),
      event("tekion:abc123"),
      event("tekion:def456"),
      event("tekion:abc123"),
    ]);

    expect(result.map((item) => item.sourceEventId)).toEqual([
      "tekion:abc123",
      "tekion:abc123:occurrence:2",
      "tekion:def456",
      "tekion:abc123:occurrence:3",
    ]);
  });

  it("produces deterministic identities for the same source sequence", () => {
    const first = assignTimelineEventIdentities([
      event("tekion:abc123"),
      event("tekion:abc123"),
    ]);

    const second = assignTimelineEventIdentities([
      event("tekion:abc123"),
      event("tekion:abc123"),
    ]);

    expect(first.map((item) => item.sourceEventId)).toEqual(
      second.map((item) => item.sourceEventId),
    );
  });

  it("does not change unique event identities", () => {
    const result = assignTimelineEventIdentities([
      event("tekion:abc123"),
      event("tekion:def456"),
    ]);

    expect(result.map((item) => item.sourceEventId)).toEqual([
      "tekion:abc123",
      "tekion:def456",
    ]);
  });
});
