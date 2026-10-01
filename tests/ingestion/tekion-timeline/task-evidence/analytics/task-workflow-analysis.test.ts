import { describe, expect, it } from "vitest";
import { analyzeTaskWorkflows } from "../../../../../../src/integrations/tekion/timeline/task-evidence/analytics/task-workflow-analysis";
import type { TekionTaskRecord } from "../../../../../../src/integrations/tekion/csv/task-record";
import type { TaskCompletionEvidence } from "../../../../../../src/integrations/tekion/timeline/task-evidence/task-completion-evidence";

function task(
  taskTitle: string,
): TekionTaskRecord {
  return {
    taskTitle,
    dueDate: "Sep 30 2026",
    action: "Call",
    associatedWith: "Test Lead",
    assignee: "Test User",
    vehicleOfInterest: "",
    status: "Done",
    department: "Internet",
    createdBy: "Test User",
    leadSource: "Internet",
    createdDate: "Sep 29 2026",
    year: "",
    make: "",
    model: "",
    leadSourceName: "",
    manuallyClosedBy: "",
    manuallyClosedTime: "",
    leadStatus: "",
    stage: "",
    taskSource: "",
    campaignName: "",
    campaignObjective: "",
    leadSourceGroup: "",
    completedBy: "",
  };
}

function evidence(
  overrides: Partial<TaskCompletionEvidence> = {},
): TaskCompletionEvidence {
  return {
    taskSourceRecordId: "task-1",
    timelineSourceFile: "test.txt",
    identityStatus: "direct_match",
    completionMode: "completed_automatically",
    allowedChannels: ["phone"],
    unknownActionTokens: [],
    windowStatus: "bounded",
    communicationEvidenceStatus: "qualifying_outbound",
    timelineEventIds: ["event-1"],
    communicationEventIds: ["event-1"],
    employeeOutboundEventIds: ["event-1"],
    allowedChannelEventIds: ["event-1"],
    mismatchedChannelEventIds: [],
    inboundCommunicationEventIds: [],
    ...overrides,
  };
}

describe("analyzeTaskWorkflows", () => {
  it("groups comparisons by raw Task title", () => {
    const result = analyzeTaskWorkflows([
      {
        taskId: "task-1",
        task: task("Day 1 Follow Up"),
        evidence: evidence(),
      },
      {
        taskId: "task-2",
        task: task("Day 1 Follow Up"),
        evidence: evidence({
          completionMode: "dismissed",
          communicationEvidenceStatus:
            "no_communication_evidence",
        }),
      },
      {
        taskId: "task-3",
        task: task("Day 5 Follow Up"),
        evidence: evidence(),
      },
    ]);

    expect(result).toHaveLength(2);

    expect(result[0]).toMatchObject({
      taskTitle: "Day 1 Follow Up",
      taskCount: 2,
      comparisonCount: 2,
      completedAutomatically: 1,
      dismissed: 1,
      qualifyingOutboundComparisons: 1,
      noCommunicationEvidenceComparisons: 1,
    });
  });

  it("counts unique Tasks separately from comparisons", () => {
    const result = analyzeTaskWorkflows([
      {
        taskId: "task-1",
        task: task("Workflow A"),
        evidence: evidence(),
      },
      {
        taskId: "task-1",
        task: task("Workflow A"),
        evidence: evidence({
          communicationEvidenceStatus:
            "no_communication_evidence",
        }),
      },
      {
        taskId: "task-1",
        task: task("Workflow A"),
        evidence: evidence({
          identityStatus: "unresolved_variant",
        }),
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].taskCount).toBe(1);
    expect(result[0].comparisonCount).toBe(3);
    expect(result[0].directIdentityComparisons).toBe(2);
    expect(result[0].unresolvedIdentityComparisons).toBe(1);
    expect(result[0].uniqueQualifyingTaskIds).toEqual([
      "task-1",
    ]);
  });

  it("preserves evidence categories without inventing causality", () => {
    const result = analyzeTaskWorkflows([
      {
        taskId: "task-1",
        task: task("Workflow A"),
        evidence: evidence({
          communicationEvidenceStatus:
            "outbound_channel_mismatch",
        }),
      },
      {
        taskId: "task-2",
        task: task("Workflow A"),
        evidence: evidence({
          communicationEvidenceStatus: "inbound_only",
        }),
      },
      {
        taskId: "task-3",
        task: task("Workflow A"),
        evidence: evidence({
          communicationEvidenceStatus:
            "no_communication_evidence",
        }),
      },
    ]);

    expect(result[0]).toMatchObject({
      outboundChannelMismatchComparisons: 1,
      inboundOnlyComparisons: 1,
      noCommunicationEvidenceComparisons: 1,
      qualifyingOutboundComparisons: 0,
    });
  });

  it("does not merge differently titled workflows", () => {
    const result = analyzeTaskWorkflows([
      {
        taskId: "task-1",
        task: task("Day 1 Follow Up"),
        evidence: evidence(),
      },
      {
        taskId: "task-2",
        task: task("day 1 follow up"),
        evidence: evidence(),
      },
    ]);

    expect(result).toHaveLength(2);
  });
});
