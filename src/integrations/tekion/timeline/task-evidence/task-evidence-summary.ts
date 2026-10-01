import type { TaskCompletionEvidence } from "./task-completion-evidence";

export type TaskEvidenceSummary = {
  totalComparisons: number;
  directIdentityComparisons: number;
  unresolvedIdentityComparisons: number;
  noIdentityMatchComparisons: number;

  completedAutomatically: number;
  completedManually: number;
  dismissed: number;
  overdue: number;
  pending: number;
  unknownCompletionMode: number;

  qualifyingOutbound: number;
  outboundChannelMismatch: number;
  inboundOnly: number;
  noCommunicationEvidence: number;
  windowUnavailable: number;
  windowInvalid: number;
  notEvaluated: number;

  qualifyingTaskIds: string[];
  qualifyingEventIds: string[];
};

export function summarizeTaskCompletionEvidence(
  evidence: TaskCompletionEvidence[],
): TaskEvidenceSummary {
  const summary: TaskEvidenceSummary = {
    totalComparisons: evidence.length,
    directIdentityComparisons: 0,
    unresolvedIdentityComparisons: 0,
    noIdentityMatchComparisons: 0,

    completedAutomatically: 0,
    completedManually: 0,
    dismissed: 0,
    overdue: 0,
    pending: 0,
    unknownCompletionMode: 0,

    qualifyingOutbound: 0,
    outboundChannelMismatch: 0,
    inboundOnly: 0,
    noCommunicationEvidence: 0,
    windowUnavailable: 0,
    windowInvalid: 0,
    notEvaluated: 0,

    qualifyingTaskIds: [],
    qualifyingEventIds: [],
  };

  const qualifyingTaskIds = new Set<string>();
  const qualifyingEventIds = new Set<string>();

  for (const item of evidence) {
    switch (item.identityStatus) {
      case "direct_match":
        summary.directIdentityComparisons += 1;
        break;
      case "unresolved_variant":
        summary.unresolvedIdentityComparisons += 1;
        break;
      case "no_match":
        summary.noIdentityMatchComparisons += 1;
        break;
    }

    switch (item.completionMode) {
      case "completed_automatically":
        summary.completedAutomatically += 1;
        break;
      case "completed_manually":
        summary.completedManually += 1;
        break;
      case "dismissed":
        summary.dismissed += 1;
        break;
      case "overdue":
        summary.overdue += 1;
        break;
      case "pending":
        summary.pending += 1;
        break;
      case "unknown":
        summary.unknownCompletionMode += 1;
        break;
    }

    switch (item.communicationEvidenceStatus) {
      case "qualifying_outbound":
        summary.qualifyingOutbound += 1;
        qualifyingTaskIds.add(item.taskSourceRecordId);

        for (const eventId of item.allowedChannelEventIds) {
          qualifyingEventIds.add(eventId);
        }
        break;

      case "outbound_channel_mismatch":
        summary.outboundChannelMismatch += 1;
        break;
      case "inbound_only":
        summary.inboundOnly += 1;
        break;
      case "no_communication_evidence":
        summary.noCommunicationEvidence += 1;
        break;
      case "window_unavailable":
        summary.windowUnavailable += 1;
        break;
      case "window_invalid":
        summary.windowInvalid += 1;
        break;
      case "not_evaluated":
        summary.notEvaluated += 1;
        break;
    }
  }

  summary.qualifyingTaskIds = [...qualifyingTaskIds].sort();
  summary.qualifyingEventIds = [...qualifyingEventIds].sort();

  return summary;
}
