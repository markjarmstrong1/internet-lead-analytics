import type { AnalyticsLead } from "@/analytics/data/analytics-repository";
import type { AnalyticsEvent } from "@/analytics/data/analytics-types";

export const PROGRESSION_STAGES = ["new_lead", "engaged", "conversation", "appointment", "show", "sold"] as const;
export type ProgressionStage = (typeof PROGRESSION_STAGES)[number];
export type EvidenceClassification = "observed" | "inferred" | "calculated";
export type EvidenceCoverageStatus = "complete" | "partial" | "missing" | "unknown";

export type ProgressionRule = {
  ruleKey: string; stage: ProgressionStage; version: number; label: string; description: string;
  qualificationBasis: "source_record" | "observed_event" | "source_outcome"; isActive: boolean;
};
export type StageEvidence = {
  classification: "observed" | "inferred"; basis: string; eventIds: string[];
  timelineRecordIds: string[]; sourceFiles: string[]; summary: string;
};
export type StageEntry = {
  leadId: string; stage: ProgressionStage; enteredAt: string | null;
  status: "qualified" | "not_qualified" | "unresolved"; ruleKey: string; ruleVersion: number; evidence: StageEvidence[];
};
export type LeadProgression = {
  lead: AnalyticsLead; entries: StageEntry[]; events: AnalyticsEvent[];
  evidenceCoverage: { status: EvidenceCoverageStatus; eventCount: number; timelineRecordCount: number; stagesWithEvidence: number; totalStages: number; unresolvedStages: ProgressionStage[] };
};
export type StageTransition = {
  fromStage: ProgressionStage; toStage: ProgressionStage; eligibleLeadCount: number; progressedLeadCount: number; unresolvedLeadCount: number; unresolvedLeadIds: string[];
  rate: number | null; dropoffCount: number; dropoffRate: number | null; medianMinutes: number | null; timedLeadCount: number;
  commonPaths: Array<{ path: string[]; occurrences: number }>;
  channels: Array<{ channel: string; occurrences: number }>;
  actions: Array<{ action: string; occurrences: number }>;
  templates: Array<{ templateCode: string; occurrences: number }>;
  evidenceCoverage: number | null; leadIds: string[]; droppedLeadIds: string[];
};
export type ProgressionFunnelStage = { stage: ProgressionStage; count: number; progressedFromPreviousCount: number | null; rateFromPrevious: number | null; eligibleCount: number };
export type ProgressionAnalysis = {
  generatedAt: string; ruleVersions: Array<{ ruleKey: string; version: number; label: string; description: string }>; leadCount: number;
  funnel: ProgressionFunnelStage[]; transitions: StageTransition[]; leads: LeadProgression[];
  evidenceCoverage: { completeLeadCount: number; partialLeadCount: number; missingLeadCount: number; unknownLeadCount: number; coveredLeadRate: number | null };
  unresolvedQuestions: Array<{ code: string; label: string; leadCount: number; leadIds: string[] }>;
};
