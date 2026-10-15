import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";
import { calculateTransition } from "./calculate-transition";
import { qualifyAllStages } from "./qualify-stage";
import { DEFAULT_PROGRESSION_RULES, TRANSITION_PAIRS } from "./progression-rules";
import type { ProgressionRule } from "./progression-types";
import type { LeadProgression, ProgressionAnalysis, ProgressionStage } from "./progression-types";

export function buildProgressionAnalysis(dataset: AnalyticsDataset, rules: ProgressionRule[] = DEFAULT_PROGRESSION_RULES): ProgressionAnalysis {
  const eventsByRecord = new Map<string, typeof dataset.events>();
  for (const event of dataset.events) {
    const group = eventsByRecord.get(event.timelineRecordId) ?? [];
    group.push(event);
    eventsByRecord.set(event.timelineRecordId, group);
  }
  const leads: LeadProgression[] = dataset.leads.map((lead) => {
    const events = lead.timelineRecordIds.flatMap((id) => eventsByRecord.get(id) ?? [])
      .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));
    const entries = qualifyAllStages({ lead, events, rules });
    const qualifiedCount = entries.filter((item) => item.status === "qualified").length;
    const unresolvedStages = entries.filter((item) => item.status === "unresolved").map((item) => item.stage);
    const coverageStatus = events.length === 0
      ? (lead.timelineRecordIds.length === 0 ? "missing" : "unknown")
      : (unresolvedStages.length > 0 || qualifiedCount < entries.length ? "partial" : "complete");
    return { lead, entries, events, evidenceCoverage: {
      status: coverageStatus, eventCount: events.length, timelineRecordCount: lead.timelineRecordIds.length,
      stagesWithEvidence: qualifiedCount, totalStages: entries.length, unresolvedStages,
    }};
  });
  const transitions = TRANSITION_PAIRS.map(([from, to]) => calculateTransition(leads, from, to));
  const funnel = (["new_lead", "engaged", "conversation", "appointment", "show", "sold"] as ProgressionStage[])
    .map((stage, index) => {
      const count = leads.filter((lead) => lead.entries.some((item) => item.stage === stage && item.status === "qualified")).length;
      const previous = index > 0 ? transitions[index - 1] : null;
      return { stage, count, progressedFromPreviousCount: previous?.progressedLeadCount ?? null, rateFromPrevious: previous?.rate ?? null, eligibleCount: previous?.eligibleLeadCount ?? leads.length };
    });
  const completeLeadCount = leads.filter((lead) => lead.evidenceCoverage.status === "complete").length;
  const partialLeadCount = leads.filter((lead) => lead.evidenceCoverage.status === "partial").length;
  const missingLeadCount = leads.filter((lead) => lead.evidenceCoverage.status === "missing").length;
  const unknownLeadCount = leads.filter((lead) => lead.evidenceCoverage.status === "unknown").length;
  const unresolvedQuestions = [
    { code: "missing_timeline", label: "Leads have no linked timeline records", leadIds: leads.filter((lead) => lead.lead.timelineRecordIds.length === 0).map((lead) => lead.lead.leadId) },
    { code: "missing_events", label: "Leads have linked timeline records but no events", leadIds: leads.filter((lead) => lead.lead.timelineRecordIds.length > 0 && lead.events.length === 0).map((lead) => lead.lead.leadId) },
    { code: "unknown_show", label: "Show stage is unresolved because explicit attendance evidence is absent", leadIds: leads.filter((lead) => lead.entries.some((item) => item.stage === "show" && item.status === "unresolved")).map((lead) => lead.lead.leadId) },
  ].map((item) => ({ ...item, leadCount: item.leadIds.length }));
  return {
    generatedAt: new Date().toISOString(), ruleVersions: rules.filter((rule) => rule.isActive).map(({ ruleKey, version }) => ({ ruleKey, version })),
    leadCount: leads.length, funnel, transitions, leads,
    evidenceCoverage: {
      completeLeadCount, partialLeadCount, missingLeadCount, unknownLeadCount,
      coveredLeadRate: leads.length ? (completeLeadCount + partialLeadCount) / leads.length : null,
    },
    unresolvedQuestions,
  };
}
