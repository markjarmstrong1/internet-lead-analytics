import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { importTimelineFile } from "../../../../src/integrations/tekion/timeline/import-timeline-file";
import { buildTaskTimelineCorrelation } from "../../../../src/integrations/tekion/timeline/correlation/build-task-timeline-correlation";
import type { TekionTaskRecord } from "../../../../src/integrations/tekion/csv/task-record";
import { mapTaskRow } from "../../../../src/integrations/tekion/csv/map-task-row";
import {
  getTekionTimelinePath,
  hasLegacyTekionTimelineFixtures,
} from "@/lib/tekion/fixture-paths";

const TIMELINE_FILES = [
  "ana_yu.txt",
  "anthony_bacon.txt",
  "jeffery_becker.txt",
  "jim_wilson.txt",
];

const TASK_FILE = join(
  process.cwd(),
  "data/tekion/tasks",
  "_CRM_TASK_LIST_48e53783-3c35-4c92-b5c0-3c9d89daaeff15226785944713350597.csv",
);

function identityFromTimelineFile(file: string): string {
  return file
    .replace(/\.txt$/i, "")
    .replace(/_/g, " ");
}

function readTasks(): TekionTaskRecord[] {
  const content = readFileSync(TASK_FILE, "utf8");

  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
  }) as Record<string, unknown>[];

  return rows.map(mapTaskRow);
}

function readTimelines() {
  return TIMELINE_FILES.map((file) => {
    const content = readFileSync(
      getTekionTimelinePath(file),
      "utf8",
    );

    const imported = importTimelineFile(content, file);

    return {
      file,
      identity: identityFromTimelineFile(file),
      events: imported.events,
    };
  });
}

describe.skipIf(!hasLegacyTekionTimelineFixtures())(
  "real Task ↔ Timeline correlation",
  () => {
  it("measures aggregate historical Task correlation coverage", () => {
    const tasks = readTasks();
    const timelines = readTimelines();

    const results = tasks.flatMap((task, taskIndex) =>
      timelines.map((timeline) =>
        buildTaskTimelineCorrelation({
          taskSourceRecordId: `task-${taskIndex}`,
          taskIdentity: task.associatedWith,
          timelineIdentity: timeline.identity,
          timelineSourceFile: timeline.file,
          timelineEvents: timeline.events,
        }),
      ),
    );

    const directMatches = results.filter(
      (result) => result.status === "direct_match",
    );

    const unresolvedVariants = results.filter(
      (result) => result.status === "unresolved_variant",
    );

    const noMatches = results.filter(
      (result) => result.status === "no_match",
    );

    const directMatchesWithEvents = directMatches.filter(
      (result) => result.timelineEventIds.length > 0,
    );

    const unresolvedVariantsWithEvents =
      unresolvedVariants.filter(
        (result) => result.timelineEventIds.length > 0,
      );

    const matchedTaskIds = new Set(
      directMatches.map(
        (result) => result.taskSourceRecordId,
      ),
    );

    const unresolvedTaskIds = new Set(
      unresolvedVariants.map(
        (result) => result.taskSourceRecordId,
      ),
    );

    const matchedTimelineEventIds = new Set(
      directMatches.flatMap(
        (result) => result.timelineEventIds,
      ),
    );

    console.log(`
Tekion Task ↔ Timeline Correlation — aggregate validation
==========================================================
Tasks: ${tasks.length}
Timeline samples: ${timelines.length}
Correlation comparisons: ${results.length}

Direct identity matches: ${directMatches.length}
Direct-match Task IDs: ${matchedTaskIds.size}
Direct matches with timeline events: ${directMatchesWithEvents.length}

Unresolved identity variants: ${unresolvedVariants.length}
Unresolved variants with timeline events: ${unresolvedVariantsWithEvents.length}
Unresolved Task IDs: ${unresolvedTaskIds.size}

No-match comparisons: ${noMatches.length}

Distinct timeline events attached to direct matches:
${matchedTimelineEventIds.size}
==========================================================
`);

    expect(tasks.length).toBe(348);
    expect(timelines.length).toBe(4);
    expect(results.length).toBe(348 * 4);

    expect(directMatches.length).toBe(18);
    expect(unresolvedVariants.length).toBe(3);

    expect(directMatchesWithEvents.length).toBe(18);
    expect(unresolvedVariantsWithEvents.length).toBe(3);

    expect(matchedTaskIds.size).toBe(18);
    expect(unresolvedTaskIds.size).toBe(3);

    expect(noMatches.length).toBe(1371);
    expect(matchedTimelineEventIds.size).toBeGreaterThan(0);
  });
});
