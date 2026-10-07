export const EVIDENCE_STATES = [
  "observed",
  "not_observed",
  "unknown",
  "insufficient_evidence",
  "unresolved",
] as const;

export type EvidenceState = (typeof EVIDENCE_STATES)[number];

export type EvidenceAssessment = {
  state: EvidenceState;
  reason: string;
};

export function observedEvidence(reason: string): EvidenceAssessment {
  return { state: "observed", reason };
}

export function notObservedEvidence(reason: string): EvidenceAssessment {
  return { state: "not_observed", reason };
}

export function unknownEvidence(reason: string): EvidenceAssessment {
  return { state: "unknown", reason };
}
