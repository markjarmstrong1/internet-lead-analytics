"use client";

import { useState } from "react";
import type { TaskWorkflowReportItem } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report";
import { WorkflowRow } from "./workflow-row";

type WorkflowTableProps = {
  workflows: TaskWorkflowReportItem[];
};

export function WorkflowTable({
  workflows,
}: WorkflowTableProps) {
  const [selectedTitle, setSelectedTitle] =
    useState(workflows[0]?.row.taskTitle ?? "");

  const selectedWorkflow = workflows.find(
    (workflow) =>
      workflow.row.taskTitle === selectedTitle,
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-[minmax(0,1fr)_100px_150px_170px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>Workflow</span>
        <span>Tasks</span>
        <span>Identity evidence</span>
        <span>Qualifying outbound</span>
      </div>

      {workflows.map((workflow) => (
        <WorkflowRow
          key={workflow.row.taskTitle}
          workflow={workflow}
          selected={
            workflow.row.taskTitle ===
            selectedTitle
          }
          onSelect={() =>
            setSelectedTitle(
              workflow.row.taskTitle,
            )
          }
        />
      ))}

      {selectedWorkflow ? (
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Selected workflow
          </p>

          <p className="mt-1 font-semibold text-slate-950">
            {selectedWorkflow.row.taskTitle}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Evidence detail will become the next investigation layer.
          </p>
        </div>
      ) : null}
    </div>
  );
}
