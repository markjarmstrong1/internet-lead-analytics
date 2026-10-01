import { describe, expect, it } from "vitest";
import { buildTaskWorkflowChannelProfile } from "../../../../../src/integrations/tekion/timeline/task-evidence/reporting/task-workflow-channel-profile";
import type { TaskCompletionEvidence } from "../../../../../src/integrations/tekion/timeline/task-evidence/task-completion-evidence";

function evidence(
  status: TaskCompletionEvidence["communicationEvidenceStatus"],
  allowed: string[],
  mismatched: string[] = [],
): TaskCompletionEvidence {
  return {
    taskSourceRecordId: "task",
    timelineSourceFile: "timeline.txt",
    identityStatus: "direct_match",
    completionMode: "completed_automatically",
    allowedChannels: ["email"],
    unknownActionTokens: [],
    windowStatus: "bounded",
    communicationEvidenceStatus: status,
    timelineEventIds: [],
    communicationEventIds: [],
    employeeOutboundEventIds: [],
    allowedChannelEventIds: allowed,
    mismatchedChannelEventIds: mismatched,
    inboundCommunicationEventIds: [],
  };
}

describe("buildTaskWorkflowChannelProfile", () => {
  it("counts qualifying tasks and events uniquely", () => {
    const result = buildTaskWorkflowChannelProfile([
      {
        taskId: "a",
        evidence: evidence("qualifying_outbound", ["event-1"]),
      },
      {
        taskId: "a",
        evidence: evidence("qualifying_outbound", ["event-1"]),
      },
      {
        taskId: "b",
        evidence: evidence("qualifying_outbound", ["event-2"]),
      },
    ]);

    expect(result.qualifyingOutboundComparisonCount).toBe(3);
    expect(result.uniqueQualifyingTaskCount).toBe(2);
    expect(result.uniqueQualifyingEventCount).toBe(2);
  });

  it("keeps mismatched, inbound, and no-evidence states separate", () => {
    const result = buildTaskWorkflowChannelProfile([
      {
        taskId: "a",
        evidence: evidence(
          "outbound_channel_mismatch",
          [],
          ["event-1"],
        ),
      },
      {
        taskId: "b",
        evidence: evidence("inbound_only", []),
      },
      {
        taskId: "c",
        evidence: evidence("no_communication_evidence", []),
      },
    ]);

    expect(result.mismatchedChannelEventCount).toBe(1);
    expect(result.outboundChannelMismatchComparisonCount).toBe(1);
    expect(result.inboundOnlyComparisonCount).toBe(1);
    expect(result.noCommunicationEvidenceComparisonCount).toBe(1);
  });
});
