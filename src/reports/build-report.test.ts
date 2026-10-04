import {
  describe,
  expect,
  it,
} from "vitest";

import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";

import {
  DEFAULT_REPORT_DEFINITION,
  normalizeReportDefinition,
} from "./report-definition";
import { buildReport } from "./build-report";

function event(
  overrides: Partial<
    AnalyticsDataset["events"][number]
  > = {},
): AnalyticsDataset["events"][number] {
  return {
    timelineRecordId: "record-1",
    sourceEventId: "event-1",
    sourceFile: "lead.txt",
    occurredAt:
      "2026-09-10T10:00:00.000Z",
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

function lead(
  id: string,
  overrides: Partial<
    AnalyticsDataset["leads"][number]
  > = {},
): AnalyticsDataset["leads"][number] {
  return {
    leadId: id,
    contactName: id,
    source: "Source A",
    sourceGroup: "Paid",
    stage: "Engage",
    status: "Active",
    creationTime:
      "2026-09-10T09:00:00.000Z",
    soldDate: null,
    closedTime: null,
    timelineRecordIds: ["record-1"],
    ...overrides,
  };
}

function dataset(
  leads: AnalyticsDataset["leads"],
  events: AnalyticsDataset["events"],
): AnalyticsDataset {
  return { leads, events };
}

describe("report definition normalization", () => {
  it("provides stable defaults", () => {
    expect(
      normalizeReportDefinition({}),
    ).toEqual(
      DEFAULT_REPORT_DEFINITION,
    );
  });

  it("rejects reversed date ranges", () => {
    expect(() =>
      normalizeReportDefinition({
        dateRange: {
          basis: "lead_created",
          start: "2026-09-20",
          end: "2026-09-01",
        },
      }),
    ).toThrow(
      "Report start date cannot be after the end date.",
    );
  });
});

describe("buildReport", () => {
  it("groups leads by source and calculates selected metrics", () => {
    const result = buildReport(
      dataset(
        [
          lead("lead-1"),
          lead("lead-2", {
            source: "Source B",
            timelineRecordIds: [],
          }),
        ],
        [
          event({
            timelineRecordId: "record-1",
            sourceEventId: "outbound",
          }),
          event({
            timelineRecordId: "record-1",
            sourceEventId: "inbound",
            occurredAt:
              "2026-09-10T10:05:00.000Z",
            rawType: "Text Received",
            actorType: "unknown",
            direction: "inbound",
          }),
        ],
      ),
      normalizeReportDefinition({
        name: "Source report",
        groupBy: "source",
        metrics: [
          "leads",
          "contacted",
          "responded",
          "responseRate",
        ],
      }),
    );

    expect(result.populationCount).toBe(2);
    expect(result.rows).toEqual([
      {
        key: "Source A",
        label: "Source A",
        values: {
          leads: 1,
          contacted: 1,
          responded: 1,
          responseRate: 1,
        },
      },
      {
        key: "Source B",
        label: "Source B",
        values: {
          leads: 1,
          contacted: 0,
          responded: 0,
          responseRate: null,
        },
      },
    ]);
  });

  it("filters by lead creation date", () => {
    const result = buildReport(
      dataset(
        [
          lead("inside"),
          lead("outside", {
            creationTime:
              "2026-10-02T09:00:00.000Z",
          }),
        ],
        [],
      ),
      normalizeReportDefinition({
        dateRange: {
          basis: "lead_created",
          start: "2026-09-01",
          end: "2026-09-30",
        },
        groupBy: "none",
        metrics: ["leads"],
      }),
    );

    expect(result.populationCount).toBe(1);
    expect(
      result.rows[0]?.values.leads,
    ).toBe(1);
  });

  it("supports timeline-activity date basis", () => {
    const result = buildReport(
      dataset(
        [
          lead("active"),
          lead("inactive", {
            timelineRecordIds: [
              "record-2",
            ],
          }),
        ],
        [
          event({
            timelineRecordId: "record-1",
            occurredAt:
              "2026-09-15T10:00:00.000Z",
          }),
          event({
            timelineRecordId: "record-2",
            occurredAt:
              "2026-10-15T10:00:00.000Z",
          }),
        ],
      ),
      normalizeReportDefinition({
        dateRange: {
          basis: "timeline_activity",
          start: "2026-09-01",
          end: "2026-09-30",
        },
        groupBy: "none",
        metrics: ["leads"],
      }),
    );

    expect(result.populationCount).toBe(1);
  });

  it("calculates an overall summary independently of row grouping", () => {
    const result = buildReport(
      dataset(
        [
          lead("lead-1"),
          lead("lead-2", {
            source: "Source B",
          }),
        ],
        [
          event({
            timelineRecordId: "record-1",
            sourceEventId: "outbound-1",
          }),
          event({
            timelineRecordId: "record-1",
            sourceEventId: "inbound-1",
            occurredAt:
              "2026-09-10T10:05:00.000Z",
            rawType: "Text Received",
            actorType: "unknown",
            direction: "inbound",
          }),
        ],
      ),
      normalizeReportDefinition({
        groupBy: "source",
        metrics: [
          "leads",
          "contacted",
          "responded",
          "responseRate",
        ],
      }),
    );

    expect(result.summary).toEqual({
      leads: 2,
      contacted: 1,
      responded: 1,
      responseRate: 1,
    });
  });

  it("matches unknown-value filters consistently", () => {
    const result = buildReport(
      dataset(
        [
          lead("known"),
          lead("unknown", {
            source: "",
          }),
        ],
        [],
      ),
      normalizeReportDefinition({
        filters: {
          sources: ["Unknown"],
          sourceGroups: [],
          stages: [],
          statuses: [],
        },
        groupBy: "none",
        metrics: ["leads"],
      }),
    );

    expect(result.populationCount).toBe(1);
    expect(
      result.rows[0]?.values.leads,
    ).toBe(1);
  });

  it("supports outcome-date population", () => {
    const result = buildReport(
      dataset(
        [
          lead("sold", {
            soldDate:
              "2026-09-20T15:00:00.000Z",
            stage: "Sold",
          }),
          lead("unsold"),
        ],
        [],
      ),
      normalizeReportDefinition({
        dateRange: {
          basis: "outcome_date",
          start: "2026-09-01",
          end: "2026-09-30",
        },
        groupBy: "none",
        metrics: [
          "leads",
          "soldClosed",
        ],
      }),
    );

    expect(result.populationCount).toBe(1);
    expect(
      result.rows[0]?.values.soldClosed,
    ).toBe(1);
  });
});
