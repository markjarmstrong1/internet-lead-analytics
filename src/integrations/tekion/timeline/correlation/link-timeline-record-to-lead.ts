export type TimelineLeadLinkCandidate = {
  timelineRecordId: string;
  timelineExternalRecordId: string | null;
  leadId: string;
  leadExternalRecordId: string;
};

export type TimelineLeadLinkResult =
  | {
      status: "linked";
      timelineRecordId: string;
      leadId: string;
    }
  | {
      status: "unlinked";
      timelineRecordId: string;
      reason: "missing_timeline_external_id" | "external_id_mismatch";
    };

export function linkTimelineRecordToLead(
  candidate: TimelineLeadLinkCandidate,
): TimelineLeadLinkResult {
  if (!candidate.timelineExternalRecordId) {
    return {
      status: "unlinked",
      timelineRecordId: candidate.timelineRecordId,
      reason: "missing_timeline_external_id",
    };
  }

  if (
    candidate.timelineExternalRecordId !==
    candidate.leadExternalRecordId
  ) {
    return {
      status: "unlinked",
      timelineRecordId: candidate.timelineRecordId,
      reason: "external_id_mismatch",
    };
  }

  return {
    status: "linked",
    timelineRecordId: candidate.timelineRecordId,
    leadId: candidate.leadId,
  };
}
