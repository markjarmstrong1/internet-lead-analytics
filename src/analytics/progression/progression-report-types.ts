import type { ProgressionAnalysis, StageTransition } from "./progression-types";

export type ProgressionAssociation = {
  factor: string;
  kind: "channel" | "action" | "template";
  exposedLeadCount: number;
  progressedWithFactor: number;
  progressionRateWithFactor: number | null;
  unexposedLeadCount: number;
  progressedWithoutFactor: number;
  progressionRateWithoutFactor: number | null;
  rateDifference: number | null;
  evidenceCoverageWithFactor: number | null;
  leadIdsWithFactor: string[];
  leadIdsWithoutFactor: string[];
};

export type ProgressionReportSection = {
  title: string;
  summary: string;
  evidence: string[];
  leadIds: string[];
};

export type ProgressionManagementReport = {
  title: "What Is Moving Leads Forward?";
  generatedAt: string;
  cohortLeadCount: number;
  stageCounts: ProgressionAnalysis["funnel"];
  executiveSummary: ProgressionReportSection[];
  biggestDropoff: { transition: StageTransition | null; interpretation: string };
  strongestAssociations: ProgressionAssociation[];
  weakestAssociations: ProgressionAssociation[];
  commonPaths: Array<{ path: string[]; occurrences: number; transition: string }>;
  unresolvedQuestions: ProgressionAnalysis["unresolvedQuestions"];
  methodology: {
    qualificationRuleVersions: ProgressionAnalysis["ruleVersions"];
    associationDescription: string;
    limitations: string[];
  };
};
