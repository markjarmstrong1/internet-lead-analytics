import { describe, expect, it } from "vitest";
import {
  buildTaskEvidenceDiagnostics,
} from "../../../../src/integrations/tekion/timeline/task-evidence/task-evidence-diagnostics";
import type {
  TaskCompletionEvidence,
} from "../../../../src/integrations/tekion/timeline/task-evidence/task-completion-evidence";

function makeEvidence(): TaskCompletionEvidence {
  return {
    taskSourceRecordId: "task-1",
    timelineSourceFile: "ana_yu.txt",
    identityStatus: "direct_match",
    completionMode: "completed_automatically",
    allowedChannels: ["email", "text"],
    unknownActionTokens: [],
    windowStatus: "bounded",
    communicationEvidenceStatus: "qualifying_outbound",
    timelineEventIds: ["event-1", "event-2"],
    communicationEventIds: ["event-1", "event-2"],
    employeeOutboundEventIds: ["event-1", "event-2"],
    allowedChannelEventIds: ["event-1"],
    mismatchedChannelEventIds: ["event-2"],
    inboundCommunicationEventIds: [],
  };
}

describe("buildTaskEvidenceDiagnostics", () => {
  it("creates a compact diagnostic record without raw customer data", () => {
    const [diagnostic] = buildTaskEvidenceDiagnostics([
      makeEvidence(),
    ]);

    expect(diagnostic).toEqual({
      taskSourceRecordId: "task-1",
      timelineSourceFile: "ana_yu.txt",
      completionMode: "completed_automatically",
      identityStatus: "direct_match",
      communicationEvidenceStatus: "qualifying_outbound",
      allowedChannels: ["email", "text"],
      communicationEventCount: 2,
      employeeOutboundEventCount: 2,
      allowedChannelEventCount: 1,
      mismatchedChannelEventCount: 1,
      inboundCommunicationEventCount: 0,
    });
  });
});
