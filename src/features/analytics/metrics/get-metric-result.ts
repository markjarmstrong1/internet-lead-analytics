import "server-only";

import { SupabaseAnalyticsRepository } from "@/analytics/data/analytics-repository";
import { buildLeadObservations } from "@/analytics/observations/analytics-observations";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { getMetricDefinition } from "./metric-definition";

export type MetricResult = {
  metricId: string;
  value: number | null;
  numerator: number;
  denominator: number;
  populationLeadIds: string[];
  numeratorLeadIds: string[];
  denominatorLeadIds: string[];
  evidenceState: "available" | "insufficient-evidence";
};

export async function getMetricResult(metricId: string): Promise<MetricResult | null> {
  const definition = getMetricDefinition(metricId);
  if (!definition) return null;

  const repository = new SupabaseAnalyticsRepository(createServerSupabaseClient());
  const dataset = await repository.load();
  const observations = buildLeadObservations(dataset);

  if (metricId === "response-rate") {
    const denominator = observations.filter(
      (item) => item.evidence.outbound.state === "observed",
    );
    const numerator = denominator.filter(
      (item) => item.evidence.response.state === "observed",
    );

    return {
      metricId,
      value: denominator.length ? numerator.length / denominator.length : null,
      numerator: numerator.length,
      denominator: denominator.length,
      populationLeadIds: denominator.map((item) => item.lead.leadId),
      numeratorLeadIds: numerator.map((item) => item.lead.leadId),
      denominatorLeadIds: denominator.map((item) => item.lead.leadId),
      evidenceState: denominator.length ? "available" : "insufficient-evidence",
    };
  }

  return null;
}
