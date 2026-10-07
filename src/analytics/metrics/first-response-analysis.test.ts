import { describe, expect, it } from "vitest";

import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";
import { buildLeadObservations } from "@/analytics/observations/analytics-observations";
import { buildFirstResponseAnalysis } from "./first-response-analysis";

function event(
  leadId: string,
  overrides: Partial<
    AnalyticsDataset["events"][number]
  > = {},
): AnalyticsDataset["events"][number] {
  return {
    timelineRecordId: leadId,
    sourceEventId:
      `${leadId}-event`,
    sourceFile: "lead.txt",
    occurredAt:
      "2026-10-01T10:00:00.000Z",
    rawType: "Text Sent",
    actor: "Employee",
    actorType: "employee",
    category: "communication",
    channel: "text",
    direction: "outbound",
    details: "Hello",
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

describe("buildFirstResponseAnalysis", () => {
  it("separates eligible leads, responses, and no-response leads", () => {
    const dataset: AnalyticsDataset = {
      leads: [
        lead("responded"),
        lead("no-response"),
        {
          ...lead("no-timeline"),
          timelineRecordIds: [],
        },
      ],
      events: [
        event("responded"),
        event("responded", {
          sourceEventId:
            "responded-inbound",
          occurredAt:
            "2026-10-01T10:10:00.000Z",
          rawType: "Text Received",
          actor: "Customer",
          actorType: "unknown",
          category: "communication",
          channel: "text",
          direction: "inbound",
        }),
        event("no-response"),
      ],
    };

    const result =
      buildFirstResponseAnalysis(
        buildLeadObservations(dataset),
      );

    expect(result.contacted).toBe(3);
    expect(result.eligible).toBe(2);
    expect(result.responded).toBe(1);
    expect(result.noResponse).toBe(1);
    expect(result.responseRate).toBe(0.5);
    expect(result.medianMinutes).toBe(10);
  });

  it("groups first responses by customer channel", () => {
    const dataset: AnalyticsDataset = {
      leads: [
        lead("email"),
        lead("text"),
      ],
      events: [
        event("email", {
          sourceEventId: "email-send",
          rawType: "Email Sent",
          channel: "email",
        }),
        event("email", {
          sourceEventId: "email-reply",
          occurredAt:
            "2026-10-01T10:05:00.000Z",
          rawType: "Email Received",
          actor: "Customer",
          actorType: "unknown",
          category: "communication",
          channel: "email",
          direction: "inbound",
        }),
        event("text", {
          sourceEventId: "text-send",
        }),
        event("text", {
          sourceEventId: "text-reply",
          occurredAt:
            "2026-10-01T10:20:00.000Z",
          rawType: "Text Received",
          actor: "Customer",
          actorType: "unknown",
          category: "communication",
          channel: "text",
          direction: "inbound",
        }),
      ],
    };

    const result =
      buildFirstResponseAnalysis(
        buildLeadObservations(dataset),
      );

    const email =
      result.channels.find(
        (row) => row.channel === "email",
      );

    const text =
      result.channels.find(
        (row) => row.channel === "text",
      );

    expect(email?.responses).toBe(1);
    expect(email?.medianMinutes).toBe(5);
    expect(text?.responses).toBe(1);
    expect(text?.medianMinutes).toBe(20);
  });

  it("attributes the outbound action immediately before response", () => {
    const dataset: AnalyticsDataset = {
      leads: [lead("lead-1")],
      events: [
        event("lead-1", {
          sourceEventId: "first",
          rawType: "Email Sent",
          channel: "email",
        }),
        event("lead-1", {
          sourceEventId: "second",
          occurredAt:
            "2026-10-01T10:08:00.000Z",
          rawType: "Text Sent",
          channel: "text",
        }),
        event("lead-1", {
          sourceEventId: "reply",
          occurredAt:
            "2026-10-01T10:12:00.000Z",
          rawType: "Text Received",
          actor: "Customer",
          actorType: "unknown",
          category: "communication",
          channel: "text",
          direction: "inbound",
        }),
      ],
    };

    const result =
      buildFirstResponseAnalysis(
        buildLeadObservations(dataset),
      );

    const row =
      result.actions.find(
        (action) =>
          action.action === "Text Sent",
      );

    expect(row?.responses).toBe(1);
    expect(row?.medianMinutes).toBe(12);
  });
});
