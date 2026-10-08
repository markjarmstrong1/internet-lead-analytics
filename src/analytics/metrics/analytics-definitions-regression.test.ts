import { describe, expect, it } from "vitest";

import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";
import {
  buildLeadObservations,
} from "@/analytics/observations/analytics-observations";
import { buildDashboardAnalysis } from "./dashboard";
import { buildEngagementAnalysis } from "./engagement";

function makeLead(
  id: string,
  overrides: Partial<
    AnalyticsDataset["leads"][number]
  > = {},
): AnalyticsDataset["leads"][number] {
  return {
    leadId: id,
    contactName: id,
    source: "Source",
    sourceGroup: "Group",
    stage: "Engage",
    status: "active",
    creationTime:
      "2026-01-01T10:00:00.000Z",
    soldDate: null,
    closedTime: null,
    timelineRecordIds: [id],
    ...overrides,
  };
}

function makeEvent(
  leadId: string,
  overrides: Partial<
    AnalyticsDataset["events"][number]
  > = {},
): AnalyticsDataset["events"][number] {
  return {
    timelineRecordId: leadId,
    sourceEventId: `${leadId}-event`,
    sourceFile: `${leadId}.txt`,
    occurredAt:
      "2026-01-01T10:05:00.000Z",
    rawType: "Text Sent",
    actor: "Employee",
    actorType: "employee",
    category: "communication",
    channel: "text",
    direction: "outbound",
    details: "Hello",
    ...overrides,
  };
}

