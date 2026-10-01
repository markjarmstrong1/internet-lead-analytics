import type { TaskCompletionEvidence } from "../task-completion-evidence";

export type TaskWorkflowCoverageProfile = {
  taskCount: number;
  comparisonCount: number;

  directIdentityTaskCount: number;
  unresolvedIdentityTaskCount: number;
  noIdentityMatchTaskCount: number;

  directIdentityComparisonCount: number;
  unresolvedIdentityComparisonCount: number;
  noIdentityMatchComparisonCount: number;
};

export function buildTaskWorkflowCoverageProfile(
  inputs: Array<{
    taskId: string;
    evidence: TaskCompletionEvidence;
  }>,
): TaskWorkflowCoverageProfile {
  const directTaskIds = new Set<string>();
  const unresolvedTaskIds = new Set<string>();
  const noMatchTaskIds = new Set<string>();

  let directIdentityComparisonCount = 0;
  let unresolvedIdentityComparisonCount = 0;
  let noIdentityMatchComparisonCount = 0;

  for (const input of inputs) {
    switch (input.evidence.identityStatus) {
      case "direct_match":
        directIdentityComparisonCount += 1;
        directTaskIds.add(input.taskId);
        break;

      case "unresolved_variant":
        unresolvedIdentityComparisonCount += 1;
        unresolvedTaskIds.add(input.taskId);
        break;

      case "no_match":
        noIdentityMatchComparisonCount += 1;
        noMatchTaskIds.add(input.taskId);
        break;
    }
  }

  return {
    taskCount: new Set(inputs.map((input) => input.taskId)).size,
    comparisonCount: inputs.length,

    directIdentityTaskCount: directTaskIds.size,
    unresolvedIdentityTaskCount: unresolvedTaskIds.size,
    noIdentityMatchTaskCount: noMatchTaskIds.size,

    directIdentityComparisonCount,
    unresolvedIdentityComparisonCount,
    noIdentityMatchComparisonCount,
  };
}
