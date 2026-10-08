import { describe, expect, it } from "vitest";

import type { AnalyticsEvent } from "./analytics-types";
import { findCrossRecordDuplicateCandidates } from "./cross-record-event-duplicates";

function event(
  overrides: Partial<AnalyticsEvent> = {},
): AnalyticsEvent {
  return {
    timelineRecordId: "record-1",
    sourceEventId: "event-1",
    sourceFile: "lead-a.docx",
    occurredAt: "2026-01-01T10:00:00.000Z",
    rawType: "Text Sent",
    actor: "Salesperson",
    actorType: "employee",
    category: "communication",
    channel: "text",
    direction: "outbound",
    details: "Hello",
    templateCode: null,
    metadata: {},
    rawData: {},
    ...overrides,
  };
}

describe("findCrossRecordDuplicateCandidates", () => {
  it("reports matching events across different timeline records", () => {
    const result = findCrossRecordDuplicateCandidates([
      event(),
      event({
        timelineRecordId: "record-2",
        sourceEventId: "event-2",
        sourceFile: "timelines/lead-a.docx",
        rawType: " text sent ",
        actor: " salesperson ",
        details: " hello ",
      }),
    ]);

    expect(result).toEqual([
      {
        timelineRecordIds: ["record-1", "record-2"],
        sourceFiles: ["lead-a.docx", "timelines/lead-a.docx"],
        sourceEventIds: ["event-1", "event-2"],
        matchingEventCount: 2,
      },
    ]);
  });

  it("does not flag repeated events contained in only one record", () => {
    const result = findCrossRecordDuplicateCandidates([
      event({ sourceEventId: "event-1" }),
      event({ sourceEventId: "event-2" }),
    ]);

    expect(result).toEqual([]);
  });

  it("does not match events with different timestamps", () => {
    const result = findCrossRecordDuplicateCandidates([
      event(),
      event({
        timelineRecordId: "record-2",
        occurredAt: "2026-01-01T10:01:00.000Z",
      }),
    ]);

    expect(result).toEqual([]);
  });

  it("does not alter the original events", () => {
    const original = [
      event(),
      event({ timelineRecordId: "record-2", sourceEventId: "event-2" }),
    ];
    const before = structuredClone(original);

    findCrossRecordDuplicateCandidates(original);

    expect(original).toEqual(before);
  });
});
