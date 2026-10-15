import type { ProgressionAnalysis, ProgressionStage, StageTransition } from "./progression-types";
import type { ProgressionAssociation, ProgressionManagementReport, ProgressionReportSection } from "./progression-report-types";

const stageLabel: Record<ProgressionStage, string> = {
  new_lead: "New lead", engaged: "Engaged", conversation: "Conversation", appointment: "Appointment", show: "Show", sold: "Sold",
};
function rate(numerator: number, denominator: number) { return denominator ? numerator / denominator : null; }

function compareFactor(
  analysis: ProgressionAnalysis,
  transition: StageTransition,
  kind: ProgressionAssociation["kind"],
  factor: string,
): ProgressionAssociation {
  const eligible = analysis.leads.filter((lead) => {
    const from = lead.entries.find((entry) => entry.stage === transition.fromStage);
    const to = lead.entries.find((entry) => entry.stage === transition.toStage);
    if (!from || from.status !== "qualified" || !to || to.status === "unresolved") return false;
    if (to.status === "qualified") return Boolean(from.enteredAt && to.enteredAt && Date.parse(to.enteredAt) >= Date.parse(from.enteredAt));
    return true;
  });
  const progressed = new Set(transition.leadIds);
  const factorLeads = eligible.filter((lead) => lead.events.some((event) => {
    const inWindow = lead.entries.find((entry) => entry.stage === transition.fromStage)?.enteredAt;
    const outWindow = lead.entries.find((entry) => entry.stage === transition.toStage)?.enteredAt;
    const t = Date.parse(event.occurredAt);
    const start = inWindow ? Date.parse(inWindow) : Number.NEGATIVE_INFINITY;
    const end = outWindow ? Date.parse(outWindow) : Number.POSITIVE_INFINITY;
    if (!Number.isFinite(t) || t < start || t > end) return false;
    if (kind === "channel") return (event.channel ?? "unknown") === factor;
    if (kind === "template") return event.templateCode === factor;
    return (event.rawType.trim() || event.category.trim() || "Unknown action") === factor;
  }));
  const exposedIds = new Set(factorLeads.map((lead) => lead.lead.leadId));
  const unexposed = eligible.filter((lead) => !exposedIds.has(lead.lead.leadId));
  const progressedWith = factorLeads.filter((lead) => progressed.has(lead.lead.leadId)).length;
  const progressedWithout = unexposed.filter((lead) => progressed.has(lead.lead.leadId)).length;
  const withRate = rate(progressedWith, factorLeads.length);
  const withoutRate = rate(progressedWithout, unexposed.length);
  return {
    factor, kind, exposedLeadCount: factorLeads.length, progressedWithFactor: progressedWith,
    progressionRateWithFactor: withRate, unexposedLeadCount: unexposed.length,
    progressedWithoutFactor: progressedWithout, progressionRateWithoutFactor: withoutRate,
    rateDifference: withRate === null || withoutRate === null ? null : withRate - withoutRate,
    evidenceCoverageWithFactor: factorLeads.length ? factorLeads.filter((lead) => lead.events.length > 0).length / factorLeads.length : null,
    leadIdsWithFactor: factorLeads.map((lead) => lead.lead.leadId),
    leadIdsWithoutFactor: unexposed.map((lead) => lead.lead.leadId),
  };
}

function buildAssociations(analysis: ProgressionAnalysis): ProgressionAssociation[] {
  const results: ProgressionAssociation[] = [];
  for (const transition of analysis.transitions) {
    const factors = new Map<string, ProgressionAssociation["kind"]>();
    for (const item of transition.channels) factors.set(item.channel, "channel");
    for (const item of transition.actions) factors.set(item.action, "action");
    for (const item of transition.templates) factors.set(item.templateCode, "template");
    for (const [factor, kind] of factors) {
      const association = compareFactor(analysis, transition, kind, factor);
      if (association.exposedLeadCount >= 3 && association.unexposedLeadCount >= 3) results.push(association);
    }
  }
  return results.filter((item) => item.rateDifference !== null)
    .sort((a, b) => (b.rateDifference ?? 0) - (a.rateDifference ?? 0));
}

function section(title: string, summary: string, evidence: string[], leadIds: string[] = []): ProgressionReportSection {
  return { title, summary, evidence, leadIds };
}

