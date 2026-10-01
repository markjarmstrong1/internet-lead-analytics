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
import { buildTaskWorkflowReport } from "../../../../../src/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report";

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

  return {
    file,
    identity: identityFromTimelineFile(file),
    import: importTimelineFile(
      fs.readFileSync(fullPath, "utf8"),
      file,
    ),
  };
}

describe("real Wave 7 reporting validation", () => {
  it("reconciles aggregate reporting metrics with the real evidence set", () => {
    const tasks = parseCsv(
      fs.readFileSync(taskFile, "utf8"),
    ).map(mapTaskRow);

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

    const report = buildTaskWorkflowReport(rows);

    expect(report.workflows).toHaveLength(25);
    expect(report.summary.comparisonCount).toBe(1392);

    const metric = (
      key:
        | "identity_evidence_coverage"
        | "direct_identity_rate"
        | "unresolved_identity_rate"
        | "qualifying_outbound_evidence_rate"
        | "outbound_channel_mismatch_rate"
        | "inbound_only_rate"
        | "no_communication_evidence_rate"
    ) =>
      report.summary.metrics.find(
        (item) => item.key === key,
      );

    expect(metric("identity_evidence_coverage")).toEqual({
      key: "identity_evidence_coverage",
      numerator: 21,
      denominator: 1392,
      rate: 21 / 1392,
    });

    expect(metric("direct_identity_rate")).toEqual({
      key: "direct_identity_rate",
      numerator: 18,
      denominator: 1392,
      rate: 18 / 1392,
    });

    expect(metric("unresolved_identity_rate")).toEqual({
      key: "unresolved_identity_rate",
      numerator: 3,
      denominator: 1392,
      rate: 3 / 1392,
    });

    expect(
      metric("qualifying_outbound_evidence_rate"),
    ).toEqual({
      key: "qualifying_outbound_evidence_rate",
      numerator: 7,
      denominator: 20,
      rate: 7 / 20,
    });

    expect(
      metric("outbound_channel_mismatch_rate"),
    ).toEqual({
      key: "outbound_channel_mismatch_rate",
      numerator: 6,
      denominator: 20,
      rate: 6 / 20,
    });

    expect(metric("inbound_only_rate")).toEqual({
      key: "inbound_only_rate",
      numerator: 0,
      denominator: 20,
      rate: 0,
    });

    expect(
      metric("no_communication_evidence_rate"),
    ).toEqual({
      key: "no_communication_evidence_rate",
      numerator: 7,
      denominator: 20,
      rate: 7 / 20,
    });
  });
});
