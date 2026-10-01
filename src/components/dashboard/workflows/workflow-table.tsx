"use client";

import { useState } from "react";
import type { TaskWorkflowReportItem } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report";
import type { DashboardWorkflowDetailData } from "@/lib/dashboard/dashboard-workflow-detail-data";
import { WorkflowDetailPanel } from "./detail/workflow-detail-panel";
import { WorkflowRow } from "./workflow-row";

type WorkflowTableProps = {
  workflows: TaskWorkflowReportItem[];
  workflowDetails: Record<string, DashboardWorkflowDetailData>;
};

export function WorkflowTable({
  workflows,
  workflowDetails,
}: WorkflowTableProps) {
  const [selectedTitle, setSelectedTitle] = useState(
    workflows[0]?.row.taskTitle ?? null,
  );

  const selectedWorkflow =
    workflows.find(
      (workflow) => workflow.row.taskTitle === selectedTitle,
    ) ?? null;

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[minmax(0,1fr)_120px_140px_160px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          <span>Workflow</span>
          <span>Tasks</span>
          <span>Identity evidence</span>
          <span>Qualifying outbound</span>
        </div>

        <div>
          {workflows.map((workflow) => {
            const title = workflow.row.taskTitle;

            return (
              <WorkflowRow
                key={title}
                workflow={workflow}
                selected={title === selectedTitle}
                onSelect={() => setSelectedTitle(title)}
              />
            );
          })}
        </div>
      </div>

      {selectedWorkflow ? (
        <WorkflowDetailPanel
          workflow={selectedWorkflow}
          evidence={
            workflowDetails[
              selectedWorkflow.row.taskTitle
            ]?.evidence ?? []
          }
        />
      ) : null}
    </div>
  );
}
