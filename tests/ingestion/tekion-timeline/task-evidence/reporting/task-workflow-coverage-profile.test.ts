import { describe, expect, it } from "vitest";
import { buildTaskWorkflowCoverageProfile } from "../../../../../src/integrations/tekion/timeline/task-evidence/reporting/task-workflow-coverage-profile";
import type { TaskCompletionEvidence } from "../../../../../src/integrations/tekion/timeline/task-evidence/task-completion-evidence";

function evidence(
  identityStatus: TaskCompletionEvidence["identityStatus"],
): TaskCompletionEvidence {
  return {
    taskSourceRecordId: "task",
    timelineSourceFile: "timeline.txt",
    identityStatus,
    completionMode: "completed_automatically",
    allowedChannels: ["email"],
    unknownActionTokens: [],
    windowStatus: "bounded",
    communicationEvidenceStatus: "not_evaluated",
    timelineEventIds: [],
    communicationEventIds: [],
    employeeOutboundEventIds: [],
    allowedChannelEventIds: [],
    mismatchedChannelEventIds: [],
    inboundCommunicationEventIds: [],
  };
}

describe("buildTaskWorkflowCoverageProfile", () => {
  it("separates unique Task counts from comparison counts", () => {
    const result = buildTaskWorkflowCoverageProfile([
      { taskId: "a", evidence: evidence("direct_match") },
      { taskId: "a", evidence: evidence("direct_match") },
      { taskId: "b", evidence: evidence("unresolved_variant") },
      { taskId: "c", evidence: evidence("no_match") },
    ]);

    expect(result.taskCount).toBe(3);
    expect(result.comparisonCount).toBe(4);
    expect(result.directIdentityTaskCount).toBe(1);
    expect(result.unresolvedIdentityTaskCount).toBe(1);
    expect(result.noIdentityMatchTaskCount).toBe(1);
  });

  it("preserves comparison-level identity counts", () => {
    const result = buildTaskWorkflowCoverageProfile([
      { taskId: "a", evidence: evidence("direct_match") },
      { taskId: "b", evidence: evidence("direct_match") },
      { taskId: "c", evidence: evidence("unresolved_variant") },
      { taskId: "d", evidence: evidence("no_match") },
    ]);

    expect(result.directIdentityComparisonCount).toBe(2);
    expect(result.unresolvedIdentityComparisonCount).toBe(1);
    expect(result.noIdentityMatchComparisonCount).toBe(1);
  });
});
