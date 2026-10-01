"use client";

import { useEffect, useMemo, useState } from "react";
import type { TaskWorkflowReportItem } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report";
import {
  matchesTaskWorkflowReportFilter,
  type TaskWorkflowReportFilter,
} from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report-filter";
import type { DashboardWorkflowDetailData } from "@/lib/dashboard/dashboard-workflow-detail-data";
import { WorkflowDetailPanel } from "./detail/workflow-detail-panel";
import { WorkflowFilters } from "./workflow-filters";
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
  const [filter, setFilter] = useState<TaskWorkflowReportFilter>({});

  const workflowTitles = useMemo(
    () => workflows.map((workflow) => workflow.row.taskTitle),
    [workflows],
  );

  const filteredWorkflows = useMemo(
    () =>
      workflows.filter((workflow) => {
        const title = workflow.row.taskTitle;

        if (filter.taskTitles && !filter.taskTitles.includes(title)) {
          return false;
        }

        const evidence = workflowDetails[title]?.evidence ?? [];

        if (Object.keys(filter).length === 1 && filter.taskTitles) {
          return true;
        }

        return evidence.some((item) =>
          matchesTaskWorkflowReportFilter(
            title,
            item,
            filter,
          ),
        );
      }),
    [filter, workflowDetails, workflows],
  );

  useEffect(() => {
    if (
      selectedTitle &&
      filteredWorkflows.some(
        (workflow) => workflow.row.taskTitle === selectedTitle,
      )
    ) {
      return;
    }

    setSelectedTitle(
      filteredWorkflows[0]?.row.taskTitle ?? null,
    );
  }, [filteredWorkflows, selectedTitle]);

  const selectedWorkflow =
    filteredWorkflows.find(
      (workflow) => workflow.row.taskTitle === selectedTitle,
    ) ?? null;

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <WorkflowFilters
          filter={filter}
          workflowTitles={workflowTitles}
          onChange={setFilter}
        />

        <div className="border-b border-slate-100 px-5 py-3 text-sm text-slate-500">
          Showing {filteredWorkflows.length} of {workflows.length} workflows
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_120px_140px_160px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          <span>Workflow</span>
          <span>Tasks</span>
          <span>Identity evidence</span>
          <span>Qualifying outbound</span>
        </div>

        <div>
          {filteredWorkflows.map((workflow) => {
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

        {filteredWorkflows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No workflows match the selected filters.
          </div>
        ) : null}
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
