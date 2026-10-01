import type { TekionTaskRecord } from "../../../csv/task-record";
import type { TaskCompletionEvidence } from "../task-completion-evidence";

export type TaskWorkflowCompletionProfileInput = {
  taskId: string;
  task: TekionTaskRecord;
  evidence: TaskCompletionEvidence;
};

export type TaskWorkflowCompletionProfile = {
  taskTitle: string;
  taskCount: number;
  comparisonCount: number;

  completedAutomatically: number;
  completedManually: number;
  dismissed: number;
  overdue: number;
  pending: number;
  unknownCompletionMode: number;

  directIdentityComparisons: number;
  unresolvedIdentityComparisons: number;
  noIdentityMatchComparisons: number;

  qualifyingOutbound: number;
  outboundChannelMismatch: number;
  inboundOnly: number;
  noCommunicationEvidence: number;
  notEvaluated: number;
};

export function profileTaskWorkflowCompletion(
  inputs: TaskWorkflowCompletionProfileInput[],
): TaskWorkflowCompletionProfile[] {
  const groups = new Map<
    string,
    TaskWorkflowCompletionProfile
  >();

  for (const input of inputs) {
    const title = input.task.taskTitle.trim();

    let profile = groups.get(title);

    if (!profile) {
      profile = {
        taskTitle: title,
        taskCount: 0,
        comparisonCount: 0,

        completedAutomatically: 0,
        completedManually: 0,
        dismissed: 0,
        overdue: 0,
        pending: 0,
        unknownCompletionMode: 0,

        directIdentityComparisons: 0,
        unresolvedIdentityComparisons: 0,
        noIdentityMatchComparisons: 0,

        qualifyingOutbound: 0,
        outboundChannelMismatch: 0,
        inboundOnly: 0,
        noCommunicationEvidence: 0,
        notEvaluated: 0,
      };

      groups.set(title, profile);
    }

    profile.comparisonCount += 1;

    switch (input.evidence.completionMode) {
      case "completed_automatically":
        profile.completedAutomatically += 1;
        break;
      case "completed_manually":
        profile.completedManually += 1;
        break;
      case "dismissed":
        profile.dismissed += 1;
        break;
      case "overdue":
        profile.overdue += 1;
        break;
      case "pending":
        profile.pending += 1;
        break;
      case "unknown":
        profile.unknownCompletionMode += 1;
        break;
    }

    switch (input.evidence.identityStatus) {
      case "direct_match":
        profile.directIdentityComparisons += 1;
        break;
      case "unresolved_variant":
        profile.unresolvedIdentityComparisons += 1;
        break;
      case "no_match":
        profile.noIdentityMatchComparisons += 1;
        break;
    }

    switch (input.evidence.communicationEvidenceStatus) {
      case "qualifying_outbound":
        profile.qualifyingOutbound += 1;
        break;
      case "outbound_channel_mismatch":
        profile.outboundChannelMismatch += 1;
        break;
      case "inbound_only":
        profile.inboundOnly += 1;
        break;
      case "no_communication_evidence":
        profile.noCommunicationEvidence += 1;
        break;
      case "not_evaluated":
        profile.notEvaluated += 1;
        break;
    }
  }

  const taskIdsByTitle = new Map<string, Set<string>>();

  for (const input of inputs) {
    const title = input.task.taskTitle.trim();

    let ids = taskIdsByTitle.get(title);

    if (!ids) {
      ids = new Set<string>();
      taskIdsByTitle.set(title, ids);
    }

    ids.add(input.taskId);
  }

  for (const [title, ids] of taskIdsByTitle) {
    groups.get(title)!.taskCount = ids.size;
  }

  return [...groups.values()].sort((left, right) =>
    left.taskTitle.localeCompare(right.taskTitle),
  );
}
