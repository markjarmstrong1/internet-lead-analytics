import {
  getTekionTimelinePath,
  hasLegacyTekionTimelineFixtures,
} from "@/lib/tekion/fixture-paths";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { parseCsv } from "../../../../../src/integrations/tekion/csv/parse-csv";
import { mapTaskRow } from "../../../../../src/integrations/tekion/csv/map-task-row";
import { importTimelineFile } from "../../../../../src/integrations/tekion/timeline/import-timeline-file";
import { buildTaskTimelineCorrelation } from "../../../../../src/integrations/tekion/timeline/correlation/build-task-timeline-correlation";
import { buildTaskCompletionEvidence } from "../../../../../src/integrations/tekion/timeline/task-evidence/build-task-completion-evidence";
import { analyzeTaskWorkflows } from "../../../../../src/integrations/tekion/timeline/task-evidence/analytics/task-workflow-analysis";
import { analyzeTaskWorkflowChannels } from "../../../../../src/integrations/tekion/timeline/task-evidence/analytics/task-workflow-channel-analysis";
import { profileTaskWorkflowCompletion } from "../../../../../src/integrations/tekion/timeline/task-evidence/analytics/task-workflow-completion-profile";
import { analyzeTaskWorkflowTiming } from "../../../../../src/integrations/tekion/timeline/task-evidence/analytics/task-workflow-timing-analysis";

const root = resolve(process.cwd());

const taskFile = resolve(
  root,
  "data/tekion/tasks/_CRM_TASK_LIST_48e53783-3c35-4c92-b5c0-3c9d89daaeff15226785944713350597.csv",
);

const timelineDir = resolve(root, "data/tekion/timelines");

function identityFromTimelineFile(file: string): string {
  return file
    .replace(/\.txt$/i, "")
    .replace(/_/g, " ");
}

describe.skipIf(!hasLegacyTekionTimelineFixtures())(
  "Wave 5 real-data analytics",
  () => {
  it("validates workflow, channel, completion, and timing analytics without exposing PII", () => {
    const csv = readFileSync(taskFile, "utf8");
    const rows = parseCsv(csv);
    const tasks = rows.map(mapTaskRow);

    const timelineFiles = readdirSync(timelineDir)
      .filter((file) => file.endsWith(".txt"))
      .filter((file) =>
        [
          "ana_yu.txt",
          "anthony_bacon.txt",
          "jeffery_becker.txt",
          "jim_wilson.txt",
        ].includes(file),
      )
      .sort();

    const timelines = timelineFiles.map((file) => ({
      file,
      identity: identityFromTimelineFile(file),
      import: importTimelineFile(
        readFileSync(getTekionTimelinePath(file), "utf8"),
        file,
      ),
    }));

    const inputs = [];

    for (const [taskIndex, task] of tasks.entries()) {
      for (const timeline of timelines) {
        const taskId = `historical-task-${taskIndex + 1}`;

        const correlation = buildTaskTimelineCorrelation({
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

        inputs.push({
          taskId,
          task,
          evidence,
          timelineEvents: timeline.import.events,
        });
      }
    }

    const workflowAnalysis = analyzeTaskWorkflows(
      inputs.map(({ taskId, task, evidence }) => ({
        taskId,
        task,
        evidence,
      })),
    );

    const channelAnalysis = analyzeTaskWorkflowChannels(inputs);

    const completionProfiles =
      profileTaskWorkflowCompletion(
        inputs.map(({ taskId, task, evidence }) => ({
          taskId,
          task,
          evidence,
        })),
      );

    const timingAnalysis = analyzeTaskWorkflowTiming(inputs);

    const totalQualifying = workflowAnalysis.reduce(
      (sum, item) =>
        sum + item.qualifyingOutboundComparisons,
      0,
    );

    const totalAllowedEvents = channelAnalysis.reduce(
      (sum, item) =>
        sum + item.allowedChannelEventCount,
      0,
    );

    const totalTimingEvents = timingAnalysis.reduce(
      (sum, item) =>
        sum + item.qualifyingEventCount,
      0,
    );

    console.log(`
Wave 5 — Real-Data Analytics Validation
============================================================
Tasks: ${tasks.length}
Timeline samples: ${timelines.length}
Comparisons: ${inputs.length}

Workflow groups: ${workflowAnalysis.length}
Completion profiles: ${completionProfiles.length}
Channel profiles: ${channelAnalysis.length}
Timing profiles: ${timingAnalysis.length}

Qualifying outbound comparisons: ${totalQualifying}
Allowed-channel event evidence: ${totalAllowedEvents}
Qualifying timing events: ${totalTimingEvents}
============================================================
`);

    expect(tasks).toHaveLength(348);
    expect(timelines).toHaveLength(4);
    expect(inputs).toHaveLength(1392);

    expect(workflowAnalysis).toHaveLength(25);
    expect(completionProfiles).toHaveLength(25);
    expect(channelAnalysis).toHaveLength(25);
    expect(timingAnalysis).toHaveLength(25);

    expect(totalQualifying).toBe(7);

    expect(
      workflowAnalysis.every(
        (item) =>
          item.taskCount > 0 &&
          item.comparisonCount > 0,
      ),
    ).toBe(true);

    expect(
      completionProfiles.every(
        (item) =>
          item.taskCount > 0 &&
          item.comparisonCount > 0 &&
          item.directIdentityComparisons +
            item.unresolvedIdentityComparisons +
            item.noIdentityMatchComparisons ===
            item.comparisonCount,
      ),
    ).toBe(true);

    expect(
      channelAnalysis.every(
        (item) =>
          item.taskCount > 0 &&
          item.comparisonCount > 0,
      ),
    ).toBe(true);

    expect(
      timingAnalysis.every(
        (item) =>
          item.taskCount > 0 &&
          item.qualifyingTaskCount <= item.taskCount,
      ),
    ).toBe(true);

    expect(totalAllowedEvents).toBeGreaterThanOrEqual(7);
    expect(totalTimingEvents).toBeGreaterThanOrEqual(0);
  });
});
