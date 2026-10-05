import { describe, expect, it } from "vitest";

import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";
import { buildDashboardAnalysis } from "./dashboard";

function event(
  leadId: string,
  overrides: Partial<AnalyticsDataset["events"][number]> = {},
): AnalyticsDataset["events"][number] {
  return {
    timelineRecordId: leadId,
    sourceEventId: `${leadId}-event`,
    sourceFile: `${leadId}.txt`,
    occurredAt: "2026-01-01T10:05:00.000Z",
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
    source: "Source A",
    sourceGroup: "Group A",
    stage: "Sold",
    status: "active",
    creationTime: "2026-01-01T10:00:00.000Z",
    soldDate: "2026-01-02T10:00:00.000Z",
    closedTime: null,
    timelineRecordIds: [id],
  };
}

describe("Sold / Closed action analytics", () => {
  it("attributes the observed response to the last outbound action at or before the response", () => {
    const dataset: AnalyticsDataset = {
      leads: [lead("sold-1")],
      events: [
        event("sold-1", {
          sourceEventId: "sold-1-first",
          occurredAt: "2026-01-01T10:03:00.000Z",
          rawType: "Text Sent",
          channel: "text",
        }),
        event("sold-1", {
          sourceEventId: "sold-1-response-action",
          occurredAt: "2026-01-01T10:06:00.000Z",
          rawType: "Email Sent",
          channel: "email",
          details:
            "customer@example.com\nSubject: Follow-up",
        }),
        event("sold-1", {
          sourceEventId: "sold-1-response",
          occurredAt: "2026-01-01T10:08:00.000Z",
          rawType: "Email Received",
          actorType: "unknown",
          direction: "inbound",
          channel: "email",
        }),
      ],
    };

    const result = buildDashboardAnalysis(dataset);

    expect(result.soldLeadAnalytics.timelineCovered).toBe(1);
    expect(result.soldLeadAnalytics.timelineCoverageRate).toBe(1);

    expect(
      result.soldLeadAnalytics.firstActions,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "Text Sent",
          contacted: 1,
          responded: 1,
          averageResponseMinutes: 5,
        }),
      ]),
    );

    expect(
      result.soldLeadAnalytics.responseActions,
    ).toEqual([
      expect.objectContaining({
        action: "Email Sent",
        channel: "email",
        responses: 1,
        averageResponseMinutes: 5,
        medianResponseMinutes: 5,
      }),
    ]);

    expect(
      result.soldLeadAnalytics.templates,
    ).toEqual([
      expect.objectContaining({
        template: "Follow-up",
        templateSource: "email_subject",
        uses: 1,
        leads: 1,
        responded: 1,
      }),
    ]);
  });
});


it("does not imply communication performance when Sold / Closed leads have no timeline evidence", () => {
  const dataset: AnalyticsDataset = {
    leads: [
      {
        ...lead("sold-without-timeline"),
        timelineRecordIds: [],
      },
    ],
    events: [],
  };

  const result = buildDashboardAnalysis(dataset);

  expect(result.soldLeadAnalytics.soldClosed).toBe(1);
  expect(result.soldLeadAnalytics.timelineCovered).toBe(0);
  expect(result.soldLeadAnalytics.timelineCoverageRate).toBe(0);
  expect(result.soldLeadAnalytics.contacted).toBe(0);
  expect(result.soldLeadAnalytics.responded).toBe(0);
  expect(result.soldLeadAnalytics.firstActions).toEqual([]);
  expect(result.soldLeadAnalytics.responseActions).toEqual([]);
  expect(result.soldLeadAnalytics.templates).toEqual([]);
});
