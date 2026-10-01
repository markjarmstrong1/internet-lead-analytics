import { getTekionTimelinePath } from "@/lib/tekion/fixture-paths";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { parseCsv } from "../../../../../src/integrations/tekion/csv/parse-csv";
import { mapTaskRow } from "../../../../../src/integrations/tekion/csv/map-task-row";
import { importTimelineFile } from "../../../../../src/integrations/tekion/timeline/import-timeline-file";
import { buildTaskTimelineCorrelation } from "../../../../../src/integrations/tekion/timeline/correlation/build-task-timeline-correlation";
import { buildTaskCompletionEvidence } from "../../../../../src/integrations/tekion/timeline/task-evidence/build-task-completion-evidence";
import { analyzeTaskWorkflows } from "../../../../../src/integrations/tekion/timeline/task-evidence/analytics/task-workflow-analysis";

const TASK_FILE = resolve(
  process.cwd(),
  "data/tekion/tasks/_CRM_TASK_LIST_48e53783-3c35-4c92-b5c0-3c9d89daaeff15226785944713350597.csv",
);

const TIMELINE_DIRECTORY = resolve(
  process.cwd(),
  "data/tekion",
);

const TIMELINE_FILES = [
  "ana_yu.txt",
  "anthony_bacon.txt",
  "jeffery_becker.txt",
  "jim_wilson.txt",
];

function identityFromTimelineFile(file: string): string {
  return file
    .replace(/\.txt$/i, "")
    .replace(/_/g, " ");
}

function readTasks() {
  return parseCsv(
    readFileSync(TASK_FILE, "utf8"),
  ).map(mapTaskRow);
}

function readTimelines() {
  return readdirSync(TIMELINE_DIRECTORY)
    .filter((file) => TIMELINE_FILES.includes(file))
    .map((file) => ({
      file,
      identity: identityFromTimelineFile(file),
      events: importTimelineFile(
        readFileSync(
          resolve(TIMELINE_DIRECTORY, file),
          "utf8",
        ),
        file,
      ).events,
    }));
}

describe("real Task workflow analysis", () => {
  it("analyzes historical Task workflows without exposing PII", () => {
    const tasks = readTasks();
    const timelines = readTimelines();

    const inputs = [];

    for (
      let taskIndex = 0;
      taskIndex < tasks.length;
      taskIndex += 1
    ) {
      const task = tasks[taskIndex];
      const taskId = `historical-task-${taskIndex + 1}`;

      for (const timeline of timelines) {
        const correlation =
          buildTaskTimelineCorrelation({
            taskSourceRecordId: taskId,
            taskIdentity: task.associatedWith,
            timelineIdentity: timeline.identity,
            timelineSourceFile: timeline.file,
            timelineEvents: timeline.events,
          });

        const evidence =
          buildTaskCompletionEvidence(
            {
              task,
              correlation,
            },
            timeline.events,
          );

        inputs.push({
          taskId,
          task,
          evidence,
        });
      }
    }

    const analyses =
      analyzeTaskWorkflows(inputs);

    const totalUniqueTasks =
      analyses.reduce(
        (sum, item) => sum + item.taskCount,
        0,
      );

    const totalComparisons =
      analyses.reduce(
        (sum, item) => sum + item.comparisonCount,
        0,
      );

    const directIdentityComparisons =
      analyses.reduce(
        (sum, item) =>
          sum + item.directIdentityComparisons,
        0,
      );

    const unresolvedIdentityComparisons =
      analyses.reduce(
        (sum, item) =>
          sum + item.unresolvedIdentityComparisons,
        0,
      );

    const qualifyingComparisons =
      analyses.reduce(
        (sum, item) =>
          sum +
          item.qualifyingOutboundComparisons,
        0,
      );

    const completedAutomatically =
      analyses.reduce(
        (sum, item) =>
          sum + item.completedAutomatically,
        0,
      );

    const completedManually =
      analyses.reduce(
        (sum, item) =>
          sum + item.completedManually,
        0,
      );

    const dismissed =
      analyses.reduce(
        (sum, item) => sum + item.dismissed,
        0,
      );

    const overdue =
      analyses.reduce(
        (sum, item) => sum + item.overdue,
        0,
      );

    const pending =
      analyses.reduce(
        (sum, item) => sum + item.pending,
        0,
      );

    console.log(`
Tekion Task Workflow Analysis — Wave 5B
============================================================
Unique Tasks: ${totalUniqueTasks}
Task workflows: ${analyses.length}
Task ↔ Timeline comparisons: ${totalComparisons}

Identity:
  Direct matches: ${directIdentityComparisons}
  Unresolved variants: ${unresolvedIdentityComparisons}
  No-match comparisons:
    ${
      totalComparisons -
      directIdentityComparisons -
      unresolvedIdentityComparisons
    }

Completion comparisons:
  Automatically completed: ${completedAutomatically}
  Manually completed: ${completedManually}
  Dismissed: ${dismissed}
  Overdue: ${overdue}
  Pending: ${pending}

Qualifying outbound comparisons:
  ${qualifyingComparisons}

------------------------------------------------------------
Workflow breakdown
------------------------------------------------------------
`);

    for (const analysis of analyses) {
      console.log(
        [
          analysis.taskTitle,
          `tasks=${analysis.taskCount}`,
          `comparisons=${analysis.comparisonCount}`,
          `direct=${analysis.directIdentityComparisons}`,
          `unresolved=${analysis.unresolvedIdentityComparisons}`,
          `auto=${analysis.completedAutomatically}`,
          `manual=${analysis.completedManually}`,
          `dismissed=${analysis.dismissed}`,
          `overdue=${analysis.overdue}`,
          `pending=${analysis.pending}`,
          `qualifying=${analysis.qualifyingOutboundComparisons}`,
          `mismatch=${analysis.outboundChannelMismatchComparisons}`,
          `inbound=${analysis.inboundOnlyComparisons}`,
          `no_evidence=${analysis.noCommunicationEvidenceComparisons}`,
        ].join(" | "),
      );
    }

    console.log(`
============================================================
`);

    expect(tasks.length).toBe(348);
    expect(timelines.length).toBe(4);

    expect(analyses.length).toBe(25);

    expect(totalUniqueTasks).toBe(348);
    expect(totalComparisons).toBe(1392);

    expect(directIdentityComparisons).toBe(18);
    expect(unresolvedIdentityComparisons).toBe(3);

    expect(
      totalComparisons -
        directIdentityComparisons -
        unresolvedIdentityComparisons,
    ).toBe(1371);

    expect(qualifyingComparisons).toBe(7);

    expect(
      analyses.every(
        (analysis) =>
          analysis.taskCount > 0 &&
          analysis.comparisonCount > 0,
      ),
    ).toBe(true);

    expect(
      analyses.every(
        (analysis) =>
          analysis.directIdentityComparisons +
            analysis.unresolvedIdentityComparisons <=
          analysis.comparisonCount,
      ),
    ).toBe(true);

    expect(
      analyses.every(
        (analysis) =>
          analysis.qualifyingOutboundComparisons +
            analysis.outboundChannelMismatchComparisons +
            analysis.inboundOnlyComparisons +
            analysis.noCommunicationEvidenceComparisons <=
          analysis.comparisonCount,
      ),
    ).toBe(true);
  });
});
