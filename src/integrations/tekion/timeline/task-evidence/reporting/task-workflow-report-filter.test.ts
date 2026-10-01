import { describe, expect, it } from "vitest";
import {
  matchesTaskWorkflowReportFilter,
  type TaskWorkflowReportFilterEvidence,
} from "./task-workflow-report-filter";

const evidence: TaskWorkflowReportFilterEvidence = {
  completionMode: "completed_automatically",
  identityStatus: "direct_match",
  communicationEvidenceStatus: "qualifying_outbound",
  allowedChannels: ["email"],
  timelineSourceFile: "ana_yu.txt",
};

describe("matchesTaskWorkflowReportFilter", () => {
  it("matches an evidence item against exact filters", () => {
    expect(
      matchesTaskWorkflowReportFilter(
        "Day 1 Internet Lead Tasking - Call",
        evidence,
        {
          completionModes: ["completed_automatically"],
          identityStatuses: ["direct_match"],
          communicationStatuses: ["qualifying_outbound"],
          allowedChannels: ["email"],
          timelineSourceFiles: ["ana_yu.txt"],
        },
      ),
    ).toBe(true);
  });

  it("requires all selected filter dimensions to match", () => {
    expect(
      matchesTaskWorkflowReportFilter(
        "Day 1 Internet Lead Tasking - Call",
        evidence,
        {
          identityStatuses: ["unresolved_variant"],
        },
      ),
    ).toBe(false);
  });

  it("uses channel overlap for allowed channels", () => {
    expect(
      matchesTaskWorkflowReportFilter(
        "Day 1 Internet Lead Tasking - Call",
        evidence,
        {
          allowedChannels: ["phone", "email"],
        },
      ),
    ).toBe(true);
  });
});
