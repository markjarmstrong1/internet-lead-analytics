import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ProgressionDashboardData } from "@/analytics/progression/progression-dashboard-types";
import {
  DropoffAnalysisCard, EvidenceCoveragePanel, JourneyPaths, ObservedAssociations,
  ProgressionFunnel, ProgressionOverview, TransitionAnalysisCard, UnresolvedQuestionsPanel,
} from "./progression-components";

const stages = ["new_lead", "engaged", "conversation", "appointment", "show", "sold"] as const;
const data: ProgressionDashboardData = {
  generatedAt: "2026-10-15T12:00:00.000Z",
  ruleVersions: [{ ruleKey: "lead-created-v1", version: 1 }],
  leadCount: 0,
  funnel: stages.map((stage, index) => ({ stage, count: 0, progressedFromPreviousCount: null, rateFromPrevious: null, eligibleCount: 0 })),
  transitions: stages.slice(0, -1).map((fromStage, index) => ({
    fromStage, toStage: stages[index + 1], eligibleLeadCount: 0, progressedLeadCount: 0, unresolvedLeadCount: 0, unresolvedLeadIds: [],
    rate: null, dropoffCount: 0, dropoffRate: null, medianMinutes: null, timedLeadCount: 0,
    commonPaths: [], channels: [], actions: [], templates: [], evidenceCoverage: null, leadIds: [], droppedLeadIds: [],
  })),
  leads: [],
  evidenceCoverage: { completeLeadCount: 0, partialLeadCount: 0, missingLeadCount: 0, unknownLeadCount: 0, coveredLeadRate: null },
  unresolvedQuestions: [],
  associations: { strongest: [], weakest: [] },
};

describe("progression dashboard components", () => {
  it("renders the overview and funnel", () => {
    expect(renderToStaticMarkup(createElement(ProgressionOverview, { data }))).toContain("Eligible leads");
    expect(renderToStaticMarkup(createElement(ProgressionFunnel, { data }))).toContain("Lead funnel");
  });
  it("renders transition and drop-off cards without fabricated rates", () => {
    expect(renderToStaticMarkup(createElement(TransitionAnalysisCard, { transition: data.transitions[0] }))).toContain("Insufficient timestamp evidence");
    expect(renderToStaticMarkup(createElement(DropoffAnalysisCard, { transitions: data.transitions }))).toContain("No eligible transitions");
  });
  it("renders association and path empty states", () => {
    expect(renderToStaticMarkup(createElement(ObservedAssociations, { data }))).toContain("No factors have at least three eligible leads");
    expect(renderToStaticMarkup(createElement(JourneyPaths, { data }))).toContain("No ordered event paths");
  });
  it("renders evidence coverage and unresolved questions", () => {
    expect(renderToStaticMarkup(createElement(EvidenceCoveragePanel, { data }))).toContain("Missing timeline");
    expect(renderToStaticMarkup(createElement(UnresolvedQuestionsPanel, { data }))).toContain("Absence of evidence");
  });
});
