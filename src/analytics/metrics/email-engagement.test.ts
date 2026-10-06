import { describe, expect, it } from "vitest";

import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";
import { buildEmailEngagementAnalysis } from "./email-engagement";

function event(
  timelineRecordId: string,
  overrides: Partial<
    AnalyticsDataset["events"][number]
  > = {},
): AnalyticsDataset["events"][number] {
  return {
    timelineRecordId,
    sourceEventId:
      `${timelineRecordId}-email`,
    sourceFile: "lead.txt",
    occurredAt:
      "2026-10-01T10:00:00.000Z",
    rawType: "Email Sent",
    actor: "Employee",
    actorType: "employee",
    category: "communication",
    channel: "email",
    direction: "outbound",
    details:
      "Subject: Test\n\n3 Open 1 Clicks",
    templateCode: "e36",
    metadata: {},
    rawData: {},
    ...overrides,
  };
}

function lead(
  id: string,
): AnalyticsDataset["leads"][number] {
  return {
    leadId: id,
    contactName: id,
    source: "Source",
    sourceGroup: "Group",
    stage: "Engage",
    status: "active",
    creationTime:
      "2026-10-01T09:00:00.000Z",
    firstContactedTime:
      "2026-10-01T10:00:00.000Z",
    soldDate: null,
    closedTime: null,
    timelineRecordIds: [id],
  };
}

describe("buildEmailEngagementAnalysis", () => {
  it("uses the complete timeline when attributing email responses", () => {
    const result =
      buildEmailEngagementAnalysis({
        leads: [lead("lead-1")],
        events: [
          event("lead-1"),
          event("lead-1", {
            sourceEventId:
              "lead-1-response",
            occurredAt:
              "2026-10-01T10:12:00.000Z",
            rawType: "Text Received",
            actor: "Customer",
            actorType: "unknown",
            category: "communication",
            channel: "text",
            direction: "inbound",
            details: "Yes",
            templateCode: null,
          }),
        ],
        templates: [
          {
            templateCode: "e36",
            name: "Sales Vanilla",
          },
        ],
      });

    expect(result.sends).toBe(1);
    expect(result.leads).toBe(1);
    expect(result.opens).toBe(3);
    expect(result.openedSends).toBe(1);
    expect(result.clicks).toBe(1);
    expect(result.firstInbound).toBe(1);
    expect(result.attributedResponses).toBe(1);
    expect(result.averageFirstResponseMinutes).toBe(12);
    expect(result.openedResponses).toBe(1);
    expect(result.openedResponseRate).toBe(1);
    expect(result.openedNoResponse).toBe(0);
    expect(result.unopenedResponses).toBe(0);
    expect(result.templates[0]?.leads).toBe(1);
    expect(result.templates[0]?.openedResponses).toBe(1);
  });

  it("separates opened no-response sends from unopened responses", () => {
    const result =
      buildEmailEngagementAnalysis({
        leads: [
          lead("lead-1"),
          lead("lead-2"),
        ],
        events: [
          event("lead-1", {
            sourceEventId:
              "opened-no-response",
            details:
              "Subject: Test\n\n2 Opens 0 Clicks",
          }),
          event("lead-2", {
            sourceEventId:
              "unopened-response",
            details:
              "Subject: Test\n\n0 Opens 0 Clicks",
          }),
          event("lead-2", {
            sourceEventId:
              "unopened-response-inbound",
            occurredAt:
              "2026-10-01T10:15:00.000Z",
            rawType: "Email Received",
            actor: "Customer",
            actorType: "unknown",
            category: "communication",
            channel: "email",
            direction: "inbound",
            details: "Reply",
            templateCode: null,
          }),
        ],
      });

    expect(result.sends).toBe(2);
    expect(result.openedSends).toBe(1);
    expect(result.openedNoResponse).toBe(1);
    expect(result.openedResponses).toBe(0);
    expect(result.unopenedResponses).toBe(1);
  });

  it("maps template lead counts to actual lead ids", () => {
    const result =
      buildEmailEngagementAnalysis({
        leads: [
          lead("lead-a"),
          lead("lead-b"),
        ],
        events: [
          event("lead-a", {
            sourceEventId: "a",
            templateCode: "e36",
          }),
          event("lead-a", {
            sourceEventId: "b",
            occurredAt:
              "2026-10-01T10:05:00.000Z",
            templateCode: "e36",
          }),
          event("lead-b", {
            sourceEventId: "c",
            occurredAt:
              "2026-10-01T11:00:00.000Z",
            templateCode: "e36",
          }),
        ],
        templates: [
          {
            templateCode: "e36",
            name: "Sales Vanilla",
          },
        ],
      });

    const row =
      result.templates.find(
        (template) =>
          template.template === "Sales Vanilla",
      );

    expect(row?.sends).toBe(3);
    expect(row?.leads).toBe(2);
  });
});
