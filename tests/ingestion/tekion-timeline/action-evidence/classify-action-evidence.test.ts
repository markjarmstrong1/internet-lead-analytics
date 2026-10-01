import { describe, expect, it } from "vitest";
import { classifyActionEvidence } from "../../../../src/integrations/tekion/timeline/action-evidence/classify-action-evidence";
import type { TekionNormalizedTimelineEvent } from "../../../../src/integrations/tekion/timeline/normalized-timeline-event";

function event(
  overrides: Partial<TekionNormalizedTimelineEvent>,
): TekionNormalizedTimelineEvent {
  return {
    sourceFile: "sample.txt",
    sourceEventId: "tekion:test",
    rawType: "Unknown Event",
    occurredAt: "2026-09-28T19:36:00.000Z",
    actor: "Salesperson",
    details: "Example",
    category: "other",
    actorType: "employee",
    ...overrides,
  };
}

describe("classifyActionEvidence", () => {
  it("qualifies outbound employee email as action evidence", () => {
    const result = classifyActionEvidence(
      event({
        rawType: "Email Sent",
        category: "communication",
        communicationChannel: "email",
        communicationDirection: "outbound",
      }),
    );

    expect(result).toEqual({
      qualifiesAsEmployeeAction: true,
      channel: "email",
      reason: "outbound_employee_communication",
    });
  });

  it("qualifies outbound employee text as action evidence", () => {
    const result = classifyActionEvidence(
      event({
        rawType: "Text Sent",
        category: "communication",
        communicationChannel: "text",
        communicationDirection: "outbound",
      }),
    );

    expect(result).toEqual({
      qualifiesAsEmployeeAction: true,
      channel: "text",
      reason: "outbound_employee_communication",
    });
  });

  it("qualifies outbound employee calls as action evidence", () => {
    const result = classifyActionEvidence(
      event({
        rawType: "Outbound Call",
        category: "communication",
        communicationChannel: "phone",
        communicationDirection: "outbound",
      }),
    );

    expect(result).toEqual({
      qualifiesAsEmployeeAction: true,
      channel: "phone",
      reason: "outbound_employee_communication",
    });
  });

  it("qualifies outbound employee voicemail as action evidence", () => {
    const result = classifyActionEvidence(
      event({
        rawType: "Outbound Voicemail",
        category: "communication",
        communicationChannel: "voicemail",
        communicationDirection: "outbound",
      }),
    );

    expect(result).toEqual({
      qualifiesAsEmployeeAction: true,
      channel: "voicemail",
      reason: "outbound_employee_communication",
    });
  });

  it("does not treat inbound customer communication as employee action", () => {
    const result = classifyActionEvidence(
      event({
        rawType: "Text Received",
        category: "communication",
        communicationChannel: "text",
        communicationDirection: "inbound",
        actorType: "customer",
      }),
    );

    expect(result).toEqual({
      qualifiesAsEmployeeAction: false,
      channel: "text",
      reason: "inbound_customer_communication",
    });
  });

  it("does not treat unknown communication direction as action evidence", () => {
    const result = classifyActionEvidence(
      event({
        rawType: "Missed Call",
        category: "communication",
        communicationChannel: "phone",
        communicationDirection: "unknown",
      }),
    );

    expect(result).toEqual({
      qualifiesAsEmployeeAction: false,
      channel: "phone",
      reason: "unknown_communication_direction",
    });
  });

  it("does not treat automated communication as employee action", () => {
    const result = classifyActionEvidence(
      event({
        rawType: "Email Sent",
        category: "communication",
        communicationChannel: "email",
        communicationDirection: "outbound",
        actorType: "automation",
      }),
    );

    expect(result).toEqual({
      qualifiesAsEmployeeAction: false,
      channel: "email",
      reason: "unknown_communication_direction",
    });
  });

  it("does not treat tasks as completed actions", () => {
    const result = classifyActionEvidence(
      event({
        rawType: "Day 5 Internet Lead Tasking - Touch",
        category: "task",
      }),
    );

    expect(result).toEqual({
      qualifiesAsEmployeeAction: false,
      reason: "workflow_activity",
    });
  });

  it("does not treat lifecycle events as actions", () => {
    const result = classifyActionEvidence(
      event({
        rawType: "Stage Changed",
        category: "lifecycle",
      }),
    );

    expect(result).toEqual({
      qualifiesAsEmployeeAction: false,
      reason: "lifecycle_activity",
    });
  });

  it("does not treat deal events as actions", () => {
    const result = classifyActionEvidence(
      event({
        rawType: "Deal Created",
        category: "deal",
      }),
    );

    expect(result).toEqual({
      qualifiesAsEmployeeAction: false,
      reason: "deal_activity",
    });
  });

  it("does not treat automation events as employee actions", () => {
    const result = classifyActionEvidence(
      event({
        rawType: "Conversica Message",
        category: "automation",
        actorType: "automation",
      }),
    );

    expect(result).toEqual({
      qualifiesAsEmployeeAction: false,
      reason: "automation_or_system_activity",
    });
  });
});
