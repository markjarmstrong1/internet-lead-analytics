import { describe, expect, it } from "vitest";
import { buildTaskWorkflowReport } from "../../../../../src/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report";
import type { TaskWorkflowReportRow } from "../../../../../src/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report-row";

const row: TaskWorkflowReportRow = {
  taskTitle: "Immediate Follow Up",
  taskCount: 4,
  comparisonCount: 4,
  directIdentityTaskCount: 1,
  unresolvedIdentityTaskCount: 0,
  noIdentityMatchTaskCount: 3,
  directIdentityComparisonCount: 1,
  unresolvedIdentityComparisonCount: 0,
  noIdentityMatchComparisonCount: 3,
  allowedChannelEventCount: 2,
  mismatchedChannelEventCount: 0,
  qualifyingOutboundComparisonCount: 1,
  outboundChannelMismatchComparisonCount: 0,
  inboundOnlyComparisonCount: 0,
  noCommunicationEvidenceComparisonCount: 1,
  uniqueQualifyingTaskCount: 1,
  uniqueQualifyingEventCount: 2,
};

describe("buildTaskWorkflowReport", () => {
  it("keeps workflow rows and metrics together", () => {
    const report = buildTaskWorkflowReport([row]);

    expect(report.workflows).toHaveLength(1);
    expect(report.workflows[0].row.taskTitle).toBe(
      "Immediate Follow Up",
    );

    expect(
      report.workflows[0].metrics.find(
        (metric) => metric.key === "direct_identity_rate",
      ),
    ).toEqual({
      key: "direct_identity_rate",
      numerator: 1,
      denominator: 4,
      rate: 0.25,
    });
  });

  it("builds a separate aggregate summary", () => {
    const report = buildTaskWorkflowReport([row]);

    expect(report.summary.comparisonCount).toBe(4);

    const qualifying =
      report.summary.metrics.find(
        (metric) =>
          metric.key ===
          "qualifying_outbound_evidence_rate",
      );

    expect(qualifying?.numerator).toBe(1);
    expect(qualifying?.denominator).toBe(2);
  });
});
