import { SemanticBadge } from "./semantic-badge";

type EvidenceStateKind =
  | "observed"
  | "calculated"
  | "inferred"
  | "unknown"
  | "missing";

type EvidenceStateProps = {
  kind: EvidenceStateKind;
};

const labels: Record<EvidenceStateKind, string> = {
  observed: "Observed",
  calculated: "Calculated",
  inferred: "Inferred",
  unknown: "Unknown",
  missing: "Missing evidence",
};

const tones = {
  observed: "info",
  calculated: "neutral",
  inferred: "warning",
  unknown: "unknown",
  missing: "negative",
} as const;

export function EvidenceState({ kind }: EvidenceStateProps) {
  return <SemanticBadge tone={tones[kind]}>{labels[kind]}</SemanticBadge>;
}
