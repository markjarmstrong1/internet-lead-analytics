import type { TimelineIdentityEvidenceStatus } from "./timeline-identity-evidence";

export type TaskTimelineCorrelation = {
  taskSourceRecordId: string;
  timelineSourceFile: string;
  status: TimelineIdentityEvidenceStatus;
  similarity: number;
  timelineEventIds: string[];
};
