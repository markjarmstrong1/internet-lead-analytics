import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildTaskWorkflowEvidenceDetail,
} from "../../../../../src/integrations/tekion/timeline/task-evidence/reporting/task-workflow-evidence-detail";

import type {
  TaskCompletionEvidence,
} from "../../../../../src/integrations/tekion/timeline/task-evidence/task-completion-evidence";

import type {
  TekionNormalizedTimelineEvent,
} from "../../../../../src/integrations/tekion/timeline/normalized-timeline-event";

const evidence: TaskCompletionEvidence = {
  taskSourceRecordId: "task-1",
  timelineSourceFile: "ana_yu.txt",
  identityStatus: "direct_match",
  completionMode: "completed_automatically",
  allowedChannels: ["email"],
  unknownActionTokens: [],
  windowStatus: "bounded",
  communicationEvidenceStatus:
    "qualifying_outbound",
  timelineEventIds: [
    "event-1",
    "missing-event",
  ],
  communicationEventIds: ["event-1"],
  employeeOutboundEventIds: ["event-1"],
  allowedChannelEventIds: ["event-1"],
  mismatchedChannelEventIds: [],
  inboundCommunicationEventIds: [],
};

const event: TekionNormalizedTimelineEvent = {
  sourceFile: "ana_yu.txt",
  rawType: "Email Sent",
  occurredAt: "2026-09-24T12:00:00.000Z",
  actor: "Mark Armstrong",
  details: "sample",
  category: "communication",
  sourceEventId: "event-1",
  communicationChannel: "email",
  communicationDirection: "outbound",
  actorType: "employee",
};

describe(
  "buildTaskWorkflowEvidenceDetail",
  () => {
    it("preserves observed and normalized evidence separately", () => {
      const result =
        buildTaskWorkflowEvidenceDetail(
          "Immediate Follow Up Email",
          evidence,
          [event],
        );

      expect(result.taskTitle).toBe(
        "Immediate Follow Up Email",
      );
      expect(
        result.evidenceKinds.sourceEvents,
      ).toBe("observed");
      expect(
        result.evidenceKinds.normalizedMeaning,
      ).toBe("normalized");
      expect(
        result.evidenceKinds.timelineEvidence,
      ).toBe("observed");
      expect(result.events).toHaveLength(1);
      expect(result.events[0].rawType).toBe(
        "Email Sent",
      );
      expect(
        result.events[0].communicationChannel,
      ).toBe("email");
    });

    it("keeps missing event references as unavailable evidence", () => {
      const result =
        buildTaskWorkflowEvidenceDetail(
          "Immediate Follow Up Email",
          {
            ...evidence,
            timelineEventIds: [],
          },
          [],
        );

      expect(
        result.evidenceKinds.timelineEvidence,
      ).toBe("unavailable");
      expect(result.events).toHaveLength(0);
      expect(
        result.timelineEventIds,
      ).toEqual([]);
    });
  },
);
