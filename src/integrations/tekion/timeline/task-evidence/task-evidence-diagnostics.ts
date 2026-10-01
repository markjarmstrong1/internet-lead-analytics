import type { TaskCompletionEvidence } from "./task-completion-evidence";

export type TaskEvidenceDiagnostic = {
  taskSourceRecordId: string;
  timelineSourceFile: string;
  completionMode: TaskCompletionEvidence["completionMode"];
  identityStatus: TaskCompletionEvidence["identityStatus"];
  communicationEvidenceStatus:
    TaskCompletionEvidence["communicationEvidenceStatus"];
  allowedChannels: TaskCompletionEvidence["allowedChannels"];
  communicationEventCount: number;
  employeeOutboundEventCount: number;
  allowedChannelEventCount: number;
  mismatchedChannelEventCount: number;
  inboundCommunicationEventCount: number;
};

export function buildTaskEvidenceDiagnostics(
  evidence: TaskCompletionEvidence[],
): TaskEvidenceDiagnostic[] {
  return evidence.map((item) => ({
    taskSourceRecordId: item.taskSourceRecordId,
    timelineSourceFile: item.timelineSourceFile,
    completionMode: item.completionMode,
    identityStatus: item.identityStatus,
    communicationEvidenceStatus:
      item.communicationEvidenceStatus,
    allowedChannels: item.allowedChannels,
    communicationEventCount: item.communicationEventIds.length,
    employeeOutboundEventCount:
      item.employeeOutboundEventIds.length,
    allowedChannelEventCount:
      item.allowedChannelEventIds.length,
    mismatchedChannelEventCount:
      item.mismatchedChannelEventIds.length,
    inboundCommunicationEventCount:
      item.inboundCommunicationEventIds.length,
  }));
}
