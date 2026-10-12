import { describe, expect, it } from "vitest";
import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";
import {
  buildTemplateResponseAnalysis,
  DEFAULT_TEMPLATE_RESPONSE_WINDOW_MINUTES,
} from "./template-response-analysis";

function lead(
  leadId: string,
  timelineRecordIds = ["record-1"],
): AnalyticsDataset["leads"][number] {
  return {
    leadId,
    contactName: leadId,
    source: "Source A",
    sourceGroup: "Paid",
    stage: "Engage",
    status: "Active",
    creationTime: "2026-09-10T09:00:00.000Z",
    firstContactedTime: null,
    soldDate: null,
    closedTime: null,
    timelineRecordIds,
  };
}

function event(
  overrides: Partial<AnalyticsDataset["events"][number]> = {},
): AnalyticsDataset["events"][number] {
  return {
    timelineRecordId: "record-1",
    sourceEventId: "event-1",
    sourceFile: "lead.txt",
    occurredAt: "2026-09-10T10:00:00.000Z",
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

function dataset(
  leads: AnalyticsDataset["leads"],
  events: AnalyticsDataset["events"],
): AnalyticsDataset {
  return { leads, events };
}

describe("buildTemplateResponseAnalysis", () => {
  it("associates a response with the most recent outbound action before it", () => {
    const result = buildTemplateResponseAnalysis(
      dataset(
        [lead("lead-1")],
        [
          event({
            sourceEventId: "template-a",
            templateCode: "TEMPLATE_A",
          }),
          event({
            sourceEventId: "template-b",
            occurredAt: "2026-09-10T10:10:00.000Z",
            templateCode: "TEMPLATE_B",
          }),
          event({
            sourceEventId: "inbound-response",
            occurredAt: "2026-09-10T10:20:00.000Z",
            rawType: "Text Received",
            actorType: "unknown",
            direction: "inbound",
          }),
        ],
      ),
    );

    expect(result.windowMinutes).toBe(
      DEFAULT_TEMPLATE_RESPONSE_WINDOW_MINUTES,
    );
    expect(result.totalMatchedTemplateActions).toBe(2);
    expect(result.totalRespondedActions).toBe(1);
    expect(result.overallResponseRate).toBe(0.5);
    expect(result.medianResponseMinutes).toBe(10);
    expect(result.actions).toEqual([
      {
        leadId: "lead-1",
        templateCode: "TEMPLATE_A",
        outboundAt: "2026-09-10T10:00:00.000Z",
        responseAt: null,
        responseMinutes: null,
        respondedWithinWindow: false,
      },
      {
        leadId: "lead-1",
        templateCode: "TEMPLATE_B",
        outboundAt: "2026-09-10T10:10:00.000Z",
        responseAt: "2026-09-10T10:20:00.000Z",
        responseMinutes: 10,
        respondedWithinWindow: true,
      },
    ]);
    expect(result.byTemplate).toEqual([
      {
        templateCode: "TEMPLATE_A",
        actionCount: 1,
        respondedActions: 0,
        actionsWithoutResponseWithinWindow: 1,
        responseRate: 0,
        medianResponseMinutes: null,
      },
      {
        templateCode: "TEMPLATE_B",
        actionCount: 1,
        respondedActions: 1,
        actionsWithoutResponseWithinWindow: 0,
        responseRate: 1,
        medianResponseMinutes: 10,
      },
    ]);
  });

  it("does not count responses outside the configured window", () => {
    const result = buildTemplateResponseAnalysis(
      dataset(
        [lead("lead-1")],
        [
          event({ templateCode: "TEMPLATE_A" }),
          event({
            sourceEventId: "late-inbound",
            occurredAt: "2026-09-11T10:01:00.000Z",
            rawType: "Text Received",
            actorType: "unknown",
            direction: "inbound",
          }),
        ],
      ),
      24 * 60,
    );

    expect(result.totalMatchedTemplateActions).toBe(1);
    expect(result.totalRespondedActions).toBe(0);
    expect(result.overallResponseRate).toBe(0);
    expect(result.actions[0]).toMatchObject({
      templateCode: "TEMPLATE_A",
      responseAt: null,
      responseMinutes: null,
      respondedWithinWindow: false,
    });
  });

  it("returns a null rate when no canonical matched-template actions exist", () => {
    const result = buildTemplateResponseAnalysis(
      dataset([lead("lead-1")], [event()]),
    );

    expect(result.totalMatchedTemplateActions).toBe(0);
    expect(result.totalRespondedActions).toBe(0);
    expect(result.overallResponseRate).toBeNull();
    expect(result.medianResponseMinutes).toBeNull();
    expect(result.byTemplate).toEqual([]);
    expect(result.actions).toEqual([]);
  });

  it("rejects invalid response windows", () => {
    expect(() =>
      buildTemplateResponseAnalysis(dataset([], []), -1),
    ).toThrow(
      "Template response window must be a finite, non-negative number of minutes.",
    );
    expect(() =>
      buildTemplateResponseAnalysis(dataset([], []), Number.NaN),
    ).toThrow(
      "Template response window must be a finite, non-negative number of minutes.",
    );
  });
});
