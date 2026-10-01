import fs from "node:fs";
import path from "node:path";

import { parseCsv } from "@/integrations/tekion/csv/parse-csv";
import { mapTaskRow } from "@/integrations/tekion/csv/map-task-row";
import { createTaskRecordId } from "@/integrations/tekion/import/create-task-record-id";
import { importTimelineFile } from "@/integrations/tekion/timeline/import-timeline-file";
import { buildTaskTimelineCorrelation } from "@/integrations/tekion/timeline/correlation/build-task-timeline-correlation";
import { buildTaskCompletionEvidence } from "@/integrations/tekion/timeline/task-evidence/build-task-completion-evidence";
import { buildTaskWorkflowEvidenceDetail } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-evidence-detail";
import type { TaskWorkflowEvidenceDetail } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-evidence-detail";

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

export type DashboardWorkflowDetailData = {
  workflowTitle: string;
  evidence: TaskWorkflowEvidenceDetail[];
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

export function buildDashboardWorkflowDetailData(
  workflowTitle: string,
): DashboardWorkflowDetailData {
  const normalizedTitle = workflowTitle.trim();

  const tasks = parseCsv(
    fs.readFileSync(taskFile, "utf8"),
  )
    .map(mapTaskRow)
    .filter(
      (task) =>
        task.taskTitle.trim() === normalizedTitle,
    );

  const timelines = timelineFiles.map(readTimeline);

  const evidence: TaskWorkflowEvidenceDetail[] = [];

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

      const completionEvidence =
        buildTaskCompletionEvidence(
          {
            task,
            correlation,
          },
          timeline.import.events,
        );

      evidence.push(
        buildTaskWorkflowEvidenceDetail(
          normalizedTitle,
          completionEvidence,
          timeline.import.events,
        ),
      );
    }
  }

  return {
    workflowTitle: normalizedTitle,
    evidence,
  };
}
