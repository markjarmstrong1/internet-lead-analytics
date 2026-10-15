import type { AnalyticsEvent } from "@/analytics/data/analytics-types";
import { median } from "@/analytics/observations/analytics-observations";
import type { LeadProgression, ProgressionStage, StageTransition } from "./progression-types";

function elapsedMinutes(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const a = Date.parse(start), b = Date.parse(end);
  return Number.isFinite(a) && Number.isFinite(b) && b >= a ? (b - a) / 60_000 : null;
}
function counts(values: string[]): Array<{ value: string; occurrences: number }> {
  const map = new Map<string, number>();
  for (const value of values) map.set(value, (map.get(value) ?? 0) + 1);
  return [...map].map(([value, occurrences]) => ({ value, occurrences }))
    .sort((a, b) => b.occurrences - a.occurrences || a.value.localeCompare(b.value));
}
function entry(lead: LeadProgression, stage: ProgressionStage) {
  return lead.entries.find((item) => item.stage === stage && item.status === "qualified") ?? null;
}
function eventsBetween(events: AnalyticsEvent[], from: string | null, to: string | null) {
  const start = from ? Date.parse(from) : Number.NEGATIVE_INFINITY;
  const end = to ? Date.parse(to) : Number.POSITIVE_INFINITY;
  return events.filter((event) => {
    const at = Date.parse(event.occurredAt);
    return Number.isFinite(at) && at >= start && at <= end;
  });
}
export function calculateTransition(leads: LeadProgression[], fromStage: ProgressionStage, toStage: ProgressionStage): StageTransition {
  const eligible = leads.filter((lead) => entry(lead, fromStage));
  const progressed = eligible.filter((lead) => {
    const from = entry(lead, fromStage), to = entry(lead, toStage);
    return Boolean(from?.enteredAt && to?.enteredAt && Date.parse(to.enteredAt) >= Date.parse(from.enteredAt));
  });
  const durations = progressed.map((lead) => elapsedMinutes(entry(lead, fromStage)?.enteredAt ?? null, entry(lead, toStage)?.enteredAt ?? null))
    .filter((value): value is number => value !== null);
  const pathCounts = counts(progressed.map((lead) => {
    const events = eventsBetween(lead.events, entry(lead, fromStage)?.enteredAt ?? null, entry(lead, toStage)?.enteredAt ?? null);
    const sequence = events.map((event) => event.rawType.trim() || event.category.trim() || "Unknown event")
      .filter((value, index, all) => index === 0 || value !== all[index - 1]).slice(0, 8);
    return sequence.join(" → ") || "No ordered event path available";
  })).slice(0, 5);
  const scopedEvents = progressed.flatMap((lead) => eventsBetween(lead.events, entry(lead, fromStage)?.enteredAt ?? null, entry(lead, toStage)?.enteredAt ?? null));
  const channelCounts = counts(scopedEvents.map((event) => event.channel?.trim() || "unknown")).slice(0, 8);
  const actionCounts = counts(scopedEvents.map((event) => event.rawType.trim() || event.category.trim() || "Unknown action")).slice(0, 8);
  const templateCounts = counts(scopedEvents.map((event) => event.templateCode?.trim() ?? "").filter(Boolean)).slice(0, 8);
  const progressedIds = new Set(progressed.map((lead) => lead.lead.leadId));
  const dropoffCount = eligible.length - progressed.length;
  return {
    fromStage, toStage, eligibleLeadCount: eligible.length, progressedLeadCount: progressed.length, unresolvedLeadCount: unresolved.length, unresolvedLeadIds: unresolved.map((lead) => lead.lead.leadId),
    rate: eligible.length ? progressed.length / eligible.length : null,
    dropoffCount, dropoffRate: eligible.length ? dropoffCount / eligible.length : null,
    medianMinutes: median(durations), timedLeadCount: durations.length,
    commonPaths: pathCounts.map((item) => ({ path: item.value.split(" → "), occurrences: item.occurrences })),
    channels: channelCounts.map((item) => ({ channel: item.value, occurrences: item.occurrences })),
    actions: actionCounts.map((item) => ({ action: item.value, occurrences: item.occurrences })),
    templates: templateCounts.map((item) => ({ templateCode: item.value, occurrences: item.occurrences })),
    evidenceCoverage: eligible.length ? eligible.filter((lead) => lead.events.length > 0).length / eligible.length : null,
    leadIds: progressed.map((lead) => lead.lead.leadId),
    droppedLeadIds: eligible.filter((lead) => !progressedIds.has(lead.lead.leadId)).map((lead) => lead.lead.leadId),
  };
}
