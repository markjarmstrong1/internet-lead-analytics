import { describe, expect, it } from "vitest";

import { analyzeTaskWorkflowChannels } from "../../../../../src/integrations/tekion/timeline/task-evidence/analytics/task-workflow-channel-analysis";

describe("analyzeTaskWorkflowChannels", () => {
  it("groups channel analysis by raw Task title", () => {
    const result = analyzeTaskWorkflowChannels([
      {
        taskId: "task-1",
        task: {
          taskTitle: "Immediate Email",
          action: "Mail",
        } as never,
        evidence: {
          allowedChannels: ["email"],
          communicationEvidenceStatus: "qualifying_outbound",
          allowedChannelEventIds: ["event-1"],
          mismatchedChannelEventIds: [],
          employeeOutboundEventIds: ["event-1"],
        } as never,
        timelineEvents: [
          {
            sourceEventId: "event-1",
            communicationChannel: "email",
          },
        ] as never,
      },
      {
        taskId: "task-2",
        task: {
          taskTitle: "Immediate Email",
          action: "Mail",
        } as never,
        evidence: {
          allowedChannels: ["email"],
          communicationEvidenceStatus: "no_communication_evidence",
          allowedChannelEventIds: [],
          mismatchedChannelEventIds: [],
          employeeOutboundEventIds: [],
        } as never,
        timelineEvents: [],
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].taskTitle).toBe("Immediate Email");
    expect(result[0].taskCount).toBe(2);
    expect(result[0].comparisonCount).toBe(2);
    expect(result[0].allowedEmailComparisons).toBe(2);
  });

  it("counts observed outbound channels from timeline evidence", () => {
    const result = analyzeTaskWorkflowChannels([
      {
        taskId: "task-1",
        task: { taskTitle: "Touch" } as never,
        evidence: {
          allowedChannels: ["email", "text"],
          communicationEvidenceStatus: "qualifying_outbound",
          allowedChannelEventIds: ["email-1", "text-1"],
          mismatchedChannelEventIds: [],
          employeeOutboundEventIds: [
            "email-1",
            "text-1",
          ],
        } as never,
        timelineEvents: [
          {
            sourceEventId: "email-1",
            communicationChannel: "email",
          },
          {
            sourceEventId: "text-1",
            communicationChannel: "text",
          },
        ] as never,
      },
    ]);

    expect(result[0].observedEmailOutboundEvents).toBe(1);
    expect(result[0].observedTextOutboundEvents).toBe(1);
    expect(result[0].allowedChannelEventCount).toBe(2);
  });

  it("does not invent channel evidence", () => {
    const result = analyzeTaskWorkflowChannels([
      {
        taskId: "task-1",
        task: { taskTitle: "Call" } as never,
        evidence: {
          allowedChannels: ["phone"],
          communicationEvidenceStatus: "not_evaluated",
          allowedChannelEventIds: [],
          mismatchedChannelEventIds: [],
          employeeOutboundEventIds: [],
        } as never,
        timelineEvents: [],
      },
    ]);

    expect(result[0].observedPhoneOutboundEvents).toBe(0);
    expect(result[0].allowedChannelEventCount).toBe(0);
  });
});
