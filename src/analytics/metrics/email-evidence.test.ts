import { describe, expect, it } from "vitest";

import type { AnalyticsEvent } from "@/analytics/data/analytics-types";
import {
  buildEmailEvidence,
  parseEmailEvidence,
} from "./email-evidence";

function event(
  overrides: Partial<AnalyticsEvent> = {},
): AnalyticsEvent {
  return {
    timelineRecordId: "lead-1",
    sourceEventId: "event-1",
    sourceFile: "lead.txt",
    occurredAt: "2026-10-01T10:00:00.000Z",
    rawType: "Email Sent",
    actor: "Mark Armstrong",
    actorType: "employee",
    category: "communication",
    channel: "email",
    direction: "outbound",
    details:
      "Customer@example.com\nSubject: Test\n\n3 Open 1 Clicks | Last Opened Today, 12:00 PM",
    templateCode: "e36",
    metadata: {},
    rawData: {},
    ...overrides,
  };
}

describe("email evidence", () => {
  it("parses opens and clicks from Tekion email details", () => {
    expect(
      parseEmailEvidence(event()),
    ).toEqual({
      opens: 3,
      clicks: 1,
    });
  });

  it("handles zero-open email sends", () => {
    expect(
      parseEmailEvidence(
        event({
          details:
            "Subject: Test\n0 Open 0 Clicks",
        }),
      ),
    ).toEqual({
      opens: 0,
      clicks: 0,
    });
  });

  it("attributes the first inbound until another outbound interrupts it", () => {
    const email = event();

    const result = buildEmailEvidence([
      email,
      event({
        sourceEventId: "response",
        occurredAt:
          "2026-10-01T10:12:00.000Z",
        rawType: "Text Received",
        actor: "Customer",
        actorType: "customer",
        channel: "text",
        direction: "inbound",
        details: "Yes",
      }),
    ]);

    expect(
      result[0]?.firstInbound?.sourceEventId,
    ).toBe("response");

    expect(
      result[0]?.firstInboundChannel,
    ).toBe("text");

    expect(
      result[0]?.firstInboundMinutes,
    ).toBe(12);
  });

  it("does not attribute a later inbound after another outbound", () => {
    const email = event();

    const result = buildEmailEvidence([
      email,
      event({
        sourceEventId: "follow-up",
        occurredAt:
          "2026-10-01T10:05:00.000Z",
        rawType: "Text Sent",
        channel: "text",
        actorType: "unknown",
        details: "Follow up",
      }),
      event({
        sourceEventId: "response",
        occurredAt:
          "2026-10-01T10:12:00.000Z",
        rawType: "Text Received",
        actor: "Customer",
        actorType: "customer",
        channel: "text",
        direction: "inbound",
        details: "Yes",
      }),
    ]);

    expect(
      result[0]?.firstInbound,
    ).toBeNull();
  });
});
