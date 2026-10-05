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
  overrides: Partial<AnalyticsDataset["leads"][number]> = {},
): AnalyticsDataset["leads"][number] {
  return {
    leadId: id,
    contactName: id,
    source: "Source A",
    sourceGroup: "Group A",
    stage: "Engage",
    status: "active",
    creationTime: "2026-01-01T10:00:00.000Z",
    soldDate: null,
    closedTime: null,
    timelineRecordIds: [id],
    ...overrides,
  };
}

describe("buildDashboardAnalysis", () => {
  it("calculates acquisition, contact and response denominators independently", () => {
    const dataset: AnalyticsDataset = {
      leads: [
        lead("lead-1"),
        lead("lead-2"),
        lead("lead-3", {
          timelineRecordIds: [],
        }),
      ],
      events: [
        event("lead-1"),
        event("lead-1", {
          sourceEventId: "lead-1-response",
          occurredAt:
            "2026-01-01T10:10:00.000Z",
          rawType: "Text Received",
          actorType: "unknown",
          direction: "inbound",
        }),
        event("lead-2"),
      ],
    };

    const result =
      buildDashboardAnalysis(dataset);

    expect(result.acquisition.leads).toBe(3);
    expect(result.acquisition.timelineCovered).toBe(2);
    expect(
      result.acquisition.timelineCoverageRate,
    ).toBeCloseTo(2 / 3);

    expect(result.contact.contacted).toBe(2);
    expect(result.contact.notContacted).toBe(1);
    expect(result.contact.contactRate).toBeCloseTo(
      2 / 3,
    );

    expect(result.engagement.responded).toBe(1);
    expect(result.engagement.responseRate).toBe(
      0.5,
    );
  });

  it("calculates true speed-to-lead from creation to first outbound", () => {
    const dataset: AnalyticsDataset = {
      leads: [
        lead("fast", {
          creationTime:
            "2026-01-01T10:00:00.000Z",
        }),
        lead("slow", {
          creationTime:
            "2026-01-01T10:00:00.000Z",
        }),
      ],
      events: [
        event("fast", {
          occurredAt:
            "2026-01-01T10:03:00.000Z",
        }),
        event("slow", {
          occurredAt:
            "2026-01-01T11:30:00.000Z",
        }),
      ],
    };

    const result =
      buildDashboardAnalysis(dataset);

    expect(
      result.contact.medianFirstContactMinutes,
    ).toBe(46.5);

    const underFive =
      result.contact.contactSpeed.find(
        (row) =>
          row.key === "under_5m",
      );

    const oneToFour =
      result.contact.contactSpeed.find(
        (row) =>
          row.key === "1_to_4h",
      );

    expect(underFive?.contacted).toBe(1);
    expect(oneToFour?.contacted).toBe(1);
  });

  it("calculates appointment rates by response-speed population", () => {
    const dataset: AnalyticsDataset = {
      leads: [
        lead("fast-appt"),
        lead("fast-no-appt"),
        lead("slow-appt"),
      ],
      events: [
        event("fast-appt", {
          occurredAt:
            "2026-01-01T10:04:00.000Z",
        }),
        event("fast-appt", {
          sourceEventId:
            "fast-appt-response",
          occurredAt:
            "2026-01-01T10:05:00.000Z",
          rawType: "Text Received",
          actorType: "unknown",
          direction: "inbound",
        }),
        event("fast-appt", {
          sourceEventId:
            "fast-appt-stage",
          occurredAt:
            "2026-01-01T10:04:00.000Z",
          rawType: "Stage Changed",
          category: "lifecycle",
          actorType: "employee",
          channel: null,
          direction: null,
          details:
            "Stage got changed from Engage to Appt. Created",
        }),

        event("fast-no-appt", {
          occurredAt:
            "2026-01-01T10:04:00.000Z",
        }),
        event("fast-no-appt", {
          sourceEventId:
            "fast-no-appt-response",
          occurredAt:
            "2026-01-01T10:05:00.000Z",
          rawType: "Text Received",
          actorType: "unknown",
          direction: "inbound",
        }),

        event("slow-appt"),
        event("slow-appt", {
          sourceEventId:
            "slow-appt-response",
          occurredAt:
            "2026-01-01T12:00:00.000Z",
          rawType: "Text Received",
          actorType: "unknown",
          direction: "inbound",
        }),
        event("slow-appt", {
          sourceEventId:
            "slow-appt-stage",
          occurredAt:
            "2026-01-01T12:05:00.000Z",
          rawType: "Stage Changed",
          category: "lifecycle",
          actorType: "employee",
          channel: null,
          direction: null,
          details:
            "Stage got changed from Engage to Appt. Created",
        }),
      ],
    };

    const result =
      buildDashboardAnalysis(dataset);

    const underFive =
      result.engagement.speed.find(
        (row) =>
          row.key === "under_5m",
      );

    const oneToFour =
      result.engagement.speed.find(
        (row) =>
          row.key === "1_to_4h",
      );

    expect(underFive?.contacted).toBe(2);
    expect(underFive?.appointmentEvidence).toBe(
      1,
    );
    expect(
      underFive?.appointmentRate,
    ).toBe(0.5);

    expect(oneToFour?.contacted).toBe(1);
    expect(oneToFour?.appointmentEvidence).toBe(
      1,
    );
    expect(
      oneToFour?.appointmentRate,
    ).toBe(1);
  });

  it("does not invent sales evidence for sold leads without timelines", () => {
    const dataset: AnalyticsDataset = {
      leads: [
        lead("sold", {
          stage: "Sold",
          timelineRecordIds: [],
        }),
      ],
      events: [],
    };

    const result =
      buildDashboardAnalysis(dataset);

    expect(
      result.progression.soldClosed,
    ).toBe(1);
    expect(
      result.progression.soldClosedWithoutTimeline,
    ).toBe(1);
    expect(
      result.progression.soldClosedWithTimeline,
    ).toBe(0);
    expect(
      result.investigation[0]?.responseMinutes,
    ).toBeNull();
  });


  it("calculates Sold / Closed response timing by first action", () => {
    const dataset: AnalyticsDataset = {
      leads: [
        lead("sold-text", {
          stage: "Sold",
          soldDate:
            "2026-01-02T10:00:00.000Z",
        }),
        lead("sold-email", {
          stage: "Closed",
          closedTime:
            "2026-01-02T10:00:00.000Z",
        }),
      ],
      events: [
        event("sold-text", {
          occurredAt:
            "2026-01-01T10:03:00.000Z",
          rawType: "Text Sent",
          details: "Hello",
        }),
        event("sold-text", {
          sourceEventId:
            "sold-text-response",
          occurredAt:
            "2026-01-01T10:08:00.000Z",
          rawType: "Text Received",
          actorType: "unknown",
          direction: "inbound",
          channel: "text",
        }),

        event("sold-email", {
          sourceEventId:
            "sold-email-first",
          occurredAt:
            "2026-01-01T10:10:00.000Z",
          rawType: "Email Sent",
          channel: "email",
          details:
            "customer@example.com\nSubject: My pleasure to help you today!",
        }),
        event("sold-email", {
          sourceEventId:
            "sold-email-response",
          occurredAt:
            "2026-01-01T10:30:00.000Z",
          rawType: "Email Received",
          actorType: "unknown",
          direction: "inbound",
          channel: "email",
        }),
      ],
    };

    const result =
      buildDashboardAnalysis(dataset);

    expect(
      result.soldLeadAnalytics.soldClosed,
    ).toBe(2);

    expect(
      result.soldLeadAnalytics.averageFirstContactMinutes,
    ).toBe(6.5);

    expect(
      result.soldLeadAnalytics.averageFirstResponseMinutes,
    ).toBe(12.5);

    const text =
      result.soldLeadAnalytics.firstActions.find(
        (row) => row.action === "Text Sent",
      );

    expect(text?.contacted).toBe(1);
    expect(text?.responded).toBe(1);
    expect(text?.averageResponseMinutes).toBe(5);
    expect(text?.soldClosedRate).toBe(1);

    const emailTemplate =
      result.soldLeadAnalytics.templates.find(
        (row) =>
          row.template ===
          "My pleasure to help you today!",
      );

    expect(emailTemplate?.leads).toBe(1);
    expect(emailTemplate?.templateSource).toBe(
      "email_subject",
    );
    expect(emailTemplate?.soldClosedRate).toBe(1);
  });

  it("prefers explicit template metadata over email subject", () => {
    const dataset: AnalyticsDataset = {
      leads: [
        lead("template-lead"),
      ],
      events: [
        event("template-lead", {
          rawType: "Email Sent",
          channel: "email",
          metadata: {
            templateName: "Internet Lead Initial Email",
          },
          details:
            "customer@example.com\\nSubject: Actual email subject",
        }),
      ],
    };

    const result =
      buildDashboardAnalysis(dataset);

    expect(
      result.investigation[0]?.firstTemplate,
    ).toBe(
      "Internet Lead Initial Email",
    );

    expect(
      result.soldLeadAnalytics.templates,
    ).toHaveLength(0);
  });


  it("calculates source rates using their correct denominators", () => {
    const dataset: AnalyticsDataset = {
      leads: [
        lead("a-1", {
          source: "A",
        }),
        lead("a-2", {
          source: "A",
        }),
        lead("b-1", {
          source: "B",
        }),
      ],
      events: [
        event("a-1"),
        event("a-1", {
          sourceEventId: "a-1-response",
          occurredAt:
            "2026-01-01T10:05:00.000Z",
          rawType: "Text Received",
          actorType: "unknown",
          direction: "inbound",
        }),
        event("a-2"),
        event("b-1"),
      ],
    };

    const result =
      buildDashboardAnalysis(dataset);

    const sourceA =
      result.sources.find(
        (row) => row.source === "A",
      );

    expect(sourceA?.leads).toBe(2);
    expect(sourceA?.contacted).toBe(2);
    expect(sourceA?.contactRate).toBe(1);
    expect(sourceA?.responded).toBe(1);
    expect(sourceA?.responseRate).toBe(0.5);
  });
});
