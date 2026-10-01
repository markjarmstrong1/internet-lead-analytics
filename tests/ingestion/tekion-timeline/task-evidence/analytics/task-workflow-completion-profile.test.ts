import { describe, expect, it } from "vitest";

import { profileTaskWorkflowCompletion } from "../../../../../src/integrations/tekion/timeline/task-evidence/analytics/task-workflow-completion-profile";

describe("profileTaskWorkflowCompletion", () => {
  it("separates unique Tasks from comparison counts", () => {
    const result = profileTaskWorkflowCompletion([
      {
        taskId: "task-1",
        task: { taskTitle: "Follow Up" } as never,
        evidence: {
          completionMode: "completed_automatically",
          identityStatus: "direct_match",
          communicationEvidenceStatus: "qualifying_outbound",
        } as never,
      },
      {
        taskId: "task-1",
        task: { taskTitle: "Follow Up" } as never,
        evidence: {
          completionMode: "completed_automatically",
          identityStatus: "no_match",
          communicationEvidenceStatus: "not_evaluated",
        } as never,
      },
    ]);

    expect(result[0].taskCount).toBe(1);
    expect(result[0].comparisonCount).toBe(2);
    expect(result[0].completedAutomatically).toBe(2);
  });

  it("preserves all identity states", () => {
    const result = profileTaskWorkflowCompletion([
      {
        taskId: "task-1",
        task: { taskTitle: "Follow Up" } as never,
        evidence: {
          completionMode: "dismissed",
          identityStatus: "direct_match",
          communicationEvidenceStatus: "not_evaluated",
        } as never,
      },
      {
        taskId: "task-2",
        task: { taskTitle: "Follow Up" } as never,
        evidence: {
          completionMode: "pending",
          identityStatus: "unresolved_variant",
          communicationEvidenceStatus: "not_evaluated",
        } as never,
      },
      {
        taskId: "task-3",
        task: { taskTitle: "Follow Up" } as never,
        evidence: {
          completionMode: "overdue",
          identityStatus: "no_match",
          communicationEvidenceStatus: "not_evaluated",
        } as never,
      },
    ]);

    expect(result[0].directIdentityComparisons).toBe(1);
    expect(result[0].unresolvedIdentityComparisons).toBe(1);
    expect(result[0].noIdentityMatchComparisons).toBe(1);
  });

  it("does not convert evidence into causality", () => {
    const result = profileTaskWorkflowCompletion([
      {
        taskId: "task-1",
        task: { taskTitle: "Follow Up" } as never,
        evidence: {
          completionMode: "completed_automatically",
          identityStatus: "direct_match",
          communicationEvidenceStatus: "qualifying_outbound",
        } as never,
      },
    ]);

    expect(result[0].qualifyingOutbound).toBe(1);
  });
});
