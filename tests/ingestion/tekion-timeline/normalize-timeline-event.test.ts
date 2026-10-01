import { describe, expect, it } from "vitest";
import { normalizeTimelineEvent } from "../../../src/integrations/tekion/timeline/normalize-timeline-event";
import type { TekionTimelineEvent } from "../../../src/integrations/tekion/timeline/timeline-event";

function event(rawType: string): TekionTimelineEvent {
  return {
    sourceFile: "sample.txt",
    rawType,
    occurredAt: "2026-09-28T19:36:00.000Z",
    actor: "Salesperson",
    details: "Example",
    category: "other",
  };
}

describe("normalizeTimelineEvent", () => {
  it("classifies communications", () => {
    expect(normalizeTimelineEvent(event("Email Sent")).category).toBe(
      "communication",
    );

    expect(normalizeTimelineEvent(event("Text Received")).category).toBe(
      "communication",
    );
  });

  it("classifies lifecycle events", () => {
    expect(normalizeTimelineEvent(event("Stage Changed")).category).toBe(
      "lifecycle",
    );
  });

  it("classifies deal events", () => {
    expect(normalizeTimelineEvent(event("Deal Created")).category).toBe(
      "deal",
    );
  });

  it("leaves unknown event types as other", () => {
    expect(normalizeTimelineEvent(event("Unknown Event")).category).toBe(
      "other",
    );
  });
});