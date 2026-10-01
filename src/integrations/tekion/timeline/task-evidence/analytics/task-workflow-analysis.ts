import type { TekionTaskRecord } from "../../../csv/task-record";
import type { TaskCompletionEvidence } from "../task-completion-evidence";

export type TaskWorkflowAnalysisInput = {
  taskId: string;
  task: TekionTaskRecord;
  evidence: TaskCompletionEvidence;
};

export type TaskWorkflowAnalysis = {
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

  qualifyingOutboundComparisons: number;
  outboundChannelMismatchComparisons: number;
  inboundOnlyComparisons: number;
  noCommunicationEvidenceComparisons: number;

  uniqueQualifyingTaskIds: string[];
};

export function analyzeTaskWorkflows(
  inputs: TaskWorkflowAnalysisInput[],
): TaskWorkflowAnalysis[] {
  const groups = new Map<
    string,
    {
      taskIds: Set<string>;
      inputs: TaskWorkflowAnalysisInput[];
    }
  >();

  for (const input of inputs) {
    const taskTitle = input.task.taskTitle.trim();

    const existing = groups.get(taskTitle);

    if (existing) {
      existing.taskIds.add(input.taskId);
      existing.inputs.push(input);
      continue;
    }

    groups.set(taskTitle, {
      taskIds: new Set([input.taskId]),
      inputs: [input],
    });
  }

  return [...groups.entries()]
    .map(([taskTitle, group]) => {
      const analysis: TaskWorkflowAnalysis = {
        taskTitle,
        taskCount: group.taskIds.size,
        comparisonCount: group.inputs.length,

        completedAutomatically: 0,
        completedManually: 0,
        dismissed: 0,
        overdue: 0,
        pending: 0,
        unknownCompletionMode: 0,

        directIdentityComparisons: 0,
        unresolvedIdentityComparisons: 0,

        qualifyingOutboundComparisons: 0,
        outboundChannelMismatchComparisons: 0,
        inboundOnlyComparisons: 0,
        noCommunicationEvidenceComparisons: 0,

        uniqueQualifyingTaskIds: [],
      };

      const qualifyingTaskIds = new Set<string>();

      for (const input of group.inputs) {
        const evidence = input.evidence;

        switch (evidence.completionMode) {
          case "completed_automatically":
            analysis.completedAutomatically += 1;
            break;
          case "completed_manually":
            analysis.completedManually += 1;
            break;
          case "dismissed":
            analysis.dismissed += 1;
            break;
          case "overdue":
            analysis.overdue += 1;
            break;
          case "pending":
            analysis.pending += 1;
            break;
          case "unknown":
            analysis.unknownCompletionMode += 1;
            break;
        }

        switch (evidence.identityStatus) {
          case "direct_match":
            analysis.directIdentityComparisons += 1;
            break;
          case "unresolved_variant":
            analysis.unresolvedIdentityComparisons += 1;
            break;
        }

        switch (evidence.communicationEvidenceStatus) {
          case "qualifying_outbound":
            analysis.qualifyingOutboundComparisons += 1;
            qualifyingTaskIds.add(input.taskId);
            break;
          case "outbound_channel_mismatch":
            analysis.outboundChannelMismatchComparisons += 1;
            break;
          case "inbound_only":
            analysis.inboundOnlyComparisons += 1;
            break;
          case "no_communication_evidence":
            analysis.noCommunicationEvidenceComparisons += 1;
            break;
        }
      }

      analysis.uniqueQualifyingTaskIds = [
        ...qualifyingTaskIds,
      ].sort();

      return analysis;
    })
    .sort((left, right) =>
      left.taskTitle.localeCompare(right.taskTitle),
    );
}
