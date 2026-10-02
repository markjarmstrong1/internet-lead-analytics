import { describe, expect, it, vi } from "vitest";

import type { TimelineAnalyticsEvent } from "../timeline/timeline-analytics-event";
import type { TimelineAnalyticsRepository } from "../timeline/timeline-analytics-repository";

const loadEvents = vi.fn<() => Promise<TimelineAnalyticsEvent[]>>();

vi.mock(
  "../timeline/create-server-timeline-analytics-repository",
  () => ({
    createServerTimelineAnalyticsRepository: (): TimelineAnalyticsRepository => ({
      loadEvents,
    }),
  }),
);

import { getFirstOutboundResponseRate } from "./get-first-outbound-response-rate";

describe("getFirstOutboundResponseRate", () => {
  it("calculates the metric from the persisted analytics repository", async () => {
    loadEvents.mockResolvedValue([
      {
        timelineRecordId: "lead-1",
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
      {
        timelineRecordId: "lead-1",
        sourceEventId: "inbound-1",
        sourceFile: "lead.txt",
        occurredAt: "2026-01-01T12:00:00.000Z",
        rawType: "Text Received",
        actor: "Customer",
        actorType: "unknown",
        category: "communication",
        channel: "text",
        direction: "inbound",
        details: "Thanks",
      },
    ]);

    const result = await getFirstOutboundResponseRate();

    expect(loadEvents).toHaveBeenCalledTimes(1);
    expect(result.denominator).toBe(1);
    expect(result.numerator).toBe(1);
    expect(result.rate).toBe(1);
  });

  it("propagates repository read failures", async () => {
    loadEvents.mockRejectedValue(
      new Error("timeline read failed"),
    );

    await expect(
      getFirstOutboundResponseRate(),
    ).rejects.toThrow("timeline read failed");
  });
});
