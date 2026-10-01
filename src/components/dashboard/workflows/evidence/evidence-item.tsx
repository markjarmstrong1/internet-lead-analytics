import type { TaskWorkflowEvidenceDetail } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-evidence-detail";
import { EvidenceEvents } from "./evidence-events";
import { EvidenceStatus } from "./evidence-status";

type EvidenceItemProps = {
  evidence: TaskWorkflowEvidenceDetail;
};

function identityLabel(
  status: TaskWorkflowEvidenceDetail["identityStatus"],
): string {
  switch (status) {
    case "direct_match":
      return "Direct identity match";
    case "unresolved_variant":
      return "Unresolved identity variant";
    case "no_match":
      return "No identity match";
  }
}

function completionLabel(
  mode: TaskWorkflowEvidenceDetail["completionMode"],
): string {
  switch (mode) {
    case "completed_automatically":
      return "Automatically completed";
    case "completed_manually":
      return "Manually completed";
    case "dismissed":
      return "Dismissed";
    case "overdue":
      return "Overdue";
    case "pending":
      return "Pending";
    case "unknown":
      return "Unknown completion state";
  }
}

export function EvidenceItem({
  evidence,
}: EvidenceItemProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Task evidence
          </p>

          <h4 className="mt-1 text-base font-semibold text-slate-950">
            {evidence.taskTitle}
          </h4>

          <p className="mt-1 text-sm text-slate-500">
            {evidence.timelineSourceFile}
          </p>
        </div>

        <EvidenceStatus status={evidence.communicationEvidenceStatus} />
      </div>

      <dl className="mt-5 grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs font-medium text-slate-400">
            Identity
          </dt>
          <dd className="mt-1 text-sm text-slate-700">
            {identityLabel(evidence.identityStatus)}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-slate-400">
            Completion
          </dt>
          <dd className="mt-1 text-sm text-slate-700">
            {completionLabel(evidence.completionMode)}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-slate-400">
            Allowed channels
          </dt>
          <dd className="mt-1 text-sm text-slate-700">
            {evidence.allowedChannels.length > 0
              ? evidence.allowedChannels.join(", ")
              : "None recorded"}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-slate-400">
            Observed events
          </dt>
          <dd className="mt-1 text-sm text-slate-700">
            {evidence.events.length}
          </dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-slate-200 pt-5">
        <div className="mb-3">
          <h5 className="text-sm font-semibold text-slate-900">
            Underlying timeline events
          </h5>

          <p className="mt-1 text-xs text-slate-500">
            Observed events are shown as evidence only; this view does not infer causality.
          </p>
        </div>

        <EvidenceEvents events={evidence.events} />
      </div>
    </article>
  );
}
