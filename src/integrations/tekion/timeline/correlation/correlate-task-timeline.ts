import { classifyTimelineIdentity } from "./classify-timeline-identity";
import type { TimelineIdentityEvidenceStatus } from "./timeline-identity-evidence";

type CorrelateTaskTimelineInput = {
  taskIdentity: string;
  timelineIdentity: string;
  taskSourceRecordId: string;
  timelineEventIds: string[];
};

export type TaskTimelineCorrelation = {
  status: TimelineIdentityEvidenceStatus;
  taskSourceRecordId: string;
  timelineEventIds: string[];
};

export function correlateTaskTimeline(
  input: CorrelateTaskTimelineInput,
): TaskTimelineCorrelation {
  const identity = classifyTimelineIdentity({
    timelineIdentity: input.timelineIdentity,
    candidateIdentity: input.taskIdentity,
  });

  return {
    status: identity.status,
    taskSourceRecordId: input.taskSourceRecordId,
    timelineEventIds:
      identity.status === "no_match"
        ? []
        : input.timelineEventIds,
  };
}
