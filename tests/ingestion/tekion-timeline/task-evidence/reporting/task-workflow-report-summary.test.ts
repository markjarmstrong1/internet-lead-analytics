import { describe, expect, it } from "vitest";
import { buildTaskWorkflowReportSummary } from "../../../../../src/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report-summary";
import type { TaskWorkflowReportRow } from "../../../../../src/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report-row";

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
    taskCount: 1,
    comparisonCount,
    directIdentityTaskCount: 0,
    unresolvedIdentityTaskCount: 0,
    noIdentityMatchTaskCount: 1,
    directIdentityComparisonCount: direct,
    unresolvedIdentityComparisonCount: unresolved,
    noIdentityMatchComparisonCount:
      comparisonCount - direct - unresolved,
    allowedChannelEventCount: allowedEvents,
    mismatchedChannelEventCount: mismatchedEvents,
    qualifyingOutboundComparisonCount: qualifying,
    outboundChannelMismatchComparisonCount: mismatch,
    inboundOnlyComparisonCount: inbound,
    noCommunicationEvidenceComparisonCount: noEvidence,
    uniqueQualifyingTaskCount: 0,
    uniqueQualifyingEventCount: 0,
  };
}

describe("buildTaskWorkflowReportSummary", () => {
  it("aggregates numerators and denominators across workflows", () => {
    const summary = buildTaskWorkflowReportSummary([
      row("A", 10, 2, 1, 2, 1, 0, 1, 3, 1),
      row("B", 5, 1, 0, 1, 1, 0, 1, 2, 1),
    ]);

    expect(summary.comparisonCount).toBe(15);

    expect(summary.metrics.find(
      (metric) => metric.key === "direct_identity_rate",
    )).toEqual({
      key: "direct_identity_rate",
      numerator: 3,
      denominator: 15,
      rate: 0.2,
    });

    expect(summary.metrics.find(
      (metric) =>
        metric.key === "qualifying_outbound_evidence_rate",
    )).toEqual({
      key: "qualifying_outbound_evidence_rate",
      numerator: 3,
      denominator: 6,
      rate: 0.5,
    });
  });

  it("does not add workflow task counts into comparison denominators", () => {
    const summary = buildTaskWorkflowReportSummary([
      row("A", 10, 2, 0, 1, 0, 0, 1, 2, 0),
      row("B", 20, 3, 0, 2, 0, 0, 2, 4, 0),
    ]);

    const direct = summary.metrics.find(
      (metric) => metric.key === "direct_identity_rate",
    );

    expect(direct?.denominator).toBe(30);
    expect(direct?.denominator).not.toBe(2);
  });
});
