import { describe, expect, it } from "vitest";

import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";
import { buildEngagementAnalysis } from "./engagement";

function event(
  leadId: string,
  overrides: Partial<AnalyticsDataset["events"][number]> = {},
): AnalyticsDataset["events"][number] {
  return {
    timelineRecordId: leadId,
    sourceEventId: `${leadId}-outbound`,
    sourceFile: `${leadId}.txt`,
    occurredAt: "2026-01-01T10:00:00.000Z",
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

describe("buildEngagementAnalysis", () => {
  it("compares valid appointment evidence against response speed", () => {
    const dataset: AnalyticsDataset = {
      leads: [
        {
          leadId: "lead-1",
          contactName: "Appointment",
          source: "Source",
          sourceGroup: "",
          stage: "Appt. Created",
          status: "active",
          creationTime: null,
          soldDate: null,
          closedTime: null,
          timelineRecordIds: ["lead-1"],
        },
      ],
      events: [
        event("lead-1"),
        event("lead-1", {
          sourceEventId: "appointment",
          occurredAt:
            "2026-01-01T10:03:00.000Z",
          rawType: "Stage Changed",
          category: "lifecycle",
          channel: null,
          direction: null,
          details:
            "Stage got changed from Engage to Appt. Created",
        }),
        event("lead-1", {
          sourceEventId: "response",
          occurredAt:
            "2026-01-01T10:04:00.000Z",
          rawType: "Text Received",
          actorType: "unknown",
          direction: "inbound",
        }),
      ],
    };

    const result =
      buildEngagementAnalysis(dataset);

    expect(result.contacted).toBe(1);
    expect(result.responded).toBe(1);
    expect(
      result.appointmentSpeed[0]?.numerator,
    ).toBe(1);
    expect(
      result.appointmentSpeed[0]?.denominator,
    ).toBe(1);
  });

  it("does not manufacture a sales response-speed denominator", () => {
    const dataset: AnalyticsDataset = {
      leads: [
        {
          leadId: "sold-1",
          contactName: "Sold",
          source: "Source",
          sourceGroup: "",
          stage: "Sold",
          status: "closed",
          creationTime: null,
          soldDate: "2026-01-02T10:00:00.000Z",
          closedTime: null,
          timelineRecordIds: [],
        },
      ],
      events: [],
    };

    const result =
      buildEngagementAnalysis(dataset);

    expect(
      result.soldClosedWithoutTimeline,
    ).toBe(1);
    expect(
      result.soldClosedWithTimeline,
    ).toBe(0);
    expect(
      result.soldClosedSpeed.every(
        (row) => row.denominator === 0,
      ),
    ).toBe(true);
  });
});
