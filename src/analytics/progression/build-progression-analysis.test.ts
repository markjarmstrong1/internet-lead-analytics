import { describe, expect, it } from "vitest";
import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";
import { buildProgressionAnalysis } from "./build-progression-analysis";

const dataset: AnalyticsDataset = {
  leads: [{
    leadId: "lead-1", contactName: "Test Lead", source: "Website", sourceGroup: "Digital", stage: "Sold", status: "Sold",
    creationTime: "2026-01-01T10:00:00.000Z", firstContactedTime: null, soldDate: "2026-01-02T11:00:00.000Z",
    closedTime: null, timelineRecordIds: ["record-1"],
  }],
  events: [
    { timelineRecordId: "record-1", sourceEventId: "event-1", sourceFile: "timeline.csv", occurredAt: "2026-01-01T10:10:00.000Z", rawType: "Text Message", actor: "Customer", actorType: "customer", category: "communication", channel: "text", direction: "inbound", details: "Customer replied" },
    { timelineRecordId: "record-1", sourceEventId: "event-2", sourceFile: "timeline.csv", occurredAt: "2026-01-01T11:00:00.000Z", rawType: "Stage Changed", actor: "System", actorType: "system", category: "lifecycle", channel: null, direction: null, details: "Appt. Created" },
    { timelineRecordId: "record-1", sourceEventId: "event-3", sourceFile: "timeline.csv", occurredAt: "2026-01-02T10:00:00.000Z", rawType: "Deal Sold", actor: "System", actorType: "system", category: "lifecycle", channel: null, direction: null, details: "Deal sold" },
  ],
};
describe("buildProgressionAnalysis", () => {
  it("qualifies only stages with explicit supporting evidence", () => {
    const result = buildProgressionAnalysis(dataset);
    const entries = result.leads[0].entries;
    expect(entries.find((item) => item.stage === "new_lead")?.status).toBe("qualified");
    expect(entries.find((item) => item.stage === "engaged")?.status).toBe("qualified");
    expect(entries.find((item) => item.stage === "conversation")?.status).toBe("not_qualified");
    expect(entries.find((item) => item.stage === "appointment")?.status).toBe("qualified");
    expect(entries.find((item) => item.stage === "show")?.status).toBe("not_qualified");
    expect(entries.find((item) => item.stage === "sold")?.status).toBe("qualified");
  });
  it("does not count a sale without explicit sale evidence", () => {
    const withoutSale = { ...dataset, leads: [{ ...dataset.leads[0], soldDate: null, closedTime: "2026-01-02T11:00:00.000Z", stage: "Closed" }], events: dataset.events.filter((event) => event.rawType !== "Deal Sold") };
    expect(buildProgressionAnalysis(withoutSale).funnel.find((stage) => stage.stage === "sold")?.count).toBe(0);
  });
  it("distinguishes missing timeline evidence from zero progression", () => {
    const missing = { ...dataset, leads: [{ ...dataset.leads[0], timelineRecordIds: [] }], events: [] };
    const result = buildProgressionAnalysis(missing);
    expect(result.leads[0].evidenceCoverage.status).toBe("missing");
    expect(result.unresolvedQuestions.find((item) => item.code === "missing_timeline")?.leadCount).toBe(1);
    expect(result.transitions[0].eligibleLeadCount).toBe(0);
    expect(result.transitions[0].unresolvedLeadCount).toBe(1);
  });
  it("calculates rates using eligible prior-stage leads", () => {
    const result = buildProgressionAnalysis(dataset);
    expect(result.transitions[0].eligibleLeadCount).toBe(1);
    expect(result.transitions[0].progressedLeadCount).toBe(1);
    expect(result.transitions[0].rate).toBe(1);
  });
});
