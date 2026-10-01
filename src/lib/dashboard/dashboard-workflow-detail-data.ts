import fs from "node:fs";

import { parseCsv } from "@/integrations/tekion/csv/parse-csv";
import { mapTaskRow } from "@/integrations/tekion/csv/map-task-row";
import { createTaskRecordId } from "@/integrations/tekion/import/create-task-record-id";
import { importTimelineFile } from "@/integrations/tekion/timeline/import-timeline-file";
import { buildTaskTimelineCorrelation } from "@/integrations/tekion/timeline/correlation/build-task-timeline-correlation";
import { buildTaskCompletionEvidence } from "@/integrations/tekion/timeline/task-evidence/build-task-completion-evidence";
import { buildTaskWorkflowEvidenceDetail } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-evidence-detail";
import type { TaskWorkflowEvidenceDetail } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-evidence-detail";

import {
  getTekionTimelinePath,
  tekionTaskFile,
  tekionTimelineFiles,
} from "@/lib/tekion/fixture-paths";

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
  const fullPath = getTekionTimelinePath(file);

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
    fs.readFileSync(tekionTaskFile, "utf8"),
  )
    .map(mapTaskRow)
    .filter(
      (task) =>
        task.taskTitle.trim() === normalizedTitle,
    );

  const timelines = tekionTimelineFiles.map(readTimeline);

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
