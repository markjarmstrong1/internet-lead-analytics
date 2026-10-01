import type { TekionReportMetric } from "./task-workflow-report-metrics";
import { calculateTaskWorkflowReportMetrics } from "./task-workflow-report-metrics";
import type { TaskWorkflowReportRow } from "./task-workflow-report-row";

export type TaskWorkflowReportSummary = {
  comparisonCount: number;
  metrics: TekionReportMetric[];
};

export function buildTaskWorkflowReportSummary(
  rows: TaskWorkflowReportRow[],
): TaskWorkflowReportSummary {
  const aggregate: TaskWorkflowReportRow = {
    taskTitle: "__ALL_WORKFLOWS__",
    taskCount: rows.reduce(
      (total, row) => total + row.taskCount,
      0,
    ),
    comparisonCount: rows.reduce(
      (total, row) => total + row.comparisonCount,
      0,
    ),
    directIdentityTaskCount: 0,
    unresolvedIdentityTaskCount: 0,
    noIdentityMatchTaskCount: 0,
    directIdentityComparisonCount: rows.reduce(
      (total, row) =>
        total + row.directIdentityComparisonCount,
      0,
    ),
    unresolvedIdentityComparisonCount: rows.reduce(
      (total, row) =>
        total + row.unresolvedIdentityComparisonCount,
      0,
    ),
    noIdentityMatchComparisonCount: rows.reduce(
      (total, row) =>
        total + row.noIdentityMatchComparisonCount,
      0,
    ),
    allowedChannelEventCount: rows.reduce(
      (total, row) =>
        total + row.allowedChannelEventCount,
      0,
    ),
    mismatchedChannelEventCount: rows.reduce(
      (total, row) =>
        total + row.mismatchedChannelEventCount,
      0,
    ),
    qualifyingOutboundComparisonCount: rows.reduce(
      (total, row) =>
        total + row.qualifyingOutboundComparisonCount,
      0,
    ),
    outboundChannelMismatchComparisonCount: rows.reduce(
      (total, row) =>
        total + row.outboundChannelMismatchComparisonCount,
      0,
    ),
    inboundOnlyComparisonCount: rows.reduce(
      (total, row) =>
        total + row.inboundOnlyComparisonCount,
      0,
    ),
    noCommunicationEvidenceComparisonCount: rows.reduce(
      (total, row) =>
        total + row.noCommunicationEvidenceComparisonCount,
      0,
    ),
    uniqueQualifyingTaskCount: 0,
    uniqueQualifyingEventCount: 0,
  };

  return {
    comparisonCount: aggregate.comparisonCount,
    metrics: calculateTaskWorkflowReportMetrics(aggregate),
  };
}
