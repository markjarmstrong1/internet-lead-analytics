import { describe, expect, it } from "vitest";
import type { ProgressionAnalysis } from "./progression-types";
import { buildProgressionReport } from "./build-progression-report";

const analysis: ProgressionAnalysis = {
  generatedAt: "2026-10-15T12:00:00.000Z", leadCount: 2,
  ruleVersions: [{ ruleKey: "lead-created-v1", version: 1 }],
  funnel: [
    { stage: "new_lead", count: 2, rateFromPrevious: null, eligibleCount: 2 },
    { stage: "engaged", count: 1, rateFromPrevious: 0.5, eligibleCount: 2 },
    { stage: "conversation", count: 1, rateFromPrevious: 1, eligibleCount: 1 },
    { stage: "appointment", count: 0, rateFromPrevious: 0, eligibleCount: 1 },
    { stage: "show", count: 0, rateFromPrevious: null, eligibleCount: 0 },
    { stage: "sold", count: 0, rateFromPrevious: null, eligibleCount: 0 },
  ],
  transitions: [
    { fromStage: "new_lead", toStage: "engaged", eligibleLeadCount: 2, progressedLeadCount: 1, rate: 0.5, dropoffCount: 1, dropoffRate: 0.5, medianMinutes: 10, timedLeadCount: 1, commonPaths: [], channels: [{ channel: "text", occurrences: 1 }], actions: [{ action: "Text sent", occurrences: 1 }], templates: [], evidenceCoverage: 1, leadIds: ["a"], droppedLeadIds: ["b"] },
    { fromStage: "engaged", toStage: "conversation", eligibleLeadCount: 1, progressedLeadCount: 1, rate: 1, dropoffCount: 0, dropoffRate: 0, medianMinutes: 5, timedLeadCount: 1, commonPaths: [], channels: [], actions: [], templates: [], evidenceCoverage: 1, leadIds: ["a"], droppedLeadIds: [] },
    { fromStage: "conversation", toStage: "appointment", eligibleLeadCount: 1, progressedLeadCount: 0, rate: 0, dropoffCount: 1, dropoffRate: 1, medianMinutes: null, timedLeadCount: 0, commonPaths: [], channels: [], actions: [], templates: [], evidenceCoverage: 1, leadIds: [], droppedLeadIds: ["a"] },
    { fromStage: "appointment", toStage: "show", eligibleLeadCount: 0, progressedLeadCount: 0, rate: null, dropoffCount: 0, dropoffRate: null, medianMinutes: null, timedLeadCount: 0, commonPaths: [], channels: [], actions: [], templates: [], evidenceCoverage: null, leadIds: [], droppedLeadIds: [] },
    { fromStage: "show", toStage: "sold", eligibleLeadCount: 0, progressedLeadCount: 0, rate: null, dropoffCount: 0, dropoffRate: null, medianMinutes: null, timedLeadCount: 0, commonPaths: [], channels: [], actions: [], templates: [], evidenceCoverage: null, leadIds: [], droppedLeadIds: [] },
  ],
  leads: [], evidenceCoverage: { completeLeadCount: 0, partialLeadCount: 1, missingLeadCount: 1, unknownLeadCount: 0, coveredLeadRate: 0.5 },
  unresolvedQuestions: [{ code: "missing_timeline", label: "Leads have no linked timeline records", leadCount: 1, leadIds: ["b"] }],
};

describe("buildProgressionReport", () => {
  it("builds the required management report sections", () => {
    const report = buildProgressionReport(analysis);
    expect(report.title).toBe("What Is Moving Leads Forward?");
    expect(report.executiveSummary.map((section) => section.title)).toEqual([
      "Executive Summary", "Biggest Drop-off", "Strongest Associations", "Weakest Associations", "Common Paths", "Unresolved Questions", "Recommended Management Investigations",
    ]);
    expect(report.biggestDropoff.transition).not.toBeNull();
    expect(report.methodology.limitations.some((item) => item.includes("causal"))).toBe(true);
  });
  it("does not invent associations when exposed and unexposed groups are too small", () => {
    const report = buildProgressionReport(analysis);
    expect(report.strongestAssociations).toHaveLength(0);
  });
});
