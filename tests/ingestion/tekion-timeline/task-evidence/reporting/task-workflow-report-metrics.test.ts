import { describe, expect, it } from "vitest";
import { calculateTaskWorkflowReportMetrics } from "../../../../../src/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report-metrics";
import type { TaskWorkflowReportRow } from "../../../../../src/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report-row";

const row: TaskWorkflowReportRow = {
  taskTitle: "Example Workflow",
  taskCount: 10,
  comparisonCount: 20,
  directIdentityTaskCount: 8,
  unresolvedIdentityTaskCount: 2,
  noIdentityMatchTaskCount: 5,
  directIdentityComparisonCount: 12,
  unresolvedIdentityComparisonCount: 3,
  noIdentityMatchComparisonCount: 5,
  allowedChannelEventCount: 7,
  mismatchedChannelEventCount: 3,
  qualifyingOutboundComparisonCount: 4,
  outboundChannelMismatchComparisonCount: 2,
  inboundOnlyComparisonCount: 1,
  noCommunicationEvidenceComparisonCount: 3,
  uniqueQualifyingTaskCount: 4,
  uniqueQualifyingEventCount: 7,
};

describe("calculateTaskWorkflowReportMetrics", () => {
  it("preserves explicit numerators and denominators", () => {
    const metrics = calculateTaskWorkflowReportMetrics(row);

    expect(metrics.find(
      (metric) => metric.key === "direct_identity_rate",
    )).toEqual({
      key: "direct_identity_rate",
      numerator: 12,
      denominator: 20,
      rate: 0.6,
    });

    expect(metrics.find(
      (metric) => metric.key === "qualifying_outbound_evidence_rate",
    )).toEqual({
      key: "qualifying_outbound_evidence_rate",
      numerator: 4,
      denominator: 10,
      rate: 0.4,
    });
  });

  it("uses undefined when a metric has no valid denominator", () => {
    const emptyRow: TaskWorkflowReportRow = {
      ...row,
      comparisonCount: 0,
      qualifyingOutboundComparisonCount: 0,
      outboundChannelMismatchComparisonCount: 0,
      inboundOnlyComparisonCount: 0,
      noCommunicationEvidenceComparisonCount: 0,
      allowedChannelEventCount: 0,
      mismatchedChannelEventCount: 0,
    };

    const metrics = calculateTaskWorkflowReportMetrics(emptyRow);

    for (const metric of metrics) {
      expect(metric.rate).toBeUndefined();
    }
  });

  it("does not mix communication and identity denominators", () => {
    const metrics = calculateTaskWorkflowReportMetrics(row);

    const identityMetric = metrics.find(
      (metric) => metric.key === "direct_identity_rate",
    );
    const communicationMetric = metrics.find(
      (metric) => metric.key === "qualifying_outbound_evidence_rate",
    );

    expect(identityMetric?.denominator).toBe(20);
    expect(communicationMetric?.denominator).toBe(10);
  });
});
