import type { TaskWorkflowCoverageProfile } from "./task-workflow-coverage-profile";
import type { TaskWorkflowChannelProfile } from "./task-workflow-channel-profile";

export type TaskWorkflowReportRow = {
  taskTitle: string;

  taskCount: number;
  comparisonCount: number;

  directIdentityTaskCount: number;
  unresolvedIdentityTaskCount: number;
  noIdentityMatchTaskCount: number;

  directIdentityComparisonCount: number;
  unresolvedIdentityComparisonCount: number;
  noIdentityMatchComparisonCount: number;

  allowedChannelEventCount: number;
  mismatchedChannelEventCount: number;

  qualifyingOutboundComparisonCount: number;
  outboundChannelMismatchComparisonCount: number;
  inboundOnlyComparisonCount: number;
  noCommunicationEvidenceComparisonCount: number;

  uniqueQualifyingTaskCount: number;
  uniqueQualifyingEventCount: number;
};

export function buildTaskWorkflowReportRow(
  taskTitle: string,
  coverage: TaskWorkflowCoverageProfile,
  channels: TaskWorkflowChannelProfile,
): TaskWorkflowReportRow {
  return {
    taskTitle: taskTitle.trim(),

    taskCount: coverage.taskCount,
    comparisonCount: coverage.comparisonCount,

    directIdentityTaskCount:
      coverage.directIdentityTaskCount,
    unresolvedIdentityTaskCount:
      coverage.unresolvedIdentityTaskCount,
    noIdentityMatchTaskCount:
      coverage.noIdentityMatchTaskCount,

    directIdentityComparisonCount:
      coverage.directIdentityComparisonCount,
    unresolvedIdentityComparisonCount:
      coverage.unresolvedIdentityComparisonCount,
    noIdentityMatchComparisonCount:
      coverage.noIdentityMatchComparisonCount,

    allowedChannelEventCount:
      channels.allowedChannelEventCount,
    mismatchedChannelEventCount:
      channels.mismatchedChannelEventCount,

    qualifyingOutboundComparisonCount:
      channels.qualifyingOutboundComparisonCount,
    outboundChannelMismatchComparisonCount:
      channels.outboundChannelMismatchComparisonCount,
    inboundOnlyComparisonCount:
      channels.inboundOnlyComparisonCount,
    noCommunicationEvidenceComparisonCount:
      channels.noCommunicationEvidenceComparisonCount,

    uniqueQualifyingTaskCount:
      channels.uniqueQualifyingTaskCount,
    uniqueQualifyingEventCount:
      channels.uniqueQualifyingEventCount,
  };
}
