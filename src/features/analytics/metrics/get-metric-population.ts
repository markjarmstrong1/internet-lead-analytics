import "server-only";

import { SupabaseAnalyticsRepository } from "@/analytics/data/analytics-repository";
import { buildLeadObservations } from "@/analytics/observations/analytics-observations";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { getMetricDefinition } from "./metric-definition";

export type MetricPopulationRow = {
  leadId: string;
  name: string;
  source: string;
  stage: string;
  status: string;
  outcome: string;
  lastActivity: string | null;
  contributingEventIds: string[];
};

export async function getMetricPopulation(
  metricId: string,
  options: { page?: number; pageSize?: number; search?: string; leadIds?: string[] } = {},
) {
  if (!getMetricDefinition(metricId) || metricId !== "response-rate") return null;

  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 25));
  const needle = options.search?.trim().toLowerCase() ?? "";
  const repository = new SupabaseAnalyticsRepository(createServerSupabaseClient());
  const dataset = await repository.load();
  const observations = buildLeadObservations(dataset);
  const allowedIds = options.leadIds ? new Set(options.leadIds) : null;

  const rows: MetricPopulationRow[] = observations
    .filter((item) => item.evidence.outbound.state === "observed")
    .filter((item) => !allowedIds || allowedIds.has(item.lead.leadId))
    .map((item) => ({
      leadId: item.lead.leadId,
      name: item.lead.contactName.trim() || "Unnamed lead",
      source: item.lead.source.trim() || item.lead.sourceGroup.trim() || "Unknown source",
      stage: item.lead.stage.trim() || "Unknown",
      status: item.lead.status.trim() || "Unknown",
      outcome: item.evidence.outcome.state,
      lastActivity: item.events.length ? item.events[item.events.length - 1].occurredAt : null,
      contributingEventIds: [
        item.firstOutbound?.sourceEventId,
        item.firstInbound?.sourceEventId,
      ].filter((value): value is string => Boolean(value)),
    }))
    .filter((row) => !needle || [row.name, row.source, row.stage, row.status].some((value) => value.toLowerCase().includes(needle)));

  return {
    page,
    pageSize,
    total: rows.length,
    rows: rows.slice((page - 1) * pageSize, page * pageSize),
  };
}
