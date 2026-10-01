import { describe, expect, it } from "vitest";
import { summarizeActionEvidenceForEvents } from "../../../../src/integrations/tekion/timeline/action-evidence/summarize-action-evidence";
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

describe("summarizeActionEvidenceForEvents", () => {
  it("counts qualifying employee communication evidence by channel", () => {
    const result = summarizeActionEvidenceForEvents(
      [
        event({
          rawType: "Email Sent",
          category: "communication",
          communicationChannel: "email",
          communicationDirection: "outbound",
        }),
        event({
          rawType: "Text Sent",
          category: "communication",
          communicationChannel: "text",
          communicationDirection: "outbound",
        }),
        event({
          rawType: "Outbound Call",
          category: "communication",
          communicationChannel: "phone",
          communicationDirection: "outbound",
        }),
        event({
          rawType: "Outbound Voicemail",
          category: "communication",
          communicationChannel: "voicemail",
          communicationDirection: "outbound",
        }),
      ],
      "sample.txt",
    );

    expect(result.totalEvents).toBe(4);
    expect(result.qualifyingEmployeeActions).toBe(4);
    expect(result.byChannel).toEqual({
      email: 1,
      text: 1,
      phone: 1,
      voicemail: 1,
    });
  });

  it("keeps inbound, workflow, and automation evidence separate", () => {
    const result = summarizeActionEvidenceForEvents(
      [
        event({
          rawType: "Text Received",
          category: "communication",
          communicationChannel: "text",
          communicationDirection: "inbound",
          actorType: "customer",
        }),
        event({
          rawType: "Day 5 Internet Lead Tasking - Touch",
          category: "task",
        }),
        event({
          rawType: "Conversica Message",
          category: "automation",
          actorType: "automation",
        }),
      ],
      "sample.txt",
    );

    expect(result.totalEvents).toBe(3);
    expect(result.qualifyingEmployeeActions).toBe(0);
    expect(result.inboundCommunication).toBe(1);
    expect(result.workflowEvents).toBe(1);
    expect(result.automationEvents).toBe(1);
  });

  it("does not double-count qualifying evidence", () => {
    const result = summarizeActionEvidenceForEvents(
      [
        event({
          rawType: "Email Sent",
          category: "communication",
          communicationChannel: "email",
          communicationDirection: "outbound",
        }),
        event({
          rawType: "Stage Changed",
          category: "lifecycle",
        }),
      ],
      "sample.txt",
    );

    const accountedFor =
      result.qualifyingEmployeeActions +
      result.inboundCommunication +
      result.workflowEvents +
      result.automationEvents +
      result.otherEvents;

    expect(accountedFor).toBe(result.totalEvents);
  });
});
