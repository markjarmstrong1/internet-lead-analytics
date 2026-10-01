import fs from "node:fs";
import path from "node:path";

import { parseCsv } from "@/integrations/tekion/csv/parse-csv";
import { mapTaskRow } from "@/integrations/tekion/csv/map-task-row";
import { createTaskRecordId } from "@/integrations/tekion/import/create-task-record-id";
import { importTimelineFile } from "@/integrations/tekion/timeline/import-timeline-file";
import { buildTaskTimelineCorrelation } from "@/integrations/tekion/timeline/correlation/build-task-timeline-correlation";
import { buildTaskCompletionEvidence } from "@/integrations/tekion/timeline/task-evidence/build-task-completion-evidence";
import { buildTaskWorkflowCoverageProfile } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-coverage-profile";
import { buildTaskWorkflowChannelProfile } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-channel-profile";
import { buildTaskWorkflowReportRow } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report-row";
import { buildTaskWorkflowReport } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report";
import type { TaskWorkflowReport } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report";

const projectRoot = process.cwd();

const taskFile = path.join(
  projectRoot,
  "data/tekion/tasks/_CRM_TASK_LIST_48e53783-3c35-4c92-b5c0-3c9d89daaeff15226785944713350597.csv",
);

const timelineFiles = [
  "ana_yu.txt",
  "anthony_bacon.txt",
  "jeffery_becker.txt",
  "jim_wilson.txt",
];

export type DashboardReportData = {
  taskCount: number;
  workflowCount: number;
  report: TaskWorkflowReport;
};

function identityFromTimelineFile(file: string): string {
  return file
    .replace(/\.txt$/i, "")
    .replace(/_/g, " ");
}

function readTimeline(file: string) {
  const fullPath = path.join(
    projectRoot,
    "data/tekion",
    file,
  );

  return {
    file,
    identity: identityFromTimelineFile(file),
    import: importTimelineFile(
      fs.readFileSync(fullPath, "utf8"),
      file,
    ),
  };
}

export function buildDashboardReportData(): DashboardReportData {
  const tasks = parseCsv(
    fs.readFileSync(taskFile, "utf8"),
  ).map(mapTaskRow);

  const timelines = timelineFiles.map(readTimeline);

  const inputsByTitle = new Map<
    string,
    Array<{
      taskId: string;
      evidence: ReturnType<
        typeof buildTaskCompletionEvidence
      >;
    }>
  >();

  for (const task of tasks) {
    const taskId = createTaskRecordId(task);

    for (const timeline of timelines) {
      const correlation =
        buildTaskTimelineCorrelation({
          taskSourceRecordId: taskId,
          taskIdentity: task.associatedWith,
          timelineIdentity: timeline.identity,
          timelineSourceFile: timeline.file,
          timelineEvents: timeline.import.events,
        });

      const evidence = buildTaskCompletionEvidence(
        {
          task,
          correlation,
        },
        timeline.import.events,
      );

      const title = task.taskTitle.trim();
      const existing = inputsByTitle.get(title);
      const item = { taskId, evidence };

      if (existing) {
        existing.push(item);
      } else {
        inputsByTitle.set(title, [item]);
      }
    }
  }

  const rows = [...inputsByTitle.entries()]
    .map(([taskTitle, inputs]) => {
      const coverage =
        buildTaskWorkflowCoverageProfile(inputs);

      const channels =
        buildTaskWorkflowChannelProfile(inputs);

      return buildTaskWorkflowReportRow(
        taskTitle,
        coverage,
        channels,
      );
    })
    .sort((left, right) =>
      left.taskTitle.localeCompare(right.taskTitle),
    );

  return {
    taskCount: tasks.length,
    workflowCount: rows.length,
    report: buildTaskWorkflowReport(rows),
  };
}
