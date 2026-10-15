
import "server-only";

import { SupabaseAnalyticsRepository } from "@/analytics/data/analytics-repository";
import { buildLeadObservations } from "@/analytics/observations/analytics-observations";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { getMetricDefinition } from "./metric-definition";

export type MetricBreakdownDimension =
  | "source"
  | "channel"
  | "template";

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

export type MetricPopulationOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  leadIds?: string[];
  breakdown?: {
    dimension: MetricBreakdownDimension;
    value: string;
  };
};

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLocaleLowerCase("en-US");
}

function matchesBreakdown(
  observation: ReturnType<typeof buildLeadObservations>[number],
  breakdown: NonNullable<MetricPopulationOptions["breakdown"]>,
): boolean {
  const expected = normalize(breakdown.value);

  if (!expected) return false;

  switch (breakdown.dimension) {
    case "source":
      return (
        normalize(observation.lead.source) === expected ||
        normalize(observation.lead.sourceGroup) === expected
      );

    case "channel":
      return observation.outboundActions.some(
        (action) => normalize(action.channel) === expected,
      );

    case "template":
      return observation.templateActions.some(
        (action) =>
          normalize(action.templateCode) === expected ||
          normalize(action.template) === expected,
      );

    default: {
      const exhaustiveCheck: never = breakdown.dimension;
      return exhaustiveCheck;
    }
  }
}

export async function getMetricPopulation(
  metricId: string,
  options: MetricPopulationOptions = {},
) {
  if (!getMetricDefinition(metricId) || metricId !== "response-rate") {
    return null;
  }

  const page = Math.max(1, Math.floor(options.page ?? 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Math.floor(options.pageSize ?? 25)),
  );
  const needle = normalize(options.search);
  const allowedIds = options.leadIds
    ? new Set(options.leadIds)
    : null;

  const breakdown = options.breakdown;

  if (breakdown && !normalize(breakdown.value)) {
    return {
      page,
      pageSize,
      total: 0,
      rows: [] as MetricPopulationRow[],
    };
  }

  const repository = new SupabaseAnalyticsRepository(
    createServerSupabaseClient(),
  );

  const dataset = await repository.load();
  const observations = buildLeadObservations(dataset);

  const rows: MetricPopulationRow[] = observations
    // The denominator is leads with observed outbound evidence.
    .filter(
      (item) => item.evidence.outbound.state === "observed",
    )
    // Apply explicit membership before calculating the result count.
    .filter(
      (item) =>
        !allowedIds || allowedIds.has(item.lead.leadId),
    )
    .filter(
      (item) =>
        !breakdown || matchesBreakdown(item, breakdown),
    )
    .map((item) => {
      const contributingEvents = [
        item.firstOutbound,
        item.firstInbound,
      ].filter(
        (event): event is NonNullable<typeof event> =>
          event !== null,
      );

      return {
        leadId: item.lead.leadId,
        name:
          item.lead.contactName.trim() || "Unnamed lead",
        source:
          item.lead.source.trim() ||
          item.lead.sourceGroup.trim() ||
          "Unknown source",
        stage: item.lead.stage.trim() || "Unknown",
        status: item.lead.status.trim() || "Unknown",
        outcome: item.evidence.outcome.state,
        lastActivity: item.events.length
          ? item.events[item.events.length - 1].occurredAt
          : null,
        // These are source event IDs; they are not canonical timeline event IDs.
        contributingEventIds: [
          item.firstOutbound?.sourceEventId,
          item.firstInbound?.sourceEventId,
        ].filter((value): value is string => Boolean(value)),
      };
    })
    .filter(
      (row) =>
        !needle ||
        [row.name, row.source, row.stage, row.status].some(
          (value) => normalize(value).includes(needle),
        ),
    );

  return {
    page,
    pageSize,
    total: rows.length,
    rows: rows.slice(
      (page - 1) * pageSize,
      page * pageSize,
    ),
  };
}
