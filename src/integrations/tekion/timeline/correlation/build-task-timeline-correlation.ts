import { classifyTimelineIdentity } from "./classify-timeline-identity";
import type { TekionNormalizedTimelineEvent } from "../normalized-timeline-event";
import type { TaskTimelineCorrelation } from "./task-timeline-correlation";

export type BuildTaskTimelineCorrelationInput = {
  taskSourceRecordId: string;
  taskIdentity: string;
  timelineIdentity: string;
  timelineSourceFile: string;
  timelineEvents: TekionNormalizedTimelineEvent[];
};

export function buildTaskTimelineCorrelation(
  input: BuildTaskTimelineCorrelationInput,
): TaskTimelineCorrelation {
  const identity = classifyTimelineIdentity({
    timelineIdentity: input.timelineIdentity,
    candidateIdentity: input.taskIdentity,
  });

  return {
    taskSourceRecordId: input.taskSourceRecordId,
    timelineSourceFile: input.timelineSourceFile,
    status: identity.status,
    similarity: identity.similarity,
    timelineEventIds:
      identity.status === "no_match"
        ? []
        : input.timelineEvents.map(
            (event) => event.sourceEventId,
          ),
  };
}
