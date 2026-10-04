import { describe, expect, it } from "vitest";

import { buildAnalyticsEvents } from "./build-analytics-events";

function event(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: "row-1",
    timeline_record_id: "record-1",
    source_event_id: "event-1",
    source_file: "lead.txt",
    occurred_at: "2026-01-01T10:00:00.000Z",
    raw_type: "Text Sent",
    actor: "Mark Armstrong",
    actor_type: "employee",
    category: "communication",
    channel: "text",
    direction: "outbound",
    details: "Hello",
    metadata: {},
    raw_data: {},
    ...overrides,
  } as never;
}

describe("buildAnalyticsEvents", () => {
  it("maps persisted events into the analytics domain", () => {
    expect(
      buildAnalyticsEvents([
        event({
          source_event_id: "outbound-1",
        }),
      ]),
    ).toEqual([
      {
        timelineRecordId: "record-1",
        sourceEventId: "outbound-1",
        sourceFile: "lead.txt",
        occurredAt: "2026-01-01T10:00:00.000Z",
        rawType: "Text Sent",
        actor: "Mark Armstrong",
        actorType: "employee",
        category: "communication",
        channel: "text",
        direction: "outbound",
        details: "Hello",
      },
    ]);
  });

  it("does not invent unsupported channel or direction values", () => {
    expect(
      buildAnalyticsEvents([
        event({
          channel: "carrier-pigeon",
          direction: "sideways",
        }),
      ]),
    ).toEqual([
      {
        timelineRecordId: "record-1",
        sourceEventId: "event-1",
        sourceFile: "lead.txt",
        occurredAt: "2026-01-01T10:00:00.000Z",
        rawType: "Text Sent",
        actor: "Mark Armstrong",
        actorType: "employee",
        category: "communication",
        channel: null,
        direction: null,
        details: "Hello",
      },
    ]);
  });
});
