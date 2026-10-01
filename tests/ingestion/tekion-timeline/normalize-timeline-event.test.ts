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
  it("normalizes outbound email semantics", () => {
    const result = normalizeTimelineEvent(event("Email Sent"));

    expect(result.sourceEventId).toMatch(/^tekion:/);
    expect(result.category).toBe("communication");
    expect(result.communicationChannel).toBe("email");
    expect(result.communicationDirection).toBe("outbound");
    expect(result.actorType).toBe("employee");
  });

  it("normalizes inbound text semantics", () => {
    const result = normalizeTimelineEvent(event("Text Received"));

    expect(result.category).toBe("communication");
    expect(result.communicationChannel).toBe("text");
    expect(result.communicationDirection).toBe("inbound");
  });

  it("keeps non-communication events free of communication semantics", () => {
    const result = normalizeTimelineEvent(event("Stage Changed"));

    expect(result.category).toBe("lifecycle");
    expect(result.communicationChannel).toBeUndefined();
    expect(result.communicationDirection).toBeUndefined();
    expect(result.actorType).toBe("employee");
  });

  it("preserves source evidence", () => {
    const result = normalizeTimelineEvent(event("Email Sent"));

    expect(result.sourceFile).toBe("sample.txt");
    expect(result.rawType).toBe("Email Sent");
    expect(result.occurredAt).toBe("2026-09-28T19:36:00.000Z");
    expect(result.actor).toBe("Salesperson");
    expect(result.details).toBe("Example");
  });

  it("leaves unknown events as other", () => {
    const result = normalizeTimelineEvent(event("Unknown Event"));

    expect(result.category).toBe("other");
    expect(result.communicationChannel).toBeUndefined();
    expect(result.communicationDirection).toBeUndefined();
  });
});
