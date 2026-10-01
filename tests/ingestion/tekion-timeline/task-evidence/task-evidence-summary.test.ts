import { describe, expect, it } from "vitest";
import {
  summarizeTaskCompletionEvidence,
} from "../../../../src/integrations/tekion/timeline/task-evidence/task-evidence-summary";
import type {
  TaskCompletionEvidence,
} from "../../../../src/integrations/tekion/timeline/task-evidence/task-completion-evidence";

function makeEvidence(
  overrides: Partial<TaskCompletionEvidence> = {},
): TaskCompletionEvidence {
  return {
    taskSourceRecordId: "task-1",
    timelineSourceFile: "ana_yu.txt",
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

describe("summarizeTaskCompletionEvidence", () => {
  it("counts identity and completion modes", () => {
    const summary = summarizeTaskCompletionEvidence([
      makeEvidence(),
      makeEvidence({
        taskSourceRecordId: "task-2",
        identityStatus: "unresolved_variant",
        completionMode: "completed_manually",
        communicationEvidenceStatus: "not_evaluated",
        allowedChannelEventIds: [],
      }),
      makeEvidence({
        taskSourceRecordId: "task-3",
        identityStatus: "no_match",
        completionMode: "dismissed",
        communicationEvidenceStatus: "not_evaluated",
        allowedChannelEventIds: [],
      }),
    ]);

    expect(summary.totalComparisons).toBe(3);
    expect(summary.directIdentityComparisons).toBe(1);
    expect(summary.unresolvedIdentityComparisons).toBe(1);
    expect(summary.noIdentityMatchComparisons).toBe(1);

    expect(summary.completedAutomatically).toBe(1);
    expect(summary.completedManually).toBe(1);
    expect(summary.dismissed).toBe(1);
  });

  it("deduplicates qualifying task and event IDs", () => {
    const summary = summarizeTaskCompletionEvidence([
      makeEvidence(),
      makeEvidence({
        timelineSourceFile: "jim_wilson.txt",
        allowedChannelEventIds: ["event-1", "event-2"],
      }),
    ]);

    expect(summary.qualifyingOutbound).toBe(2);
    expect(summary.qualifyingTaskIds).toEqual(["task-1"]);
    expect(summary.qualifyingEventIds).toEqual([
      "event-1",
      "event-2",
    ]);
  });

  it("keeps communication outcomes separate", () => {
    const summary = summarizeTaskCompletionEvidence([
      makeEvidence({
        taskSourceRecordId: "task-1",
        communicationEvidenceStatus: "qualifying_outbound",
      }),
      makeEvidence({
        taskSourceRecordId: "task-2",
        communicationEvidenceStatus: "outbound_channel_mismatch",
        allowedChannelEventIds: [],
      }),
      makeEvidence({
        taskSourceRecordId: "task-3",
        communicationEvidenceStatus: "inbound_only",
        allowedChannelEventIds: [],
      }),
      makeEvidence({
        taskSourceRecordId: "task-4",
        communicationEvidenceStatus: "no_communication_evidence",
        allowedChannelEventIds: [],
      }),
      makeEvidence({
        taskSourceRecordId: "task-5",
        communicationEvidenceStatus: "not_evaluated",
        allowedChannelEventIds: [],
      }),
    ]);

    expect(summary.qualifyingOutbound).toBe(1);
    expect(summary.outboundChannelMismatch).toBe(1);
    expect(summary.inboundOnly).toBe(1);
    expect(summary.noCommunicationEvidence).toBe(1);
    expect(summary.notEvaluated).toBe(1);
  });
});
