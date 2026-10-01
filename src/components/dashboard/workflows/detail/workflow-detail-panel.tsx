"use client";

import { useMemo } from "react";
import type { TaskWorkflowReportItem } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report";
import type { TaskWorkflowEvidenceDetail } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-evidence-detail";
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
        (item) =>
          item.identityStatus !== "no_match",
      ),
    [evidence],
  );

  return (
    <section className="border-t border-slate-200 bg-slate-50 px-5 py-6">
      <WorkflowDetailHeader
        title={workflow.row.taskTitle}
        comparisonCount={workflow.row.comparisonCount}
      />

      <div className="mt-5">
        <WorkflowDetailSummary
          evidence={visibleEvidence}
        />
      </div>

      <div className="mt-6">
        <div className="mb-3">
          <p className="text-sm font-semibold text-slate-950">
            Evidence
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Showing evidence where the workflow could be associated with a timeline identity.
          </p>
        </div>

        {visibleEvidence.length > 0 ? (
          <EvidenceList evidence={visibleEvidence} />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
            No timeline evidence is currently associated with this workflow.
          </div>
        )}
      </div>
    </section>
  );
}
