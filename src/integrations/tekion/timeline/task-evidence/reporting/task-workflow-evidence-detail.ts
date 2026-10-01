import type {
  TekionTaskActionChannel,
} from "../../csv/task-action-semantics";
import type {
  TekionTaskCompletionMode,
} from "../../csv/task-completion-semantics";
import type {
  TimelineIdentityEvidenceStatus,
} from "../correlation/timeline-identity-evidence";
import type {
  TekionNormalizedTimelineEvent,
} from "../normalized-timeline-event";
import type {
  TaskCommunicationEvidenceStatus,
  TaskCompletionEvidence,
} from "../task-completion-evidence";

export type TaskWorkflowEvidenceDetail = {
  taskSourceRecordId: string;
  taskTitle: string;
  timelineSourceFile: string;

  completionMode: TekionTaskCompletionMode;
  identityStatus: TimelineIdentityEvidenceStatus;
  allowedChannels: TekionTaskActionChannel[];
  communicationEvidenceStatus: TaskCommunicationEvidenceStatus;

  timelineEventIds: string[];
  communicationEventIds: string[];
  employeeOutboundEventIds: string[];
  allowedChannelEventIds: string[];
  mismatchedChannelEventIds: string[];
  inboundCommunicationEventIds: string[];

  evidenceKinds: {
    sourceEvents: "observed";
    normalizedMeaning: "normalized";
    timelineEvidence: "observed" | "unavailable";
  };

  events: Array<{
    sourceEventId: string;
    occurredAt: string;
    rawType: string;
    category: TekionNormalizedTimelineEvent["category"];
    actor: string;
    actorType: TekionNormalizedTimelineEvent["actorType"];
    communicationChannel?: TekionNormalizedTimelineEvent["communicationChannel"];
    communicationDirection?: TekionNormalizedTimelineEvent["communicationDirection"];
  }>;
};

export function buildTaskWorkflowEvidenceDetail(
  taskTitle: string,
  evidence: TaskCompletionEvidence,
  timelineEvents: TekionNormalizedTimelineEvent[],
): TaskWorkflowEvidenceDetail {
  const eventIds = new Set(
    evidence.timelineEventIds,
  );

  const events = timelineEvents
    .filter((event) =>
      eventIds.has(event.sourceEventId),
    )
    .map((event) => ({
      sourceEventId: event.sourceEventId,
      occurredAt: event.occurredAt,
      rawType: event.rawType,
      category: event.category,
      actor: event.actor,
      actorType: event.actorType,
      communicationChannel:
        event.communicationChannel,
      communicationDirection:
        event.communicationDirection,
    }));

  return {
    taskSourceRecordId:
      evidence.taskSourceRecordId,
    taskTitle: taskTitle.trim(),
    timelineSourceFile:
      evidence.timelineSourceFile,

    completionMode:
      evidence.completionMode,
    identityStatus:
      evidence.identityStatus,
    allowedChannels:
      evidence.allowedChannels,
    communicationEvidenceStatus:
      evidence.communicationEvidenceStatus,

    timelineEventIds:
      evidence.timelineEventIds,
    communicationEventIds:
      evidence.communicationEventIds,
    employeeOutboundEventIds:
      evidence.employeeOutboundEventIds,
    allowedChannelEventIds:
      evidence.allowedChannelEventIds,
    mismatchedChannelEventIds:
      evidence.mismatchedChannelEventIds,
    inboundCommunicationEventIds:
      evidence.inboundCommunicationEventIds,

    evidenceKinds: {
      sourceEvents: "observed",
      normalizedMeaning: "normalized",
      timelineEvidence:
        events.length > 0
          ? "observed"
          : "unavailable",
    },

    events,
  };
}
