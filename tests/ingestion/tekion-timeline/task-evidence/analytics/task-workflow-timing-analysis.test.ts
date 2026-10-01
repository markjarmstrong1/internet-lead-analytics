import { describe, expect, it } from "vitest";

import { analyzeTaskWorkflowTiming } from "../../../../../src/integrations/tekion/timeline/task-evidence/analytics/task-workflow-timing-analysis";

describe("analyzeTaskWorkflowTiming", () => {
  it("measures qualifying event lag from Task creation", () => {
    const result = analyzeTaskWorkflowTiming([
      {
        taskId: "task-1",
        task: {
          taskTitle: "Follow Up",
          createdDate: "2026-09-01T10:00:00Z",
        } as never,
        evidence: {
          communicationEvidenceStatus: "qualifying_outbound",
          allowedChannelEventIds: ["event-1"],
        } as never,
        timelineEvents: [
          {
            sourceEventId: "event-1",
            occurredAt: "2026-09-01T10:30:00Z",
          },
        ] as never,
      },
    ]);

    expect(result[0].qualifyingTaskCount).toBe(1);
    expect(result[0].qualifyingEventCount).toBe(1);
    expect(result[0].minimumLagMinutes).toBe(30);
    expect(result[0].maximumLagMinutes).toBe(30);
  });

  it("does not invent timing when evidence is absent", () => {
    const result = analyzeTaskWorkflowTiming([
      {
        taskId: "task-1",
        task: {
          taskTitle: "Follow Up",
          createdDate: "2026-09-01T10:00:00Z",
        } as never,
        evidence: {
          communicationEvidenceStatus: "no_communication_evidence",
          allowedChannelEventIds: [],
        } as never,
        timelineEvents: [],
      },
    ]);

    expect(result[0].qualifyingTaskCount).toBe(0);
    expect(result[0].qualifyingEventCount).toBe(0);
    expect(result[0].minimumLagMinutes).toBeUndefined();
  });

  it("does not use events occurring before Task creation", () => {
    const result = analyzeTaskWorkflowTiming([
      {
        taskId: "task-1",
        task: {
          taskTitle: "Follow Up",
          createdDate: "2026-09-01T10:00:00Z",
        } as never,
        evidence: {
          communicationEvidenceStatus: "qualifying_outbound",
          allowedChannelEventIds: ["event-1"],
        } as never,
        timelineEvents: [
          {
            sourceEventId: "event-1",
            occurredAt: "2026-09-01T09:59:00Z",
          },
        ] as never,
      },
    ]);

    expect(result[0].qualifyingTaskCount).toBe(0);
    expect(result[0].qualifyingEventCount).toBe(0);
  });
});
