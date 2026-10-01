import type { TaskWorkflowEvidenceDetail } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-evidence-detail";
import { SummaryCard } from "../../overview/summary-card";

type WorkflowDetailSummaryProps = {
  evidence: TaskWorkflowEvidenceDetail[];
};

function count(
  evidence: TaskWorkflowEvidenceDetail[],
  predicate: (item: TaskWorkflowEvidenceDetail) => boolean,
): number {
  return evidence.filter(predicate).length;
}

export function WorkflowDetailSummary({
  evidence,
}: WorkflowDetailSummaryProps) {
  const directIdentity = count(
    evidence,
    (item) => item.identityStatus === "direct_match",
  );

  const unresolvedIdentity = count(
    evidence,
    (item) => item.identityStatus === "unresolved_variant",
  );

  const qualifyingOutbound = count(
    evidence,
    (item) => item.communicationEvidenceStatus === "qualifying_outbound",
  );

  const channelMismatch = count(
    evidence,
    (item) => item.communicationEvidenceStatus === "outbound_channel_mismatch",
  );

  const noCommunicationEvidence = count(
    evidence,
    (item) => item.communicationEvidenceStatus === "no_communication_evidence",
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <SummaryCard
        label="Direct identity"
        value={String(directIdentity)}
        detail="Evidence comparisons with a direct identity match."
      />

      <SummaryCard
        label="Unresolved identity"
        value={String(unresolvedIdentity)}
        detail="Comparisons requiring identity review."
      />

      <SummaryCard
        label="Qualifying outbound"
        value={String(qualifyingOutbound)}
        detail="Comparisons with observed qualifying outbound evidence."
      />

      <SummaryCard
        label="Channel mismatch"
        value={String(channelMismatch)}
        detail="Outbound evidence outside the Task's allowed channels."
      />

      <SummaryCard
        label="No communication"
        value={String(noCommunicationEvidence)}
        detail="Completed comparisons without observed communication evidence."
      />
    </div>
  );
}
