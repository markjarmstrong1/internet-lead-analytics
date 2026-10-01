import type { TaskCompletionEvidence } from "../task-completion-evidence";

export type TaskWorkflowChannelProfile = {
  allowedChannelEventCount: number;
  mismatchedChannelEventCount: number;

  qualifyingOutboundComparisonCount: number;
  outboundChannelMismatchComparisonCount: number;
  inboundOnlyComparisonCount: number;
  noCommunicationEvidenceComparisonCount: number;

  uniqueQualifyingTaskCount: number;
  uniqueQualifyingEventCount: number;
};

export function buildTaskWorkflowChannelProfile(
  inputs: Array<{
    taskId: string;
    evidence: TaskCompletionEvidence;
  }>,
): TaskWorkflowChannelProfile {
  const qualifyingTaskIds = new Set<string>();
  const qualifyingEventIds = new Set<string>();

  let allowedChannelEventCount = 0;
  let mismatchedChannelEventCount = 0;
  let qualifyingOutboundComparisonCount = 0;
  let outboundChannelMismatchComparisonCount = 0;
  let inboundOnlyComparisonCount = 0;
  let noCommunicationEvidenceComparisonCount = 0;

  for (const input of inputs) {
    const evidence = input.evidence;

    allowedChannelEventCount +=
      evidence.allowedChannelEventIds.length;

    mismatchedChannelEventCount +=
      evidence.mismatchedChannelEventIds.length;

    switch (evidence.communicationEvidenceStatus) {
      case "qualifying_outbound":
        qualifyingOutboundComparisonCount += 1;
        qualifyingTaskIds.add(input.taskId);

        for (const eventId of evidence.allowedChannelEventIds) {
          qualifyingEventIds.add(eventId);
        }
        break;

      case "outbound_channel_mismatch":
        outboundChannelMismatchComparisonCount += 1;
        break;

      case "inbound_only":
        inboundOnlyComparisonCount += 1;
        break;

      case "no_communication_evidence":
        noCommunicationEvidenceComparisonCount += 1;
        break;
    }
  }

  return {
    allowedChannelEventCount,
    mismatchedChannelEventCount,

    qualifyingOutboundComparisonCount,
    outboundChannelMismatchComparisonCount,
    inboundOnlyComparisonCount,
    noCommunicationEvidenceComparisonCount,

    uniqueQualifyingTaskCount: qualifyingTaskIds.size,
    uniqueQualifyingEventCount: qualifyingEventIds.size,
  };
}