export function buildProgressionReport(analysis: ProgressionAnalysis): ProgressionManagementReport {
  const largest = [...analysis.transitions].filter((item) => item.eligibleLeadCount > 0)
    .sort((a, b) => b.dropoffCount - a.dropoffCount)[0] ?? null;
  const associations = buildAssociations(analysis);
  const paths = analysis.transitions.flatMap((transition) => transition.commonPaths.map((item) => ({
    path: item.path, occurrences: item.occurrences, transition: `${stageLabel[transition.fromStage]} → ${stageLabel[transition.toStage]}`,
  }))).sort((a, b) => b.occurrences - a.occurrences).slice(0, 10);
  const executiveSummary = [
    section("Executive Summary", `${analysis.leadCount} canonical leads were evaluated using versioned qualification rules. ${analysis.evidenceCoverage.completeLeadCount} leads have complete observed-stage evidence under the current rule set; ${analysis.evidenceCoverage.missingLeadCount} have no linked timeline.`, [
      `Evidence coverage: ${analysis.evidenceCoverage.coveredLeadRate === null ? "not calculable" : (analysis.evidenceCoverage.coveredLeadRate * 100).toFixed(1) + "%"} complete or partial`,
      "Associations are descriptive comparisons, not causal estimates.",
    ]),
    section("Biggest Drop-off", largest ? `${stageLabel[largest.fromStage]} → ${stageLabel[largest.toStage]}: ${largest.dropoffCount} of ${largest.eligibleLeadCount} eligible leads lack a recorded qualifying next-stage event.` : "No transition has an eligible lead population.", largest ? [`Recorded drop-off rate: ${largest.dropoffRate === null ? "not calculable" : (largest.dropoffRate * 100).toFixed(1) + "%"}`, `Elapsed-time sample: ${largest.timedLeadCount} leads`] : [] , largest?.droppedLeadIds ?? []),
    section("Strongest Associations", associations[0] ? `${associations[0].factor} is associated with a ${((associations[0].rateDifference ?? 0) * 100).toFixed(1)} percentage-point difference in observed progression for its eligible comparison.` : "No factor has enough exposed and unexposed leads to report a stable comparison.", associations.slice(0, 5).map((item) => `${item.factor}: with ${item.progressedWithFactor}/${item.exposedLeadCount}; without ${item.progressedWithoutFactor}/${item.unexposedLeadCount}`)),
    section("Weakest Associations", associations.length > 0 ? `${associations[associations.length - 1].factor} has the lowest observed rate difference among factors meeting the minimum cohort-size rule.` : "No factor comparison met the minimum cohort-size rule.", associations.slice(-5).reverse().map((item) => `${item.factor}: with ${item.progressedWithFactor}/${item.exposedLeadCount}; without ${item.progressedWithoutFactor}/${item.unexposedLeadCount}`)),
    section("Common Paths", paths.length ? "Most frequent observed event sequences between qualifying stage entries." : "No observed paths were available for this cohort.", paths.slice(0, 5).map((item) => `${item.transition}: ${item.path.join(" → ")} (${item.occurrences})`)),
    section("Unresolved Questions", `${analysis.unresolvedQuestions.reduce((sum, item) => sum + item.leadCount, 0)} unresolved evidence exceptions were identified across the listed categories.`, analysis.unresolvedQuestions.map((item) => `${item.label}: ${item.leadCount}`), [...new Set(analysis.unresolvedQuestions.flatMap((item) => item.leadIds))]),
    section("Recommended Management Investigations", largest ? `Review the ${stageLabel[largest.fromStage]} → ${stageLabel[largest.toStage]} cohort before changing process. Inspect records that lack a qualifying next-stage event and validate whether evidence is missing or progression did not occur.` : "Review stage definitions and evidence coverage before interpreting progression.", [
      largest ? `Inspect ${largest.droppedLeadIds.length} lead records in the largest recorded drop-off.` : "Confirm there is an eligible transition cohort.",
      ...analysis.unresolvedQuestions.filter((item) => item.leadCount > 0).map((item) => `Resolve evidence gap: ${item.label} (${item.leadCount}).`),
      "Compare observed tactics only after checking cohort maturity, source coverage, and sample sizes.",
    ], [...new Set([...(largest?.droppedLeadIds ?? []), ...analysis.unresolvedQuestions.flatMap((item) => item.leadIds)])]),
  ];
  return {
    title: "What Is Moving Leads Forward?", generatedAt: analysis.generatedAt, cohortLeadCount: analysis.leadCount,
    stageCounts: analysis.funnel, executiveSummary,
    biggestDropoff: { transition: largest, interpretation: "A recorded drop-off means no qualifying next-stage event was found under the current rules; it does not prove the lead was lost." },
    strongestAssociations: associations.slice(0, 10), weakestAssociations: associations.slice(-10).reverse(), commonPaths: paths,
    unresolvedQuestions: analysis.unresolvedQuestions,
    methodology: {
      qualificationRuleVersions: analysis.ruleVersions,
      associationDescription: "Progression rates compare eligible leads with a qualifying observed factor against eligible leads without that factor. Differences are associational and unadjusted.",
      limitations: ["No causal conclusions are made.", "Small or incomplete cohorts may be unstable.", "Missing events do not prove that an action did not occur.", "Show attendance requires explicit event evidence.", "Association comparisons are not adjusted for source, salesperson, lead intent, or other confounders."],
    },
  };
}
