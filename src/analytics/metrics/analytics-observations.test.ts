import { describe, expect, it } from "vitest";

import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";
import {
  buildLeadObservations,
  responseSpeedBucket,
} from "./analytics-observations";

function dataset(
  events: AnalyticsDataset["events"],
  leadOverrides: Partial<AnalyticsDataset["leads"][number]> = {},
): AnalyticsDataset {
  return {
    leads: [
      {
        leadId: "lead-1",
        contactName: "Test Lead",
        source: "Test Source",
        sourceGroup: "",
        stage: "Engage",
        status: "active",
        creationTime: null,
        soldDate: null,
        closedTime: null,
        timelineRecordIds: ["record-1"],
        ...leadOverrides,
      },
    ],
    events,
  };
}

function event(
  overrides: Partial<AnalyticsDataset["events"][number]> = {},
): AnalyticsDataset["events"][number] {
  return {
    timelineRecordId: "record-1",
    sourceEventId: "event-1",
    sourceFile: "lead.txt",
    occurredAt: "2026-01-01T10:00:00.000Z",
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

describe("analytics observations", () => {
  it("uses the first outbound and first inbound event", () => {
    const result = buildLeadObservations(
      dataset([
        event({
          sourceEventId: "first",
        }),
        event({
          sourceEventId: "response",
          occurredAt:
            "2026-01-01T10:03:00.000Z",
          rawType: "Text Received",
          actorType: "unknown",
          direction: "inbound",
        }),
        event({
          sourceEventId: "later",
          occurredAt:
            "2026-01-01T10:30:00.000Z",
          rawType: "Text Received",
          actorType: "unknown",
          direction: "inbound",
        }),
      ]),
    )[0];

    expect(result.firstOutbound?.sourceEventId).toBe(
      "first",
    );
    expect(result.firstInbound?.sourceEventId).toBe(
      "response",
    );
    expect(result.responseMinutes).toBe(3);
  });

  it("does not count a deleted appointment paired with the same stage timestamp", () => {
    const result = buildLeadObservations(
      dataset([
        event(),
        event({
          sourceEventId: "appointment-stage",
          occurredAt:
            "2026-01-01T10:03:00.000Z",
          rawType: "Stage Changed",
          category: "lifecycle",
          actorType: "employee",
          channel: null,
          direction: null,
          details:
            "Stage got changed from Engage to Appt. Created",
        }),
        event({
          sourceEventId: "deleted",
          occurredAt:
            "2026-01-01T10:03:00.000Z",
          rawType: "Stage Changed",
          category: "lifecycle",
          actorType: "employee",
          channel: null,
          direction: null,
          details:
            "Stage got changed from Engage to Appt. Created\nThe appointment is deleted",
        }),
      ]),
    )[0];

    expect(result.appointmentEvidence).toBe(false);
  });

  it("keeps sold leads with missing timelines as unknown response evidence", () => {
    const result = buildLeadObservations(
      dataset([], {
        timelineRecordIds: [],
        stage: "Sold",
      }),
    )[0];

    expect(result.firstOutbound).toBeNull();
    expect(result.responseMinutes).toBeNull();
    expect(result.soldClosed).toBe(true);
  });

  it("uses lead-export First Contacted Time for contact status and speed", () => {
    const result = buildLeadObservations(
      dataset([], {
        creationTime:
          "2026-01-01T10:00:00.000Z",
        firstContactedTime:
          "2026-01-01T10:12:00.000Z",
        timelineRecordIds: [],
      }),
    )[0];

    expect(result.firstContactedTime).toBe(
      "2026-01-01T10:12:00.000Z",
    );
    expect(result.firstContactMinutes).toBe(12);
    expect(result.firstOutbound).toBeNull();
    expect(result.responseMinutes).toBeNull();
  });

  it("classifies mutually exclusive response-speed buckets", () => {
    expect(responseSpeedBucket(2)).toBe(
      "under_5m",
    );
    expect(responseSpeedBucket(10)).toBe(
      "5_to_15m",
    );
    expect(responseSpeedBucket(30)).toBe(
      "15_to_60m",
    );
    expect(responseSpeedBucket(180)).toBe(
      "1_to_4h",
    );
    expect(responseSpeedBucket(600)).toBe(
      "4_to_24h",
    );
    expect(responseSpeedBucket(2000)).toBe(
      "over_24h",
    );
    expect(responseSpeedBucket(null)).toBe(
      "no_response",
    );
  });
});
