import { describe, expect, it } from "vitest";

import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";
import {
  buildLeadObservations,
} from "@/analytics/observations/analytics-observations";

function lead(
  leadId: string,
  timelineRecordIds: string[],
): AnalyticsDataset["leads"][number] {
  return {
    leadId,
    contactName: leadId,
    source: "Test",
    sourceGroup: "",
    stage: "Engage",
    status: "active",
    creationTime: null,
    soldDate: null,
    closedTime: null,
    timelineRecordIds,
  };
}

function event(
  timelineRecordId: string,
  sourceEventId: string,
  overrides: Partial<AnalyticsDataset["events"][number]> = {},
): AnalyticsDataset["events"][number] {
  return {
    timelineRecordId,
    sourceEventId,
    sourceFile: `${timelineRecordId}.docx`,
    occurredAt: "2026-01-01T10:00:00.000Z",
    rawType: "Text Sent",
    actor: "Employee",
    actorType: "employee",
    category: "communication",
    channel: "text",
    direction: "outbound",
    details: "Hello",
    templateCode: "TEMPLATE-1",
    metadata: {},
    rawData: {},
    ...overrides,
  };
}

function observe(dataset: AnalyticsDataset) {
  return buildLeadObservations(dataset);
}

describe("cross-record event deduplication", () => {
  it("counts a matching outbound event once when it appears in two records for the same lead", () => {
    const result = observe({
      leads: [lead("lead-1", ["record-1", "record-2"])],
      events: [
        event("record-1", "event-a"),
        event("record-2", "event-b"),
      ],
    })[0];

    expect(result.outboundCount).toBe(1);
    expect(result.events).toHaveLength(1);
    expect(result.templateActions).toHaveLength(1);
  });

  it("preserves distinct events across records linked to the same lead", () => {
    const result = observe({
      leads: [lead("lead-1", ["record-1", "record-2"])],
      events: [
        event("record-1", "event-a"),
        event("record-2", "event-b", {
          occurredAt: "2026-01-01T10:05:00.000Z",
          details: "A different message",
        }),
      ],
    })[0];

    expect(result.outboundCount).toBe(2);
    expect(result.events).toHaveLength(2);
  });

  it("preserves repeated matching events within a single record", () => {
    const result = observe({
      leads: [lead("lead-1", ["record-1"])],
      events: [
        event("record-1", "event-a"),
        event("record-1", "event-b"),
      ],
    })[0];

    expect(result.outboundCount).toBe(2);
    expect(result.events).toHaveLength(2);
    expect(result.templateActions).toHaveLength(2);
  });

  it("does not deduplicate matching-looking events across different leads", () => {
    const result = observe({
      leads: [
        lead("lead-1", ["record-1"]),
        lead("lead-2", ["record-2"]),
      ],
      events: [
        event("record-1", "event-a"),
        event("record-2", "event-b"),
      ],
    });

    expect(result).toHaveLength(2);
    expect(result[0].outboundCount).toBe(1);
    expect(result[1].outboundCount).toBe(1);
  });

  it("preserves the highest repeated-event count found in any one record", () => {
    const result = observe({
      leads: [lead("lead-1", ["record-1", "record-2"])],
      events: [
        event("record-1", "event-a"),
        event("record-1", "event-b"),
        event("record-2", "event-c"),
      ],
    })[0];

    expect(result.outboundCount).toBe(2);
    expect(result.events).toHaveLength(2);
  });
});
