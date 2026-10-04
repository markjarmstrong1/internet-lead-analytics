import { describe, expect, it } from "vitest";

import { calculateResponseSpeedOutcomes } from "./response-speed-outcomes";
import type { TimelineAnalyticsEvent } from "../timeline/timeline-analytics-event";
import type { TimelineAnalyticsLead } from "../timeline/timeline-analytics-lead";

function event(
  overrides: Partial<TimelineAnalyticsEvent>,
): TimelineAnalyticsEvent {
  return {
    timelineRecordId: "record-1",
    sourceEventId: "event",
    sourceFile: "timeline.txt",
    occurredAt: "2026-01-01T10:00:00.000Z",
    rawType: "Text Sent",
    actor: "Employee",
    actorType: "employee",
    category: "communication",
    channel: "text",
    direction: "outbound",
    details: "Hello",
    ...overrides,
  };
}

function lead(
  overrides: Partial<TimelineAnalyticsLead>,
): TimelineAnalyticsLead {
  return {
    leadId: "lead-1",
    timelineRecordId: "record-1",
    stage: "Engage",
    ...overrides,
  };
}

describe("calculateResponseSpeedOutcomes", () => {
  it("counts appointment stage evidence by response speed", () => {
    const events = [
      event({
        occurredAt: "2026-01-01T10:00:00.000Z",
      }),
      event({
        sourceEventId: "appointment-stage",
        occurredAt: "2026-01-01T10:03:00.000Z",
        rawType: "Stage Changed",
        category: "lifecycle",
        actorType: "employee",
        channel: null,
        direction: null,
        details: "Stage got changed from Engage to Appt. Created",
      }),
      event({
        sourceEventId: "inbound",
        occurredAt: "2026-01-01T10:04:00.000Z",
        rawType: "Text Received",
        actorType: "customer",
        direction: "inbound",
        details: "Yes",
      }),
    ];

    const result = calculateResponseSpeedOutcomes(
      events,
      [lead({})],
    );

    expect(result.contactedLeads).toBe(1);
    expect(result.appointments.evidenceLeads).toBe(1);
    expect(result.appointments.buckets[0]).toEqual({
      key: "under_5m",
      label: "< 5 minutes",
      numerator: 1,
      denominator: 1,
    });
  });

  it("does not treat appointment mentions or deleted appointments as appointment evidence", () => {
    const events = [
      event({
        occurredAt: "2026-01-01T10:00:00.000Z",
      }),
      event({
        sourceEventId: "message",
        occurredAt: "2026-01-01T10:02:00.000Z",
        rawType: "Text Sent",
        details: "I can help reschedule your appointment.",
      }),
      event({
        sourceEventId: "deleted-appointment",
        occurredAt: "2026-01-01T10:03:00.000Z",
        rawType: "Stage Changed",
        category: "lifecycle",
        actorType: "employee",
        channel: null,
        direction: null,
        details:
          "Stage got changed from Engage to Appt. Created\\nThe appointment is deleted",
      }),
    ];

    const result = calculateResponseSpeedOutcomes(
      events,
      [lead({})],
    );

    expect(result.appointments.evidenceLeads).toBe(0);
  });

  it("does not treat a missing timeline as a zero-speed response", () => {
    const result = calculateResponseSpeedOutcomes(
      [],
      [
        lead({
          leadId: "sold-1",
          timelineRecordId: null,
          stage: "Sold",
        }),
      ],
    );

    expect(result.contactedLeads).toBe(0);
    expect(result.soldClosed.evidenceLeads).toBe(0);
    expect(result.soldClosedWithoutTimeline).toBe(1);
  });

  it("uses the first inbound event after initial outbound contact", () => {
    const events = [
      event({
        occurredAt: "2026-01-01T10:00:00.000Z",
      }),
      event({
        sourceEventId: "later",
        occurredAt: "2026-01-01T10:20:00.000Z",
        rawType: "Text Received",
        direction: "inbound",
        details: "Appointment?",
      }),
      event({
        sourceEventId: "earlier",
        occurredAt: "2026-01-01T10:03:00.000Z",
        rawType: "Text Received",
        direction: "inbound",
        details: "Yes",
      }),
    ];

    const result = calculateResponseSpeedOutcomes(
      events,
      [lead({})],
    );

    expect(result.respondedLeads).toBe(1);
    expect(result.overallBuckets[0].numerator).toBe(1);
  });
});
