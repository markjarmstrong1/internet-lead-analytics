import type {
  TekionTaskActionChannel,
} from "../../../csv/task-action-semantics";
import type {
  TekionTaskCompletionMode,
} from "../../../csv/task-completion-semantics";
import type {
  TimelineIdentityEvidenceStatus,
} from "../../correlation/timeline-identity-evidence";
import type {
  TaskCommunicationEvidenceStatus,
  TaskCompletionEvidence,
} from "../task-completion-evidence";

export type TaskWorkflowReportFilter = {
  taskTitles?: string[];
  completionModes?: TekionTaskCompletionMode[];
  identityStatuses?: TimelineIdentityEvidenceStatus[];
  communicationStatuses?: TaskCommunicationEvidenceStatus[];
  allowedChannels?: TekionTaskActionChannel[];
  timelineSourceFiles?: string[];
};

function includes<T>(
  values: T[] | undefined,
  value: T,
): boolean {
  return (
    values === undefined ||
    values.includes(value)
  );
}

function overlaps<T>(
  values: T[] | undefined,
  candidates: T[],
): boolean {
  return (
    values === undefined ||
    candidates.some((candidate) =>
      values.includes(candidate),
    )
  );
}

export function matchesTaskWorkflowReportFilter(
  taskTitle: string,
  evidence: TaskCompletionEvidence,
  filter: TaskWorkflowReportFilter,
): boolean {
  return (
    includes(filter.taskTitles, taskTitle) &&
    includes(
      filter.completionModes,
      evidence.completionMode,
    ) &&
    includes(
      filter.identityStatuses,
      evidence.identityStatus,
    ) &&
    includes(
      filter.communicationStatuses,
      evidence.communicationEvidenceStatus,
    ) &&
    overlaps(
      filter.allowedChannels,
      evidence.allowedChannels,
    ) &&
    includes(
      filter.timelineSourceFiles,
      evidence.timelineSourceFile,
    )
  );
}