describe("canonical analytics definitions", () => {
  it("does not treat inbound before outbound as a response", () => {
    const dataset: AnalyticsDataset = {
      leads: [makeLead("lead-1")],
      events: [
        makeEvent("lead-1", {
          sourceEventId: "inbound-before",
          occurredAt:
            "2026-01-01T09:59:00.000Z",
          rawType: "Text Received",
          actorType: "unknown",
          direction: "inbound",
        }),
        makeEvent("lead-1", {
          sourceEventId: "outbound",
          occurredAt:
            "2026-01-01T10:00:00.000Z",
        }),
      ],
    };

    const observation =
      buildLeadObservations(dataset)[0];

    expect(
      observation?.firstOutbound?.sourceEventId,
    ).toBe("outbound");
    expect(observation?.firstInbound).toBeNull();
    expect(observation?.responseMinutes).toBeNull();
  });

  it("keeps Unknown contact timing outside timed-contact percentages", () => {
    const dataset: AnalyticsDataset = {
      leads: [
        makeLead("timed", {
          firstContactedTime:
            "2026-01-01T10:03:00.000Z",
        }),
        makeLead("unknown", {
          creationTime: null,
          firstContactedTime:
            "2026-01-01T10:03:00.000Z",
        }),
      ],
      events: [
        makeEvent("timed", {
          sourceEventId: "timed-outbound",
          occurredAt:
            "2026-01-01T10:03:00.000Z",
        }),
        makeEvent("unknown", {
          sourceEventId: "unknown-outbound",
          occurredAt:
            "2026-01-01T10:03:00.000Z",
        }),
      ],
    };

    const result =
      buildDashboardAnalysis(dataset);

    const unknown =
      result.contact.contactSpeed.find(
        (row) => row.key === "unknown",
      );

    const underFive =
      result.contact.contactSpeed.find(
        (row) => row.key === "under_5m",
      );

    expect(unknown?.contacted).toBe(1);
    expect(unknown?.rate).toBeNull();
    expect(underFive?.contacted).toBe(1);
    expect(underFive?.rate).toBe(1);
  });

  it("uses contacted and responded populations for appointment rates", () => {
    const dataset: AnalyticsDataset = {
      leads: [
        makeLead("uncontacted-appt"),
        makeLead("contacted-appt", {
          firstContactedTime:
            "2026-01-01T10:05:00.000Z",
        }),
        makeLead("contacted-no-appt", {
          firstContactedTime:
            "2026-01-01T10:05:00.000Z",
        }),
      ],
      events: [
        makeEvent("uncontacted-appt", {
          sourceEventId: "uncontacted-stage",
          occurredAt:
            "2026-01-01T10:06:00.000Z",
          rawType: "Stage Changed",
          category: "lifecycle",
          actorType: "employee",
          channel: null,
          direction: null,
          details:
            "Stage got changed from Engage to Appt. Created",
        }),
        makeEvent("contacted-appt", {
          sourceEventId: "contacted-appt-outbound",
        }),
        makeEvent("contacted-appt", {
          sourceEventId: "contacted-appt-response",
          occurredAt:
            "2026-01-01T10:07:00.000Z",
          rawType: "Text Received",
          actorType: "unknown",
          direction: "inbound",
        }),
        makeEvent("contacted-appt", {
          sourceEventId: "contacted-appt-stage",
          occurredAt:
            "2026-01-01T10:08:00.000Z",
          rawType: "Stage Changed",
          category: "lifecycle",
          actorType: "employee",
          channel: null,
          direction: null,
          details:
            "Stage got changed from Engage to Appt. Created",
        }),
        makeEvent("contacted-no-appt", {
          sourceEventId: "contacted-no-appt-outbound",
        }),
        makeEvent("contacted-no-appt", {
          sourceEventId: "contacted-no-appt-response",
          occurredAt:
            "2026-01-01T10:07:00.000Z",
          rawType: "Text Received",
          actorType: "unknown",
          direction: "inbound",
        }),
      ],
    };

    const result =
      buildDashboardAnalysis(dataset);

    expect(
      result.progression.appointmentRateOfAll,
    ).toBe(2 / 3);

    expect(
      result.progression.appointmentRateOfContacted,
    ).toBe(0.5);

    expect(
      result.progression.appointmentRateOfResponded,
    ).toBe(0.5);
  });

  it("uses observed outbound leads as the response denominator", () => {
    const dataset: AnalyticsDataset = {
      leads: [
        makeLead("crm-contacted-no-outbound", {
          firstContactedTime:
            "2026-01-01T10:05:00.000Z",
        }),
        makeLead("observed-outbound", {
          firstContactedTime:
            "2026-01-01T10:05:00.000Z",
        }),
      ],
      events: [
        makeEvent("crm-contacted-no-outbound", {
          sourceEventId: "crm-only-event",
          rawType: "Task Completed",
          category: "workflow",
          actorType: "employee",
          channel: null,
          direction: null,
        }),
        makeEvent("observed-outbound", {
          sourceEventId: "observed-outbound-event",
        }),
        makeEvent("observed-outbound", {
          sourceEventId: "observed-response",
          occurredAt:
            "2026-01-01T10:07:00.000Z",
          rawType: "Text Received",
          actorType: "unknown",
          direction: "inbound",
        }),
      ],
    };

    const result = buildDashboardAnalysis(dataset);

    expect(result.engagement.contacted).toBe(2);
    expect(result.engagement.responseEligible).toBe(1);
    expect(result.engagement.responded).toBe(1);
    expect(result.engagement.responseRate).toBe(1);
    expect(result.engagement.responseEvidenceCoverageRate).toBe(0.5);
  });

  it("uses contacted leads as the response-speed outcome denominator", () => {
    const dataset: AnalyticsDataset = {
      leads: [
        makeLead("appt", {
          firstContactedTime:
            "2026-01-01T10:05:00.000Z",
        }),
        makeLead("no-appt", {
          firstContactedTime:
            "2026-01-01T10:05:00.000Z",
        }),
      ],
      events: [
        makeEvent("appt", {
          sourceEventId: "appt-outbound",
        }),
        makeEvent("appt", {
          sourceEventId: "appt-response",
          occurredAt:
            "2026-01-01T10:07:00.000Z",
          rawType: "Text Received",
          actorType: "unknown",
          direction: "inbound",
        }),
        makeEvent("appt", {
          sourceEventId: "appt-stage",
          occurredAt:
            "2026-01-01T10:08:00.000Z",
          rawType: "Stage Changed",
          category: "lifecycle",
          actorType: "employee",
          channel: null,
          direction: null,
          details:
            "Stage got changed from Engage to Appt. Created",
        }),
        makeEvent("no-appt", {
          sourceEventId: "no-appt-outbound",
        }),
        makeEvent("no-appt", {
          sourceEventId: "no-appt-response",
          occurredAt:
            "2026-01-01T10:07:00.000Z",
          rawType: "Text Received",
          actorType: "unknown",
          direction: "inbound",
        }),
      ],
    };

    const result =
      buildEngagementAnalysis(dataset);

    const bucket =
      result.appointmentSpeed.find(
        (row) => row.key === "under_5m",
      );

    expect(bucket?.numerator).toBe(1);
    expect(bucket?.denominator).toBe(2);
    expect(bucket?.rate).toBe(0.5);
  });

  it("keeps CRM-contacted leads without observed outbound out of response analysis", () => {
    const dataset: AnalyticsDataset = {
      leads: [
        makeLead("crm-only", {
          firstContactedTime:
            "2026-01-01T10:05:00.000Z",
        }),
        makeLead("responded", {
          firstContactedTime:
            "2026-01-01T10:05:00.000Z",
        }),
        makeLead("no-response", {
          firstContactedTime:
            "2026-01-01T10:05:00.000Z",
        }),
      ],
      events: [
        makeEvent("crm-only", {
          sourceEventId: "crm-only-workflow",
          rawType: "Task Completed",
          category: "workflow",
          channel: null,
          direction: null,
        }),
        makeEvent("responded", {
          sourceEventId: "responded-outbound",
        }),
        makeEvent("responded", {
          sourceEventId: "responded-inbound",
          occurredAt:
            "2026-01-01T10:07:00.000Z",
          rawType: "Text Received",
          actorType: "unknown",
          direction: "inbound",
        }),
        makeEvent("no-response", {
          sourceEventId: "no-response-outbound",
        }),
      ],
    };

    const result =
      buildDashboardAnalysis(dataset);

    const noResponseBucket =
      result.engagement.speed.find(
        (row) => row.key === "no_response",
      );

    expect(noResponseBucket?.contacted).toBe(1);
    expect(noResponseBucket?.responded).toBe(0);

    expect(
      result.engagement.responseEligible,
    ).toBe(2);
  });

  it("partitions current Sold/Closed leads by timeline coverage", () => {
    const dataset: AnalyticsDataset = {
      leads: [
        makeLead("sold-with-timeline", {
          stage: "Sold",
        }),
        makeLead("closed-without-timeline", {
          stage: "Closed",
          timelineRecordIds: [],
        }),
        makeLead("not-outcome", {
          stage: "Engage",
          timelineRecordIds: [],
          soldDate:
            "2026-01-02T10:00:00.000Z",
        }),
      ],
      events: [],
    };

    const result =
      buildDashboardAnalysis(dataset);

    expect(
      result.progression.soldClosed,
    ).toBe(2);

    expect(
      result.progression.soldClosedWithTimeline,
    ).toBe(1);

    expect(
      result.progression.soldClosedWithoutTimeline,
    ).toBe(1);
  });
});
