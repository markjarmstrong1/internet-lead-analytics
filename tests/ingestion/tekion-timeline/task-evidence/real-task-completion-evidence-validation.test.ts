import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCsv } from "../../../../src/integrations/tekion/csv/parse-csv";
import { mapTaskRow } from "../../../../src/integrations/tekion/csv/map-task-row";
import { importTimelineFile } from "../../../../src/integrations/tekion/timeline/import-timeline-file";
import { buildTaskTimelineCorrelation } from "../../../../src/integrations/tekion/timeline/correlation/build-task-timeline-correlation";
import { buildTaskCompletionEvidence } from "../../../../src/integrations/tekion/timeline/task-evidence/build-task-completion-evidence";
import {
import { getTekionTimelinePath } from "@/lib/tekion/fixture-paths";
  summarizeTaskCompletionEvidence,
} from "../../../../src/integrations/tekion/timeline/task-evidence/task-evidence-summary";

const TASK_FILE = resolve(
  process.cwd(),
  "data/tekion/tasks/_CRM_TASK_LIST_48e53783-3c35-4c92-b5c0-3c9d89daaeff15226785944713350597.csv",
);

const TIMELINE_DIRECTORY = resolve(
  process.cwd(),
  "data/tekion",
);

function identityFromTimelineFile(file: string): string {
  return file
    .replace(/\.txt$/i, "")
    .replace(/_/g, " ");
}

function readTasks() {
  const content = readFileSync(TASK_FILE, "utf8");

  return parseCsv(content).map(mapTaskRow);
}

function readTimelines() {
  return readdirSync(TIMELINE_DIRECTORY)
    .filter((file) => file.endsWith(".txt"))
    .filter((file) =>
      [
        "ana_yu.txt",
        "anthony_bacon.txt",
        "jeffery_becker.txt",
        "jim_wilson.txt",
      ].includes(file),
    )
    .map((file) => {
      const content = readFileSync(
        resolve(TIMELINE_DIRECTORY, file),
        "utf8",
      );

      return {
        file,
        identity: identityFromTimelineFile(file),
        events: importTimelineFile(
          content,
          file,
        ).events,
      };
    });
}

function qualifyingEvidenceCount(
  results: Array<{
    communicationEvidenceStatus: string;
  }>,
): number {
  return results.filter(
    (result) =>
      result.communicationEvidenceStatus ===
      "qualifying_outbound",
  ).length;
}

