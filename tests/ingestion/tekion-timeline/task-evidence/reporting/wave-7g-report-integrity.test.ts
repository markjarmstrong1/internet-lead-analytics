import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildTaskWorkflowReport,
} from "../../../../../src/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report";

import type {
  TaskWorkflowReportRow,
} from "../../../../../src/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report-row";

function row(
  title: string,
  comparisonCount: number,
  direct: number,
  unresolved: number,
  qualifying: number,
  mismatch: number,
  inbound: number,
  noEvidence: number,
  allowedEvents: number,
  mismatchedEvents: number,
): TaskWorkflowReportRow {
  return {
    taskTitle: title,
    taskCount: 2,
    comparisonCount,

    directIdentityTaskCount: 1,
    unresolvedIdentityTaskCount: 0,
    noIdentityMatchTaskCount: 1,

    directIdentityComparisonCount: direct,
    unresolvedIdentityComparisonCount:
      unresolved,
    noIdentityMatchComparisonCount:
      comparisonCount -
      direct -
      unresolved,

    allowedChannelEventCount:
      allowedEvents,
    mismatchedChannelEventCount:
      mismatchedEvents,

    qualifyingOutboundComparisonCount:
      qualifying,
    outboundChannelMismatchComparisonCount:
      mismatch,
    inboundOnlyComparisonCount:
      inbound,
    noCommunicationEvidenceComparisonCount:
      noEvidence,

    uniqueQualifyingTaskCount:
      qualifying > 0 ? 1 : 0,
    uniqueQualifyingEventCount:
      allowedEvents,
  };
}

describe(
  "Wave 7G report integrity",
  () => {
    it("reconciles workflow rows into the aggregate summary", () => {
      const rows = [
        row(
          "A",
          10,
          2,
          1,
          2,
          1,
          0,
          1,
          3,
          1,
        ),
        row(
          "B",
          5,
          1,
          0,
          1,
          1,
          0,
          1,
          2,
          1,
        ),
      ];

      const report =
        buildTaskWorkflowReport(rows);

      expect(
        report.workflows.map(
          (item) => item.row.taskTitle,
        ),
      ).toEqual(["A", "B"]);

      expect(
        report.summary.comparisonCount,
      ).toBe(
        rows.reduce(
          (total, item) =>
            total + item.comparisonCount,
          0,
        ),
      );

      expect(
        report.summary.metrics.find(
          (metric) =>
            metric.key ===
            "direct_identity_rate",
        ),
      ).toEqual({
        key: "direct_identity_rate",
        numerator: 3,
        denominator: 15,
        rate: 3 / 15,
      });

      expect(
        report.summary.metrics.find(
          (metric) =>
            metric.key ===
            "qualifying_outbound_evidence_rate",
        ),
      ).toEqual({
        key:
          "qualifying_outbound_evidence_rate",
        numerator: 3,
        denominator: 7,
        rate: 3 / 7,
      });
    });

    it("keeps metric denominators internally consistent", () => {
      const report =
        buildTaskWorkflowReport([
          row(
            "A",
            8,
            2,
            1,
            2,
            1,
            0,
            1,
            3,
            1,
          ),
        ]);

      const metric = (
        key: string,
      ) =>
        report.summary.metrics.find(
          (item) => item.key === key,
        );

      const identity =
        metric("identity_evidence_coverage");

      expect(identity?.denominator).toBe(8);
      expect(identity?.numerator).toBe(3);

      const communication =
        metric(
          "qualifying_outbound_evidence_rate",
        );

      expect(
        communication?.denominator,
      ).toBe(4);

      const eventShare =
        metric(
          "allowed_channel_event_share",
        );

      expect(
        eventShare?.denominator,
      ).toBe(4);
    });

    it("returns undefined rates when a denominator is zero", () => {
      const report =
        buildTaskWorkflowReport([
          row(
            "No Communication",
            4,
            1,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
          ),
        ]);

      const metric =
        report.summary.metrics.find(
          (item) =>
            item.key ===
            "qualifying_outbound_evidence_rate",
        );

      expect(metric?.numerator).toBe(0);
      expect(metric?.denominator).toBe(0);
      expect(metric?.rate).toBeUndefined();
    });

    it("keeps report generation deterministic", () => {
      const rows = [
        row(
          "B",
          5,
          1,
          0,
          1,
          0,
          0,
          1,
          2,
          0,
        ),
        row(
          "A",
          10,
          2,
          1,
          2,
          1,
          0,
          1,
          3,
          1,
        ),
      ];

      const first =
        buildTaskWorkflowReport(rows);

      const second =
        buildTaskWorkflowReport(rows);

      expect(first).toEqual(second);
    });
  },
);
