import "server-only";

import { SupabaseAnalyticsRepository } from "@/analytics/data/analytics-repository";
import { buildLeadObservations } from "@/analytics/observations/analytics-observations";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { getMetricDefinition } from "./metric-definition";

export type MetricBreakdownRow = {
  id: string;
  label: string;
  numerator: number;
  denominator: number;
  rate: number | null;
  leadIds: string[];
};

export async function getMetricBreakdown(
  metricId: string,
  dimension: "channel" | "source" | "template" = "channel",
): Promise<MetricBreakdownRow[] | null> {
  if (!getMetricDefinition(metricId) || metricId !== "response-rate") return null;

  const repository = new SupabaseAnalyticsRepository(createServerSupabaseClient());
  const dataset = await repository.load();
  const observations = buildLeadObservations(dataset);
  const groups = new Map<string, { numerator: Set<string>; denominator: Set<string> }>();

  for (const item of observations) {
    if (item.evidence.outbound.state !== "observed") continue;

    const matchingActions = item.outboundActions;
    const labels = dimension === "source"
      ? [item.lead.source.trim() || "Unknown source"]
      : dimension === "template"
        ? [...new Set(matchingActions.map((action) => action.templateCode || "").filter(Boolean))]
        : [...new Set(matchingActions.map((action) => action.channel || "Unknown channel"))];

    for (const label of labels.length ? labels : ["Unknown"]) {
      const group = groups.get(label) ?? { numerator: new Set<string>(), denominator: new Set<string>() };
      group.denominator.add(item.lead.leadId);
      if (item.evidence.response.state === "observed") group.numerator.add(item.lead.leadId);
      groups.set(label, group);
    }
  }

  return [...groups.entries()].map(([label, group]) => ({
    id: encodeURIComponent(label),
    label,
    numerator: group.numerator.size,
    denominator: group.denominator.size,
    rate: group.denominator.size ? group.numerator.size / group.denominator.size : null,
    leadIds: [...group.denominator],
  })).sort((a, b) => b.denominator - a.denominator);
}
