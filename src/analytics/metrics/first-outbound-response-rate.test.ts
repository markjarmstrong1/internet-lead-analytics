import { describe, expect, it } from "vitest";

import { calculateFirstOutboundResponseRate } from "./first-outbound-response-rate";
import type { TimelineAnalyticsEvent } from "../timeline/timeline-analytics-event";

function event(
  overrides: Partial<TimelineAnalyticsEvent>,
): TimelineAnalyticsEvent {
  return {
    timelineRecordId: "lead-1",
    sourceEventId: "event-1",
    occurredAt: "2026-01-01T10:00:00.000Z",
    category: "communication",
    actorType: "employee",
    channel: "text",
    direction: "outbound",
    ...overrides,
  };
}

describe("calculateFirstOutboundResponseRate", () => {
  it("counts a customer response inside the 24-hour window", () => {
    const result = calculateFirstOutboundResponseRate([
      event({
        sourceEventId: "outbound-1",
      }),
      event({
        sourceEventId: "inbound-1",
        occurredAt: "2026-01-01T12:00:00.000Z",
        actorType: "unknown",
        direction: "inbound",
      }),
    ]);

    expect(result.denominator).toBe(1);
    expect(result.numerator).toBe(1);
    expect(result.rate).toBe(1);
    expect(result.evidence).toEqual([
      {
        timelineRecordId: "lead-1",
        exposureEventId: "outbound-1",
        outcomeEventId: "inbound-1",
        exposureAt: "2026-01-01T10:00:00.000Z",
        outcomeAt: "2026-01-01T12:00:00.000Z",
      },
    ]);
  });

  it("does not count a response after the 24-hour window", () => {
    const result = calculateFirstOutboundResponseRate([
      event({
        sourceEventId: "outbound-1",
      }),
      event({
        sourceEventId: "inbound-1",
        occurredAt: "2026-01-02T10:00:01.000Z",
        actorType: "unknown",
        direction: "inbound",
      }),
    ]);

    expect(result.denominator).toBe(1);
    expect(result.numerator).toBe(0);
    expect(result.rate).toBe(0);
  });

  it("uses only the first outbound employee communication per lead", () => {
    const result = calculateFirstOutboundResponseRate([
      event({
        sourceEventId: "first-text",
        occurredAt: "2026-01-01T10:00:00.000Z",
      }),
      event({
        sourceEventId: "second-email",
        occurredAt: "2026-01-01T11:00:00.000Z",
        channel: "email",
      }),
      event({
        sourceEventId: "response",
        occurredAt: "2026-01-01T12:00:00.000Z",
        actorType: "unknown",
        direction: "inbound",
      }),
    ]);

    expect(result.evidence[0]?.exposureEventId).toBe(
      "first-text",
    );
    expect(result.evidence[0]?.outcomeEventId).toBe(
      "response",
    );
  });

  it("ignores inbound activity before the outbound exposure", () => {
    const result = calculateFirstOutboundResponseRate([
      event({
        sourceEventId: "prior-inbound",
        occurredAt: "2026-01-01T09:00:00.000Z",
        actorType: "unknown",
        direction: "inbound",
      }),
      event({
        sourceEventId: "outbound",
        occurredAt: "2026-01-01T10:00:00.000Z",
      }),
    ]);

    expect(result.denominator).toBe(1);
    expect(result.numerator).toBe(0);
  });

  it("produces channel-level breakdowns", () => {
    const result = calculateFirstOutboundResponseRate([
      event({
        timelineRecordId: "text-lead",
        sourceEventId: "text-outbound",
        channel: "text",
      }),
      event({
        timelineRecordId: "text-lead",
        sourceEventId: "text-response",
        occurredAt: "2026-01-01T11:00:00.000Z",
        actorType: "unknown",
        direction: "inbound",
      }),
      event({
        timelineRecordId: "email-lead",
        sourceEventId: "email-outbound",
        channel: "email",
      }),
    ]);

    expect(result.breakdowns).toEqual([
      {
        key: "email",
        label: "email",
        denominator: 1,
        numerator: 0,
        rate: 0,
      },
      {
        key: "text",
        label: "text",
        denominator: 1,
        numerator: 1,
        rate: 1,
      },
      {
        key: "phone",
        label: "phone",
        denominator: 0,
        numerator: 0,
        rate: null,
      },
      {
        key: "voicemail",
        label: "voicemail",
        denominator: 0,
        numerator: 0,
        rate: null,
      },
    ]);
  });

  it("returns a null rate when no qualifying exposure exists", () => {
    const result = calculateFirstOutboundResponseRate([
      event({
        category: "lifecycle",
        direction: null,
      }),
    ]);

    expect(result.denominator).toBe(0);
    expect(result.numerator).toBe(0);
    expect(result.rate).toBeNull();
  });
});
