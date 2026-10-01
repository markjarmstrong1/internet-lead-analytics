"use client";

import { useMemo } from "react";
import type { TaskWorkflowEvidenceDetail } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-evidence-detail";
import type { TaskWorkflowReportItem } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report";
import { WorkflowDetailHeader } from "./workflow-detail-header";
import { WorkflowDetailSummary } from "./workflow-detail-summary";
import { EvidenceList } from "../evidence/evidence-list";

type WorkflowDetailPanelProps = {
  workflow: TaskWorkflowReportItem;
  evidence: TaskWorkflowEvidenceDetail[];
};

export function WorkflowDetailPanel({
  workflow,
  evidence,
}: WorkflowDetailPanelProps) {
  const visibleEvidence = useMemo(
    () =>
      evidence.filter(
        (item) => item.identityStatus !== "no_match",
      ),
    [evidence],
  );

  return (
    <div className="mt-8 border-t border-slate-200 pt-8">
      <div className="mb-6">
        <WorkflowDetailHeader
          title={workflow.row.taskTitle}
          comparisonCount={workflow.row.comparisonCount}
        />
      </div>

      <WorkflowDetailSummary evidence={visibleEvidence} />

      <section
        aria-labelledby="evidence-heading"
        className="mt-8"
      >
        <div className="mb-4">
          <h3
            id="evidence-heading"
            className="text-base font-semibold text-slate-950"
          >
            Evidence detail
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Direct matches and unresolved identity variants are shown below.
            Unmatched comparisons remain outside the evidence view.
          </p>
        </div>

        {visibleEvidence.length > 0 ? (
          <EvidenceList evidence={visibleEvidence} />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
            <p className="text-sm font-medium text-slate-700">
              No timeline evidence is currently associated with this workflow.
            </p>

            <p className="mt-1 text-xs text-slate-500">
              The available timeline records did not produce a direct or unresolved identity association.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
