import {
  describe,
  expect,
  it,
} from "vitest";

import {
  matchesTaskWorkflowReportFilter,
} from "../../../../../src/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report-filter";

import type {
  TaskCompletionEvidence,
} from "../../../../../src/integrations/tekion/timeline/task-evidence/task-completion-evidence";

const evidence: TaskCompletionEvidence = {
  taskSourceRecordId: "task-1",
  timelineSourceFile: "ana_yu.txt",
  identityStatus: "direct_match",
  completionMode: "completed_automatically",
  allowedChannels: ["email", "text"],
  unknownActionTokens: [],
  windowStatus: "bounded",
  communicationEvidenceStatus:
    "qualifying_outbound",
  timelineEventIds: ["event-1"],
  communicationEventIds: ["event-1"],
  employeeOutboundEventIds: ["event-1"],
  allowedChannelEventIds: ["event-1"],
  mismatchedChannelEventIds: [],
  inboundCommunicationEventIds: [],
};

describe(
  "matchesTaskWorkflowReportFilter",
  () => {
    it("matches all supplied dimensions", () => {
      expect(
        matchesTaskWorkflowReportFilter(
          "Immediate Follow Up Email",
          evidence,
          {
            taskTitles: [
              "Immediate Follow Up Email",
            ],
            completionModes: [
              "completed_automatically",
            ],
            identityStatuses: [
              "direct_match",
            ],
            communicationStatuses: [
              "qualifying_outbound",
            ],
            allowedChannels: ["email"],
            timelineSourceFiles: [
              "ana_yu.txt",
            ],
          },
        ),
      ).toBe(true);
    });

    it("uses channel overlap rather than exact array equality", () => {
      expect(
        matchesTaskWorkflowReportFilter(
          "Immediate Follow Up Email",
          evidence,
          {
            allowedChannels: ["text"],
          },
        ),
      ).toBe(true);

      expect(
        matchesTaskWorkflowReportFilter(
          "Immediate Follow Up Email",
          evidence,
          {
            allowedChannels: ["phone"],
          },
        ),
      ).toBe(false);
    });

    it("matches everything when no filters are supplied", () => {
      expect(
        matchesTaskWorkflowReportFilter(
          "Any Workflow",
          evidence,
          {},
        ),
      ).toBe(true);
    });
  },
);
