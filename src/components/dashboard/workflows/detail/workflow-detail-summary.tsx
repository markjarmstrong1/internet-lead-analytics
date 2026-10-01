import type { TaskWorkflowEvidenceDetail } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-evidence-detail";

type WorkflowDetailSummaryProps = {
  evidence: TaskWorkflowEvidenceDetail[];
};

function count(
  evidence: TaskWorkflowEvidenceDetail[],
  predicate: (item: TaskWorkflowEvidenceDetail) => boolean,
) {
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
    (item) =>
      item.communicationEvidenceStatus ===
      "qualifying_outbound",
  );

  const channelMismatch = count(
    evidence,
    (item) =>
      item.communicationEvidenceStatus ===
      "outbound_channel_mismatch",
  );

  const noCommunication = count(
    evidence,
    (item) =>
      item.communicationEvidenceStatus ===
      "no_communication_evidence",
  );

  const cards = [
    ["Direct identity", directIdentity],
    ["Unresolved identity", unresolvedIdentity],
    ["Qualifying outbound", qualifyingOutbound],
    ["Channel mismatch", channelMismatch],
    ["No communication evidence", noCommunication],
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map(([label, value]) => (
        <div
          key={label}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3"
        >
          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-slate-950">
            {value.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
