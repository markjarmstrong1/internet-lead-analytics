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

function expectPopulationIntegrity(
  result: ReturnType<typeof buildReport>,
) {
  expect(
    new Set(result.leadIds).size,
  ).toBe(result.leadIds.length);

  expect(result.leadIds).toHaveLength(
    result.populationCount,
  );

  const groupedLeadIds =
    result.rows.flatMap(
      (row) => row.leadIds,
    );

  expect(
    new Set(groupedLeadIds).size,
  ).toBe(groupedLeadIds.length);

  expect(
    new Set(groupedLeadIds),
  ).toEqual(new Set(result.leadIds));
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
        leadIds: ["lead-1"],
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
        leadIds: ["lead-2"],
        values: {
          leads: 1,
          contacted: 0,
          responded: 0,
          responseRate: null,
        },
      },
    ]);
  });

  it("calculates response rates against all leads with observed outbound, including non-responders", () => {
    const result = buildReport(
      dataset(
        [
          lead("responded", {
            timelineRecordIds: ["record-responded"],
          }),
          lead("no-response", {
            timelineRecordIds: ["record-no-response"],
          }),
          lead("no-outbound", {
            timelineRecordIds: [],
          }),
        ],
        [
          event({
            timelineRecordId: "record-responded",
            sourceEventId: "outbound-responded",
            occurredAt: "2026-09-10T10:00:00.000Z",
          }),
          event({
            timelineRecordId: "record-responded",
            sourceEventId: "inbound-responded",
            occurredAt: "2026-09-10T10:05:00.000Z",
            rawType: "Text Received",
            actorType: "unknown",
            direction: "inbound",
          }),
          event({
            timelineRecordId: "record-no-response",
            sourceEventId: "outbound-no-response",
            occurredAt: "2026-09-10T10:00:00.000Z",
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
        metrics: [
          "leads",
          "observedOutbound",
          "responded",
          "responseRate",
          "responseWithin24hRate",
          "medianResponseMinutes",
        ],
      }),
    );

    expect(result.populationCount).toBe(2);
    expect(result.summary).toMatchObject({
      leads: 2,
      observedOutbound: 2,
      responded: 1,
      responseRate: 0.5,
      responseWithin24hRate: 0.5,
      medianResponseMinutes: 5,
    });
    expect(result.leadIds).toEqual([
      "responded",
      "no-response",
    ]);
  });

  it("keeps response-rate comparison denominators when evidence filters narrow the lead list", () => {
    const result = buildReport(
      dataset(
        [
          lead("responded", {
            timelineRecordIds: ["record-responded"],
          }),
          lead("no-response", {
            timelineRecordIds: ["record-no-response"],
          }),
          lead("no-outbound", {
            timelineRecordIds: [],
          }),
        ],
        [
          event({
            timelineRecordId: "record-responded",
            sourceEventId: "outbound-responded",
            occurredAt: "2026-09-10T10:00:00.000Z",
          }),
          event({
            timelineRecordId: "record-responded",
            sourceEventId: "inbound-responded",
            occurredAt: "2026-09-10T10:05:00.000Z",
            rawType: "Text Received",
            actorType: "unknown",
            direction: "inbound",
          }),
          event({
            timelineRecordId: "record-no-response",
            sourceEventId: "outbound-no-response",
            occurredAt: "2026-09-10T10:00:00.000Z",
          }),
        ],
      ),
      normalizeReportDefinition({
        filters: {
          evidence: {
            response: "observed",
          },
        },
        groupBy: "none",
        metrics: [
          "leads",
          "observedOutbound",
          "responded",
          "responseRate",
        ],
      }),
    );

    expect(result.populationCount).toBe(1);
    expect(result.leadIds).toEqual(["responded"]);
    expect(result.summary).toMatchObject({
      leads: 1,
      observedOutbound: 1,
      responded: 1,
      responseRate: 0.5,
    });
  });

  it("preserves exact lead population IDs for an overall report", () => {
    const result = buildReport(
      dataset(
        [
          lead("included-1"),
          lead("included-2", {
            source: "Source B",
          }),
          lead("excluded", {
            source: "Source C",
          }),
        ],
        [],
      ),
      normalizeReportDefinition({
        filters: {
          sources: ["Source A", "Source B"],
        },
        groupBy: "none",
        metrics: ["leads"],
      }),
    );

    expect(result.leadIds).toEqual([
      "included-1",
      "included-2",
    ]);

    expectPopulationIntegrity(result);
  });

  it("preserves exact lead population IDs across grouped rows", () => {
    const result = buildReport(
      dataset(
        [
          lead("source-a-1"),
          lead("source-a-2"),
          lead("source-b-1", {
            source: "Source B",
          }),
          lead("excluded", {
            source: "Source C",
          }),
        ],
        [],
      ),
      normalizeReportDefinition({
        filters: {
          sources: ["Source A", "Source B"],
        },
        groupBy: "source",
        metrics: ["leads"],
      }),
    );

    expect(result.leadIds).toEqual([
      "source-a-1",
      "source-a-2",
      "source-b-1",
    ]);

    expect(
      result.rows.map((row) => ({
        key: row.key,
        leadIds: row.leadIds,
      })),
    ).toEqual([
      {
        key: "Source A",
        leadIds: [
          "source-a-1",
          "source-a-2",
        ],
      },
      {
        key: "Source B",
        leadIds: ["source-b-1"],
      },
    ]);

    expectPopulationIntegrity(result);
  });

  it("preserves population integrity for evidence-filtered reports", () => {
    const result = buildReport(
      dataset(
        [
          lead("responded"),
          lead("no-response", {
            timelineRecordIds: ["record-2"],
          }),
          lead("not-exposed", {
            timelineRecordIds: [],
          }),
        ],
        [
          event({
            timelineRecordId: "record-1",
            sourceEventId: "responded-outbound",
          }),
          event({
            timelineRecordId: "record-1",
            sourceEventId: "responded-inbound",
            occurredAt:
              "2026-09-10T10:05:00.000Z",
            rawType: "Text Received",
            actorType: "unknown",
            direction: "inbound",
          }),
          event({
            timelineRecordId: "record-2",
            sourceEventId: "no-response-outbound",
          }),
        ],
      ),
      normalizeReportDefinition({
        filters: {
          evidence: {
            response: "not_observed",
          },
        },
        groupBy: "responseSpeed",
        metrics: ["leads"],
      }),
    );

    expect(result.leadIds).toEqual([
      "no-response",
    ]);

    expectPopulationIntegrity(result);
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
        leadIds: ["fast"],
        values: { leads: 1 },
      },
      {
        key: "15–60 minutes",
        label: "15–60 minutes",
        leadIds: ["medium"],
        values: { leads: 1 },
      },
      {
        key: "Insufficient evidence",
        label: "Insufficient evidence",
        leadIds: ["not-exposed"],
        values: { leads: 1 },
      },
      {
        key: "No observed response",
        label: "No observed response",
        leadIds: ["no-response"],
        values: { leads: 1 },
      },
    ]);
  });

  it("does not calculate response rates within outcome-defined response-speed groups", () => {
    const result = buildReport(
      dataset(
        [
          lead("responded", {
            timelineRecordIds: ["record-responded"],
          }),
          lead("no-response", {
            timelineRecordIds: ["record-no-response"],
          }),
        ],
        [
          event({
            timelineRecordId: "record-responded",
            sourceEventId: "outbound-responded",
            occurredAt: "2026-09-10T10:00:00.000Z",
          }),
          event({
            timelineRecordId: "record-responded",
            sourceEventId: "inbound-responded",
            occurredAt: "2026-09-10T10:05:00.000Z",
            rawType: "Text Received",
            actorType: "unknown",
            direction: "inbound",
          }),
          event({
            timelineRecordId: "record-no-response",
            sourceEventId: "outbound-no-response",
            occurredAt: "2026-09-10T10:00:00.000Z",
          }),
        ],
      ),
      normalizeReportDefinition({
        filters: {
          evidence: {
            response: "observed",
          },
        },
        groupBy: "responseSpeed",
        metrics: [
          "leads",
          "responseRate",
          "responseWithin24hRate",
        ],
      }),
    );

    expect(result.populationCount).toBe(1);
    expect(result.summary.responseRate).toBe(0.5);
    expect(result.summary.responseWithin24hRate).toBe(0.5);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.values.responseRate).toBeNull();
    expect(result.rows[0]?.values.responseWithin24hRate).toBeNull();
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

  it("filters by canonical matched template and counts template uses", () => {
    const result = buildReport(
      dataset(
        [
          lead("template-a"),
          lead("template-b", {
            leadId: "template-b",
            timelineRecordIds: ["record-2"],
          }),
          lead("unmatched", {
            leadId: "unmatched",
            timelineRecordIds: ["record-3"],
          }),
        ],
        [
          event({
            timelineRecordId: "record-1",
            sourceEventId: "template-a-outbound-1",
            templateCode: "TEMPLATE_A",
          }),
          event({
            timelineRecordId: "record-1",
            sourceEventId: "template-a-outbound-2",
            occurredAt: "2026-09-10T10:05:00.000Z",
            templateCode: "TEMPLATE_A",
          }),
          event({
            timelineRecordId: "record-2",
            sourceEventId: "template-b-outbound",
            templateCode: "TEMPLATE_B",
          }),
          event({
            timelineRecordId: "record-3",
            sourceEventId: "unmatched-outbound",
          }),
        ],
      ),
      normalizeReportDefinition({
        filters: {
          templates: ["TEMPLATE_A"],
        },
        groupBy: "template",
        metrics: [
          "leads",
          "templateUses",
          "templateUsesPerLead",
        ],
      }),
    );

    expect(result.populationCount).toBe(1);
    expect(result.leadIds).toEqual(["template-a"]);
    expect(result.summary).toEqual({
      leads: 1,
      templateUses: 2,
      templateUsesPerLead: 2,
    });
    expect(result.rows).toEqual([
      {
        key: "TEMPLATE_A",
        label: "TEMPLATE_A",
        leadIds: ["template-a"],
        values: {
          leads: 1,
          templateUses: 2,
          templateUsesPerLead: 2,
        },
      },
    ]);
  });

  it("does not treat inferred template text as canonical matched-template evidence", () => {
    const result = buildReport(
      dataset(
        [
          lead("inferred"),
          lead("matched", {
            leadId: "matched",
            timelineRecordIds: ["record-2"],
          }),
        ],
        [
          event({
            timelineRecordId: "record-1",
            sourceEventId: "inferred-outbound",
            metadata: {
              templateName: "TEMPLATE_A",
            },
          }),
          event({
            timelineRecordId: "record-2",
            sourceEventId: "matched-outbound",
            templateCode: "TEMPLATE_A",
          }),
        ],
      ),
      normalizeReportDefinition({
        filters: {
          templates: ["TEMPLATE_A"],
        },
        groupBy: "none",
        metrics: ["leads", "templateUses"],
      }),
    );

    expect(result.populationCount).toBe(1);
    expect(result.leadIds).toEqual(["matched"]);
    expect(result.summary).toEqual({
      leads: 1,
      templateUses: 1,
    });
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
