import { describe, expect, it } from "vitest";

import { buildTimelineAnalyticsEvents } from "./build-timeline-analytics-events";
import type { PersistedTimelineEvent } from "@/integrations/import/reconcile-timeline-import";

function event(
  overrides: Partial<PersistedTimelineEvent> = {},
): PersistedTimelineEvent {
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
  };
}

describe("buildTimelineAnalyticsEvents", () => {
  it("maps persisted timeline events into analytics events", () => {
    expect(
      buildTimelineAnalyticsEvents([
        event({
          source_event_id: "outbound-1",
        }),
      ]),
    ).toEqual([
      {
        timelineRecordId: "record-1",
        sourceEventId: "outbound-1",
        occurredAt: "2026-01-01T10:00:00.000Z",
        category: "communication",
        actorType: "employee",
        channel: "text",
        direction: "outbound",
      },
    ]);
  });

  it("does not invent unsupported channel or direction values", () => {
    expect(
      buildTimelineAnalyticsEvents([
        event({
          channel: "carrier-pigeon",
          direction: "sideways",
        }),
      ]),
    ).toEqual([
      {
        timelineRecordId: "record-1",
        sourceEventId: "event-1",
        occurredAt: "2026-01-01T10:00:00.000Z",
        category: "communication",
        actorType: "employee",
        channel: null,
        direction: null,
      },
    ]);
  });
});
