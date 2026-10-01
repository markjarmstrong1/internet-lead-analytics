import { getTekionTimelinePath } from "@/lib/tekion/fixture-paths";
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

import { parseCsv } from "../../../../../src/integrations/tekion/csv/parse-csv";
import { mapTaskRow } from "../../../../../src/integrations/tekion/csv/map-task-row";
import { createTaskRecordId } from "../../../../../src/integrations/tekion/import/create-task-record-id";
import { importTimelineFile } from "../../../../../src/integrations/tekion/timeline/import-timeline-file";
import { buildTaskTimelineCorrelation } from "../../../../../src/integrations/tekion/timeline/correlation/build-task-timeline-correlation";
import { buildTaskCompletionEvidence } from "../../../../../src/integrations/tekion/timeline/task-evidence/build-task-completion-evidence";
import { buildTaskWorkflowCoverageProfile } from "../../../../../src/integrations/tekion/timeline/task-evidence/reporting/task-workflow-coverage-profile";
import { buildTaskWorkflowChannelProfile } from "../../../../../src/integrations/tekion/timeline/task-evidence/reporting/task-workflow-channel-profile";
import { buildTaskWorkflowReportRow } from "../../../../../src/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report-row";

const projectRoot = path.resolve(
  import.meta.dirname,
  "../../../../../",
);

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

function identityFromTimelineFile(file: string): string {
  return file
    .replace(/\.txt$/i, "")
    .replace(/_/g, " ");
}

function readTimeline(file: string) {
  const fullPath = getTekionTimelinePath(file);

  const content = fs.readFileSync(fullPath, "utf8");

  return {
    file,
    identity: identityFromTimelineFile(file),
    import: importTimelineFile(content, file),
  };
}

describe("real Wave 6D reporting validation", () => {
  it("reconciles reporting output with the real Wave 5 evidence set", () => {
    const csv = fs.readFileSync(taskFile, "utf8");

    const tasks = parseCsv(csv).map(mapTaskRow);
    const timelines = timelineFiles.map(readTimeline);

    expect(tasks).toHaveLength(348);
    expect(timelines).toHaveLength(4);

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

        const title = task.taskTitle.trim();

        const existing = inputsByTitle.get(title);

        const item = {
          taskId,
          evidence,
        };

        if (existing) {
          existing.push(item);
        } else {
          inputsByTitle.set(title, [item]);
        }
      }
    }

    const comparisonCount = [
      ...inputsByTitle.values(),
    ].reduce(
      (total, inputs) => total + inputs.length,
      0,
    );

    expect(comparisonCount).toBe(1392);

    const reportRows = [...inputsByTitle.entries()]
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

    expect(reportRows).toHaveLength(25);

    expect(
      new Set(reportRows.map((row) => row.taskTitle)).size,
    ).toBe(25);

    expect(
      reportRows.reduce(
        (total, row) => total + row.taskCount,
        0,
      ),
    ).toBe(348);

    expect(
      reportRows.reduce(
        (total, row) => total + row.comparisonCount,
        0,
      ),
    ).toBe(1392);

    const directIdentityComparisons =
      reportRows.reduce(
        (total, row) =>
          total + row.directIdentityComparisonCount,
        0,
      );

    const unresolvedIdentityComparisons =
      reportRows.reduce(
        (total, row) =>
          total + row.unresolvedIdentityComparisonCount,
        0,
      );

    const noIdentityMatchComparisons =
      reportRows.reduce(
        (total, row) =>
          total + row.noIdentityMatchComparisonCount,
        0,
      );

    expect(directIdentityComparisons).toBe(18);
    expect(unresolvedIdentityComparisons).toBe(3);
    expect(noIdentityMatchComparisons).toBe(1371);

    expect(
      directIdentityComparisons +
        unresolvedIdentityComparisons +
        noIdentityMatchComparisons,
    ).toBe(1392);

    const qualifyingOutboundComparisons =
      reportRows.reduce(
        (total, row) =>
          total + row.qualifyingOutboundComparisonCount,
        0,
      );

    expect(qualifyingOutboundComparisons).toBe(7);

    const allowedChannelEvents =
      reportRows.reduce(
        (total, row) =>
          total + row.allowedChannelEventCount,
        0,
      );

    expect(allowedChannelEvents).toBeGreaterThanOrEqual(7);

    for (const row of reportRows) {
      expect(row.taskTitle.length).toBeGreaterThan(0);
      expect(row.taskCount).toBeGreaterThan(0);
      expect(row.comparisonCount).toBeGreaterThan(0);

      expect(
        row.directIdentityComparisonCount +
          row.unresolvedIdentityComparisonCount +
          row.noIdentityMatchComparisonCount,
      ).toBe(row.comparisonCount);

      expect(
        row.directIdentityTaskCount,
      ).toBeLessThanOrEqual(row.taskCount);

      expect(
        row.unresolvedIdentityTaskCount,
      ).toBeLessThanOrEqual(row.taskCount);

      expect(
        row.noIdentityMatchTaskCount,
      ).toBeLessThanOrEqual(row.taskCount);

      expect(
        row.allowedChannelEventCount,
      ).toBeGreaterThanOrEqual(0);

      expect(
        row.mismatchedChannelEventCount,
      ).toBeGreaterThanOrEqual(0);

      expect(
        row.qualifyingOutboundComparisonCount,
      ).toBeGreaterThanOrEqual(0);

      expect(
        row.uniqueQualifyingTaskCount,
      ).toBeGreaterThanOrEqual(0);

      expect(
        row.uniqueQualifyingEventCount,
      ).toBeGreaterThanOrEqual(0);
    }
  });
});