describe("real Task ↔ Timeline completion evidence", () => {
  it("measures aggregate historical completion evidence without exposing PII", () => {
    const tasks = readTasks();
    const timelines = readTimelines();

    const results = [];

    for (
      let taskIndex = 0;
      taskIndex < tasks.length;
      taskIndex += 1
    ) {
      const task = tasks[taskIndex];

      for (const timeline of timelines) {
        const correlation =
          buildTaskTimelineCorrelation({
            taskSourceRecordId:
              `historical-task-${taskIndex + 1}`,
            taskIdentity: task.associatedWith,
            timelineIdentity: timeline.identity,
            timelineSourceFile: timeline.file,
            timelineEvents: timeline.events,
          });

        results.push(
          buildTaskCompletionEvidence(
            {
              task,
              correlation,
            },
            timeline.events,
          ),
        );
      }
    }

    const summary =
      summarizeTaskCompletionEvidence(results);

    const completedAutomatically = results.filter(
      (result) =>
        result.completionMode ===
        "completed_automatically",
    );

    const completedManually = results.filter(
      (result) =>
        result.completionMode ===
        "completed_manually",
    );

    const automaticallyCompletedWithEvidence =
      completedAutomatically.filter(
        (result) =>
          result.communicationEvidenceStatus ===
          "qualifying_outbound",
      );

    const manuallyCompletedWithEvidence =
      completedManually.filter(
        (result) =>
          result.communicationEvidenceStatus ===
          "qualifying_outbound",
      );

    const directMatchesWithEvidence =
      results.filter(
        (result) =>
          result.identityStatus ===
            "direct_match" &&
          result.communicationEvidenceStatus ===
            "qualifying_outbound",
      );

    const directMatchesWithoutEvidence =
      results.filter(
        (result) =>
          result.identityStatus ===
            "direct_match" &&
          result.communicationEvidenceStatus !==
            "qualifying_outbound",
      );

    const directMatchEvidenceStatuses =
      directMatchesWithEvidence.map(
        (result) =>
          result.communicationEvidenceStatus,
      );

    const distinctQualifyingTaskIds =
      new Set(summary.qualifyingTaskIds);

    const distinctQualifyingEventIds =
      new Set(summary.qualifyingEventIds);

    console.log(`
Tekion Task ↔ Timeline Completion Evidence — Wave 4B
======================================================
Tasks: ${tasks.length}
Timeline samples: ${timelines.length}
Correlation/evidence comparisons:
  ${summary.totalComparisons}

Identity:
  Direct matches:
    ${summary.directIdentityComparisons}
  Unresolved variants:
    ${summary.unresolvedIdentityComparisons}
  No match:
    ${summary.noIdentityMatchComparisons}

Completion:
  Automatically completed:
    ${summary.completedAutomatically}
  Manually completed:
    ${summary.completedManually}
  Dismissed:
    ${summary.dismissed}
  Overdue:
    ${summary.overdue}
  Pending:
    ${summary.pending}
  Unknown:
    ${summary.unknownCompletionMode}

Communication evidence:
  Qualifying outbound:
    ${summary.qualifyingOutbound}
  Outbound channel mismatch:
    ${summary.outboundChannelMismatch}
  Inbound only:
    ${summary.inboundOnly}
  No communication evidence:
    ${summary.noCommunicationEvidence}
  Window unavailable:
    ${summary.windowUnavailable}
  Window invalid:
    ${summary.windowInvalid}
  Not evaluated:
    ${summary.notEvaluated}

Cross-tab:
  Automatically completed + qualifying evidence:
    ${automaticallyCompletedWithEvidence.length}
  Manually completed + qualifying evidence:
    ${manuallyCompletedWithEvidence.length}
  Direct identity + qualifying evidence:
    ${directMatchesWithEvidence.length}
  Direct identity + other outcome:
    ${directMatchesWithoutEvidence.length}

Unique evidence:
  Tasks with qualifying evidence:
    ${distinctQualifyingTaskIds.size}
  Timeline events supporting qualifying evidence:
    ${distinctQualifyingEventIds.size}

Direct-match qualifying evidence statuses:
${JSON.stringify(directMatchEvidenceStatuses, null, 2)}
======================================================
`);

    expect(summary.totalComparisons).toBe(1392);
    expect(summary.directIdentityComparisons).toBe(18);
    expect(summary.unresolvedIdentityComparisons).toBe(3);
    expect(summary.noIdentityMatchComparisons).toBe(1371);

    expect(summary.qualifyingOutbound).toBe(
      qualifyingEvidenceCount(results),
    );

    expect(
      summary.qualifyingTaskIds.length,
    ).toBe(distinctQualifyingTaskIds.size);

    expect(
      summary.qualifyingEventIds.length,
    ).toBe(distinctQualifyingEventIds.size);

    expect(
      automaticallyCompletedWithEvidence.every(
        (result) =>
          result.completionMode ===
          "completed_automatically" &&
          result.communicationEvidenceStatus ===
          "qualifying_outbound",
      ),
    ).toBe(true);

    expect(
      manuallyCompletedWithEvidence.every(
        (result) =>
          result.completionMode ===
          "completed_manually" &&
          result.communicationEvidenceStatus ===
          "qualifying_outbound",
      ),
    ).toBe(true);

    expect(tasks.length).toBe(348);
    expect(timelines.length).toBe(4);
    expect(results.length).toBe(1392);

    expect(
      results.every(
        (result) =>
          result.timelineEventIds.every(
            (eventId) => eventId.length > 0,
          ),
      ),
    ).toBe(true);

    expect(
      results.every(
        (result) =>
          result.allowedChannelEventIds.every(
            (eventId) =>
              result.employeeOutboundEventIds.includes(
                eventId,
              ),
          ),
      ),
    ).toBe(true);
  });
});
