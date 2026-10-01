import { describe, expect, it } from "vitest";
import { buildTaskCompletionEvidence } from "../../../../src/integrations/tekion/timeline/task-evidence/build-task-completion-evidence";
import type { TekionTaskRecord } from "../../../../src/integrations/tekion/csv/task-record";
import type { TekionNormalizedTimelineEvent } from "../../../../src/integrations/tekion/timeline/normalized-timeline-event";
import type { TaskTimelineCorrelation } from "../../../../src/integrations/tekion/timeline/correlation/task-timeline-correlation";

function task(
  overrides: Partial<TekionTaskRecord> = {},
): TekionTaskRecord {
  return {
    taskTitle: "Follow Up",
    dueDate: "Sep 24 2026",
    action: "Call",
    associatedWith: "Test Lead",
    assignee: "Employee",
    vehicleOfInterest: "",
    status: "Done",
    department: "",
    createdBy: "System",
    leadSource: "",
    createdDate: "Sep 23 2026",
    year: "",
    make: "",
    model: "",
    leadSourceName: "",
    manuallyClosedBy: "",
    manuallyClosedTime: "",
    leadStatus: "",
    customStage: "",
    taskSource: "",
    campaignName: "",
    campaignObjective: "",
    leadSourceGroup: "",
    completedBy: "",
    ...overrides,
  };
}

function event(
  sourceEventId: string,
  channel: "phone" | "email" | "text",
  direction: "outbound" | "inbound",
  occurredAt = "2026-09-24T12:00:00.000Z",
): TekionNormalizedTimelineEvent {
  return {
    sourceFile: "test.txt",
    rawType:
      channel === "phone"
        ? "Outbound Call"
        : channel === "email"
          ? direction === "outbound"
            ? "Email Sent"
            : "Email Received"
          : direction === "outbound"
            ? "Text Sent"
            : "Text Received",
    occurredAt,
    actor: "Employee",
    details: "",
    category: "communication",
    sourceEventId,
    communicationChannel: channel,
    communicationDirection: direction,
    actorType:
      direction === "outbound"
        ? "employee"
        : "customer",
  };
}

function correlation(
  overrides: Partial<TaskTimelineCorrelation> = {},
): TaskTimelineCorrelation {
  return {
    taskSourceRecordId: "task-1",
    timelineSourceFile: "test.txt",
    status: "direct_match",
    similarity: 1,
    timelineEventIds: ["event-1"],
    ...overrides,
  };
}

describe("buildTaskCompletionEvidence", () => {
  it("recognizes an allowed outbound employee communication", () => {
    const result = buildTaskCompletionEvidence(
      {
        task: task({ action: "Call,Mail" }),
        correlation: correlation(),
      },
      [event("event-1", "phone", "outbound")],
    );

    expect(result.completionMode).toBe(
      "completed_automatically",
    );

    expect(
      result.communicationEvidenceStatus,
    ).toBe("qualifying_outbound");

    expect(result.allowedChannelEventIds).toEqual([
      "event-1",
    ]);
  });

  it("does not treat a channel mismatch as qualifying evidence", () => {
    const result = buildTaskCompletionEvidence(
      {
        task: task({ action: "Call" }),
        correlation: correlation(),
      },
      [event("event-1", "text", "outbound")],
    );

    expect(
      result.communicationEvidenceStatus,
    ).toBe("outbound_channel_mismatch");

    expect(result.mismatchedChannelEventIds).toEqual([
      "event-1",
    ]);
  });

  it("does not treat inbound communication as employee action", () => {
    const result = buildTaskCompletionEvidence(
      {
        task: task({ action: "Call" }),
        correlation: correlation(),
      },
      [event("event-1", "phone", "inbound")],
    );

    expect(
      result.communicationEvidenceStatus,
    ).toBe("inbound_only");

    expect(result.employeeOutboundEventIds).toEqual([]);

    expect(
      result.inboundCommunicationEventIds,
    ).toEqual(["event-1"]);
  });

  it("does not evaluate communication for an unfinished Task", () => {
    const result = buildTaskCompletionEvidence(
      {
        task: task({ status: "Pending" }),
        correlation: correlation(),
      },
      [event("event-1", "phone", "outbound")],
    );

    expect(result.completionMode).toBe("pending");

    expect(
      result.communicationEvidenceStatus,
    ).toBe("not_evaluated");
  });

  it("preserves manual completion separately from automatic completion", () => {
    const result = buildTaskCompletionEvidence(
      {
        task: task({
          status: "Done",
          manuallyClosedBy: "Employee",
        }),
        correlation: correlation(),
      },
      [event("event-1", "phone", "outbound")],
    );

    expect(result.completionMode).toBe(
      "completed_manually",
    );

    expect(
      result.communicationEvidenceStatus,
    ).toBe("qualifying_outbound");
  });

  it("does not attach evidence to a no-match identity", () => {
    const result = buildTaskCompletionEvidence(
      {
        task: task(),
        correlation: correlation({
          status: "no_match",
          similarity: 0,
          timelineEventIds: [],
        }),
      },
      [event("event-1", "phone", "outbound")],
    );

    expect(
      result.communicationEvidenceStatus,
    ).toBe("not_evaluated");

    expect(result.timelineEventIds).toEqual([]);
  });

  it("does not use communication outside the Task window", () => {
    const result = buildTaskCompletionEvidence(
      {
        task: task(),
        correlation: correlation(),
      },
      [
        event(
          "event-1",
          "phone",
          "outbound",
          "2026-09-25T12:00:00.000Z",
        ),
      ],
    );

    expect(
      result.communicationEvidenceStatus,
    ).toBe("no_communication_evidence");
  });
});
