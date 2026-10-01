export type TimelineIdentityEvidenceStatus =
  | "direct_match"
  | "unresolved_variant"
  | "no_match";

export type TimelineIdentityEvidence = {
  status: TimelineIdentityEvidenceStatus;
  similarity: number;
};
