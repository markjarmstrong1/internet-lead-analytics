import { describe, expect, it } from "vitest";
import { buildTaskWorkflowReportRow } from "../../../../../src/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report-row";

describe("buildTaskWorkflowReportRow", () => {
  it("combines coverage and channel evidence without interpretation", () => {
    const result = buildTaskWorkflowReportRow(
      "Day 5 Internet Lead Tasking - Touch",
      {
        taskCount: 37,
        comparisonCount: 148,
        directIdentityTaskCount: 2,
        unresolvedIdentityTaskCount: 0,
        noIdentityMatchTaskCount: 35,
        directIdentityComparisonCount: 2,
        unresolvedIdentityComparisonCount: 0,
        noIdentityMatchComparisonCount: 146,
      },
      {
        allowedChannelEventCount: 3,
        mismatchedChannelEventCount: 1,
        qualifyingOutboundComparisonCount: 1,
        outboundChannelMismatchComparisonCount: 1,
        inboundOnlyComparisonCount: 0,
        noCommunicationEvidenceComparisonCount: 2,
        uniqueQualifyingTaskCount: 1,
        uniqueQualifyingEventCount: 2,
      },
    );

    expect(result.taskTitle).toBe(
      "Day 5 Internet Lead Tasking - Touch",
    );
    expect(result.taskCount).toBe(37);
    expect(result.comparisonCount).toBe(148);
    expect(result.directIdentityTaskCount).toBe(2);
    expect(result.allowedChannelEventCount).toBe(3);
    expect(result.qualifyingOutboundComparisonCount).toBe(1);
  });
});
