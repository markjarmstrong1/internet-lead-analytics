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
    firstContactedTime: null,
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

  it("defaults evidence filters to any", () => {
    expect(
      normalizeReportDefinition({}).filters.evidence,
    ).toEqual({
      outbound: "any",
      response: "any",
      appointment: "any",
      outcome: "any",
      responseWithin24h: "any",
    });
  });

  it("normalizes evidence filters from a report definition", () => {
    expect(
      normalizeReportDefinition({
        filters: {
          evidence: {
            outbound: "observed",
            response: "not_observed",
            appointment: "observed",
            outcome: "any",
            responseWithin24h: "yes",
          },
        },
      }).filters.evidence,
    ).toEqual({
      outbound: "observed",
      response: "not_observed",
      appointment: "observed",
      outcome: "any",
      responseWithin24h: "yes",
    });
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

  it("keeps CRM contacted and observed outbound as distinct metrics", () => {
    const result = buildReport(
      dataset(
        [
          lead("contacted", {
            firstContactedTime:
              "2026-09-10T09:30:00.000Z",
          }),
          lead("outbound-only", {
            leadId: "outbound-only",
            firstContactedTime: null,
            timelineRecordIds: ["record-2"],
          }),
        ],
        [
          event({
            timelineRecordId: "record-1",
            sourceEventId: "outbound-1",
            occurredAt:
              "2026-09-10T10:00:00.000Z",
            actorType: "employee",
            direction: "outbound",
          }),
          event({
            timelineRecordId: "record-2",
            sourceEventId: "outbound-2",
            occurredAt:
              "2026-09-10T10:01:00.000Z",
            actorType: "employee",
            direction: "outbound",
          }),
        ],
      ),
      normalizeReportDefinition({
        metrics: ["contacted", "observedOutbound"],
      }),
    );

    expect(result.summary).toEqual({
      contacted: 1,
      observedOutbound: 2,
    });
  });


  it("filters population by observed outbound evidence", () => {
    const result = buildReport(
      dataset(
        [
          lead("outbound"),
          lead("no-outbound", {
            timelineRecordIds: [],
          }),
        ],
        [
          event({
            timelineRecordId: "record-1",
            sourceEventId: "outbound",
          }),
        ],
      ),
      normalizeReportDefinition({
        filters: {
          evidence: {
            outbound: "observed",
          },
        },
        groupBy: "none",
        metrics: ["leads"],
      }),
    );

    expect(result.populationCount).toBe(1);
    expect(result.rows[0]?.values.leads).toBe(1);
  });

  it("filters population by not-observed response evidence", () => {
    const result = buildReport(
      dataset(
        [
          lead("responded"),
          lead("no-response", {
            leadId: "no-response",
            timelineRecordIds: ["record-2"],
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
          event({
            timelineRecordId: "record-2",
            sourceEventId: "outbound-2",
          }),
        ],
      ),
      normalizeReportDefinition({
        filters: {
          evidence: {
            response: "not_observed",
          },
        },
        groupBy: "none",
        metrics: ["leads"],
      }),
    );

    expect(result.populationCount).toBe(1);
    expect(result.rows[0]?.values.leads).toBe(1);
  });

  it("filters population by observed CRM outcome evidence", () => {
    const result = buildReport(
      dataset(
        [
          lead("sold", {
            stage: "Sold",
          }),
          lead("active"),
        ],
        [],
      ),
      normalizeReportDefinition({
        filters: {
          evidence: {
            outcome: "observed",
          },
        },
        groupBy: "none",
        metrics: ["leads"],
      }),
    );

    expect(result.populationCount).toBe(1);
    expect(result.rows[0]?.values.leads).toBe(1);
  });

  it("groups leads by source and calculates selected metrics", () => {
    const result = buildReport(
      dataset(
        [
          lead("lead-1", {
            firstContactedTime:
              "2026-09-10T09:30:00.000Z",
          }),
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

  it("returns a null response rate when no outbound evidence exists", () => {
    const result = buildReport(
      dataset(
        [lead("no-outbound")],
        [],
      ),
      normalizeReportDefinition({
        groupBy: "none",
        metrics: ["responseRate", "responseWithin24hRate"],
      }),
    );

    expect(result.summary).toEqual({
      responseRate: null,
      responseWithin24hRate: null,
    });
  });

  it("returns zero response rates when outbound evidence exists without a response", () => {
    const result = buildReport(
      dataset(
        [lead("no-response")],
        [event({ sourceEventId: "outbound" })],
      ),
      normalizeReportDefinition({
        groupBy: "none",
        metrics: ["responseRate", "responseWithin24hRate"],
      }),
    );

    expect(result.summary).toEqual({
      responseRate: 0,
      responseWithin24hRate: 0,
    });
  });

  it("uses observed outbound leads as the denominator for response rates", () => {
    const result = buildReport(
      dataset(
        [
          lead("responded"),
          lead("no-response", {
            leadId: "no-response",
            timelineRecordIds: ["record-2"],
          }),
          lead("never-contacted", {
            leadId: "never-contacted",
            timelineRecordIds: [],
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
          event({
            timelineRecordId: "record-2",
            sourceEventId: "outbound-2",
          }),
        ],
      ),
      normalizeReportDefinition({
        groupBy: "none",
        metrics: [
          "leads",
          "observedOutbound",
          "responded",
          "responseRate",
          "responseWithin24hRate",
        ],
      }),
    );

    expect(result.summary).toEqual({
      leads: 3,
      observedOutbound: 2,
      responded: 1,
      responseRate: 0.5,
      responseWithin24hRate: 0.5,
    });
  });

  it("groups response speed using observed response evidence", () => {
    const result = buildReport(
      dataset(
        [
          lead("fast"),
          lead("medium", {
            leadId: "medium",
            timelineRecordIds: ["record-2"],
          }),
          lead("no-response", {
            leadId: "no-response",
            timelineRecordIds: ["record-3"],
          }),
          lead("not-exposed", {
            leadId: "not-exposed",
            timelineRecordIds: [],
          }),
        ],
        [
          event({
            timelineRecordId: "record-1",
            sourceEventId: "fast-outbound",
          }),
          event({
            timelineRecordId: "record-1",
            sourceEventId: "fast-inbound",
            occurredAt:
              "2026-09-10T10:04:00.000Z",
            rawType: "Text Received",
            actorType: "unknown",
            direction: "inbound",
          }),
          event({
            timelineRecordId: "record-2",
            sourceEventId: "medium-outbound",
          }),
          event({
            timelineRecordId: "record-2",
            sourceEventId: "medium-inbound",
            occurredAt:
              "2026-09-10T11:00:00.000Z",
            rawType: "Text Received",
            actorType: "unknown",
            direction: "inbound",
          }),
          event({
            timelineRecordId: "record-3",
            sourceEventId: "no-response-outbound",
          }),
        ],
      ),
      normalizeReportDefinition({
        groupBy: "responseSpeed",
        metrics: ["leads"],
      }),
    );

    expect(result.rows).toEqual([
      {
        key: "< 5 minutes",
        label: "< 5 minutes",
        values: { leads: 1 },
      },
      {
        key: "15–60 minutes",
        label: "15–60 minutes",
        values: { leads: 1 },
      },
      {
        key: "No observed response",
        label: "No observed response",
        values: { leads: 2 },
      },
    ]);
  });

  it("preserves response-speed bucket boundaries", () => {
    const result = buildReport(
      dataset(
        [
          lead("five"),
          lead("fifteen", {
            leadId: "fifteen",
            timelineRecordIds: ["record-2"],
          }),
          lead("sixty", {
            leadId: "sixty",
            timelineRecordIds: ["record-3"],
          }),
          lead("four-hours", {
            leadId: "four-hours",
            timelineRecordIds: ["record-4"],
          }),
          lead("twenty-four-hours", {
            leadId: "twenty-four-hours",
            timelineRecordIds: ["record-5"],
          }),
        ],
        [
          event({
            timelineRecordId: "record-1",
            sourceEventId: "five-outbound",
          }),
          event({
            timelineRecordId: "record-1",
            sourceEventId: "five-inbound",
            occurredAt:
              "2026-09-10T10:05:00.000Z",
            rawType: "Text Received",
            actorType: "unknown",
            direction: "inbound",
          }),
          event({
            timelineRecordId: "record-2",
            sourceEventId: "fifteen-outbound",
          }),
          event({
            timelineRecordId: "record-2",
            sourceEventId: "fifteen-inbound",
            occurredAt:
              "2026-09-10T10:15:00.000Z",
            rawType: "Text Received",
            actorType: "unknown",
            direction: "inbound",
          }),
          event({
            timelineRecordId: "record-3",
            sourceEventId: "sixty-outbound",
          }),
          event({
            timelineRecordId: "record-3",
            sourceEventId: "sixty-inbound",
            occurredAt:
              "2026-09-10T11:00:00.000Z",
            rawType: "Text Received",
            actorType: "unknown",
            direction: "inbound",
          }),
          event({
            timelineRecordId: "record-4",
            sourceEventId: "four-hours-outbound",
          }),
          event({
            timelineRecordId: "record-4",
            sourceEventId: "four-hours-inbound",
            occurredAt:
              "2026-09-10T14:00:00.000Z",
            rawType: "Text Received",
            actorType: "unknown",
            direction: "inbound",
          }),
          event({
            timelineRecordId: "record-5",
            sourceEventId: "twenty-four-hours-outbound",
          }),
          event({
            timelineRecordId: "record-5",
            sourceEventId: "twenty-four-hours-inbound",
            occurredAt:
              "2026-09-11T10:00:00.000Z",
            rawType: "Text Received",
            actorType: "unknown",
            direction: "inbound",
          }),
        ],
      ),
      normalizeReportDefinition({
        groupBy: "responseSpeed",
        metrics: ["leads"],
      }),
    );

    expect(
      Object.fromEntries(
        result.rows.map((row) => [
          row.key,
          row.values.leads,
        ]),
      ),
    ).toEqual({
      "5–15 minutes": 2,
      "15–60 minutes": 1,
      "1–4 hours": 1,
      "4–24 hours": 1,
    });
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
          lead("lead-1", {
            firstContactedTime:
              "2026-09-10T09:30:00.000Z",
          }),
          lead("lead-2", {
            source: "Source B",
            timelineRecordIds: [],
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
