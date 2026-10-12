import type {
  AnalyticsDataset,
  AnalyticsLead,
} from "@/analytics/data/analytics-repository";
import {
  buildLeadObservations,
  responseSpeedBucket,
  RESPONSE_SPEED_BUCKETS,
  type LeadObservation,
} from "@/analytics/observations/analytics-observations";

import {
  measureDefinition,
} from "./report-catalog";
import type {
  ReportDefinition,
  ReportDimensionKey,
  ReportMetricKey,
  ReportResult,
  ReportRow,
} from "./report-types";

export function buildReport(
  dataset: AnalyticsDataset,
  definition: ReportDefinition,
): ReportResult {
  const observations =
    buildLeadObservations(dataset);

  const observationsByLead = new Map(
    observations.map((observation) => [
      observation.lead.leadId,
      observation,
    ]),
  );

  // Keep the manager's selected lead list separate from the
  // comparison cohort used by measures with explicit population rules.
  const comparisonPopulation = buildPopulation(
    dataset.leads,
    observations,
    observationsByLead,
    definition,
    false,
  );

  const population = buildPopulation(
    dataset.leads,
    observations,
    observationsByLead,
    definition,
    true,
  );

  const {
    leads: filteredLeads,
    observations: filteredObservations,
  } = population;

  const grouped = groupObservations(
    filteredLeads,
    filteredObservations,
    definition.groupBy,
  );

  const comparisonGrouped = groupObservations(
    comparisonPopulation.leads,
    comparisonPopulation.observations,
    definition.groupBy,
  );

  const rows = [...grouped.entries()]
    .map(([key, group]) => {
      const comparisonGroup = comparisonGrouped.get(key);

      return buildRow(
        key,
        group.leads,
        group.observations,
        comparisonGroup?.leads ?? [],
        comparisonGroup?.observations ?? [],
        definition.metrics,
        definition.groupBy,
      );
    })
    .sort((left, right) =>
      left.label.localeCompare(right.label),
    );

  const summary: ReportResult["summary"] = {};
  const summaryDiagnostics: ReportResult["summaryDiagnostics"] = {};

  for (const metric of definition.metrics) {
    const measure = measureDefinition(metric);

    if (!measure) {
      summary[metric] = null;
      continue;
    }

    const useComparisonPopulation =
      measure.population !== "report_population";

    const metricPopulation = useComparisonPopulation
      ? comparisonPopulation
      : population;

    summary[metric] = calculateMetric(
      metric,
      metricPopulation.leads,
      metricPopulation.observations,
    );

    const numeratorMetric: ReportMetricKey | null =
      measure.numerator ??
      (metric === "responseRate"
        ? "responded"
        : metric === "responseWithin24hRate"
          ? "responseWithin24h"
          : null);

    summaryDiagnostics[metric] = {
      population: measure.population,
      evidence: measure.evidence,
      denominatorMetric: measure.denominator,
      eligibleLeadCount: metricPopulation.leads.length,
      timelineCoveredLeadCount:
        metricPopulation.leads.filter(
          (lead) => lead.timelineRecordIds.length > 0,
        ).length,
      numerator:
        numeratorMetric !== null
          ? calculateMetric(
              numeratorMetric,
              metricPopulation.leads,
              metricPopulation.observations,
            )
          : null,
      denominator:
        measure.denominator !== null
          ? calculateMetric(
              measure.denominator,
              metricPopulation.leads,
              metricPopulation.observations,
            )
          : null,
    };
  }

  return {
    definition,
    populationCount: filteredLeads.length,
    leadIds: filteredLeads.map((lead) => lead.leadId),
    summary,
    summaryDiagnostics,
    rows,
  };
}

type ReportPopulation = {
  leads: AnalyticsLead[];
  observations: LeadObservation[];
};

type ReportGroup = ReportPopulation;

function buildPopulation(
  leads: AnalyticsLead[],
  observations: LeadObservation[],
  observationsByLead: Map<string, LeadObservation>,
  definition: ReportDefinition,
  applyEvidenceFilters: boolean,
): ReportPopulation {
  const filteredLeads = leads.filter(
    (lead) =>
      matchesDateRange(
        lead,
        definition,
        observationsByLead.get(lead.leadId),
      ) &&
      matchesFilters(
        lead,
        observationsByLead.get(lead.leadId),
        definition,
      ) &&
      (!applyEvidenceFilters ||
        matchesEvidenceFilters(
          observationsByLead.get(lead.leadId),
          definition,
        )),
  );

  const populationIds = new Set(
    filteredLeads.map((lead) => lead.leadId),
  );

  const selectedTemplates = definition.filters.templates;

  return {
    leads: filteredLeads,
    observations: observations
      .filter((observation) =>
        populationIds.has(observation.lead.leadId),
      )
      .map((observation) => ({
        ...observation,
        templateActions:
          selectedTemplates.length === 0
            ? observation.templateActions
            : observation.templateActions.filter(
                (action) =>
                  action.templateCode !== null &&
                  selectedTemplates.includes(action.templateCode),
              ),
      })),
  };
}

function groupObservations(
  leads: AnalyticsLead[],
  observations: LeadObservation[],
  dimension: ReportDimensionKey,
): Map<string, ReportGroup> {
  const observationsByLead = new Map(
    observations.map((observation) => [
      observation.lead.leadId,
      observation,
    ]),
  );

  const groups = new Map<string, ReportGroup>();

  for (const lead of leads) {
    const key = dimensionValue(
      lead,
      observationsByLead.get(lead.leadId) ?? null,
      dimension,
    );

    const existing = groups.get(key);

    if (existing) {
      existing.leads.push(lead);

      const observation =
        observationsByLead.get(lead.leadId);

      if (observation) {
        existing.observations.push(
          observation,
        );
      }

      continue;
    }

    const observation =
      observationsByLead.get(lead.leadId);

    groups.set(key, {
      leads: [lead],
      observations: observation
        ? [observation]
        : [],
    });
  }

  return groups;
}

function buildRow(
  key: string,
  leads: AnalyticsLead[],
  observations: LeadObservation[],
  comparisonLeads: AnalyticsLead[],
  comparisonObservations: LeadObservation[],
  metrics: ReportMetricKey[],
  dimension: ReportDimensionKey,
): ReportRow {
  const values: ReportRow["values"] = {};

  for (const metric of metrics) {
    // Response speed is defined by the response outcome itself.
    // A response rate within those buckets would be circular.
    if (
      dimension === "responseSpeed" &&
      (metric === "responseRate" ||
        metric === "responseWithin24hRate")
    ) {
      values[metric] = null;
      continue;
    }

    const measure = measureDefinition(metric);
    const useComparisonPopulation =
      measure?.population !== "report_population";

    values[metric] = calculateMetric(
      metric,
      useComparisonPopulation ? comparisonLeads : leads,
      useComparisonPopulation ? comparisonObservations : observations,
    );
  }

  return {
    key,
    label: key,
    leadIds: leads.map((lead) => lead.leadId),
    values,
  };
}

function calculateMetric(
  metric: ReportMetricKey,
  leads: AnalyticsLead[],
  observations: LeadObservation[],
): number | null {
  const measure = measureDefinition(metric);

  if (!measure) {
    return null;
  }

  return measure.calculate({
    leads,
    observations,
  });
}

function matchesDateRange(
  lead: AnalyticsLead,
  definition: ReportDefinition,
  observation: LeadObservation | undefined,
): boolean {
  const { start, end, basis } =
    definition.dateRange;

  if (!start && !end) {
    return true;
  }

  if (basis === "lead_created") {
    return isDateInRange(
      lead.creationTime,
      start,
      end,
    );
  }

  if (basis === "first_contacted") {
    return isDateInRange(
      lead.firstContactedTime ?? null,
      start,
      end,
    );
  }

  if (basis === "first_outbound") {
    return isDateInRange(
      observation?.firstOutbound?.occurredAt ?? null,
      start,
      end,
    );
  }

  if (basis === "first_response") {
    return isDateInRange(
      observation?.firstInbound?.occurredAt ?? null,
      start,
      end,
    );
  }

  if (basis === "outcome_date") {
    return (
      isDateInRange(
        lead.soldDate,
        start,
        end,
      ) ||
      isDateInRange(
        lead.closedTime,
        start,
        end,
      )
    );
  }

  return (
    observation?.events.some((event) =>
      isDateInRange(
        event.occurredAt,
        start,
        end,
      ),
    ) ?? false
  );
}

function isDateInRange(
  value: string | null,
  start: string | null,
  end: string | null,
): boolean {
  if (!value) {
    return false;
  }

  const time = Date.parse(value);

  if (Number.isNaN(time)) {
    return false;
  }

  if (
    start &&
    time <
      Date.parse(
        `${start}T00:00:00.000Z`,
      )
  ) {
    return false;
  }

  if (
    end &&
    time >
      Date.parse(
        `${end}T23:59:59.999Z`,
      )
  ) {
    return false;
  }

  return true;
}

function matchesFilters(
  lead: AnalyticsLead,
  observation: LeadObservation | undefined,
  definition: ReportDefinition,
): boolean {
  const {
    sources,
    sourceGroups,
    stages,
    statuses,
    templates,
  } = definition.filters;

  return (
    matchesStringFilter(
      lead.source,
      sources,
    ) &&
    matchesStringFilter(
      lead.sourceGroup,
      sourceGroups,
    ) &&
    matchesStringFilter(
      lead.stage,
      stages,
    ) &&
    matchesStringFilter(
      lead.status,
      statuses,
    ) &&
    matchesTemplateFilter(
      observation,
      templates,
    )
  );
}

function matchesTemplateFilter(
  observation: LeadObservation | undefined,
  selected: string[],
): boolean {
  if (selected.length === 0) {
    return true;
  }

  if (!observation) {
    return false;
  }

  return observation.templateActions.some(
    (action) =>
      action.templateCode !== null &&
      selected.includes(action.templateCode),
  );
}

function matchesEvidenceFilters(
  observation: LeadObservation | undefined,
  definition: ReportDefinition,
): boolean {
  const filters = definition.filters.evidence;

  if (!observation) {
    return (
      filters.outbound === "any" &&
      filters.response === "any" &&
      filters.appointment === "any" &&
      filters.outcome === "any" &&
      filters.responseWithin24h === "any"
    );
  }

  return (
    matchesEvidenceState(
      observation.evidence.outbound.state,
      filters.outbound,
    ) &&
    matchesEvidenceState(
      observation.evidence.response.state,
      filters.response,
    ) &&
    matchesEvidenceState(
      observation.evidence.appointment.state,
      filters.appointment,
    ) &&
    matchesEvidenceState(
      observation.evidence.outcome.state,
      filters.outcome,
    ) &&
    matchesResponseWithin24h(
      observation,
      filters.responseWithin24h,
    )
  );
}

function matchesEvidenceState(
  state: LeadObservation["evidence"]["outbound"]["state"],
  filter:
    | "any"
    | "observed"
    | "not_observed",
): boolean {
  if (filter === "any") {
    return true;
  }

  return state === filter;
}

function matchesResponseWithin24h(
  observation: LeadObservation,
  filter: "any" | "yes" | "no",
): boolean {
  if (filter === "any") {
    return true;
  }

  if (observation.evidence.outbound.state !== "observed") {
    return false;
  }

  return filter === "yes"
    ? observation.respondedWithin24h
    : !observation.respondedWithin24h;
}

function matchesStringFilter(
  value: string,
  selected: string[],
): boolean {
  if (selected.length === 0) {
    return true;
  }

  const normalized =
    value.trim() || "Unknown";

  return selected.includes(normalized);
}

function dimensionValue(
  lead: AnalyticsLead,
  observation: LeadObservation | null,
  dimension: ReportDimensionKey,
): string {
  switch (dimension) {
    case "none":
      return "All leads";

    case "source":
      return lead.source.trim() || "Unknown source";

    case "sourceGroup":
      return (
        lead.sourceGroup.trim() ||
        "Unknown source group"
      );

    case "stage":
      return lead.stage.trim() || "Unknown stage";

    case "status":
      return lead.status.trim() || "Unknown status";

    case "responseSpeed":
      return responseSpeedDimensionValue(observation);

    case "template":
      return templateDimensionValue(observation);
  }
}

function responseSpeedDimensionValue(
  observation: LeadObservation | null,
): string {
  if (!observation) {
    return "Insufficient evidence";
  }

  if (
    observation.evidence.outbound.state !== "observed"
  ) {
    return "Insufficient evidence";
  }

  if (
    observation.evidence.response.state !== "observed"
  ) {
    return "No observed response";
  }

  const key =
    responseSpeedBucket(
      observation.responseMinutes,
    );

  return (
    RESPONSE_SPEED_BUCKETS.find(
      (bucket) => bucket.key === key,
    )?.label ?? "No observed response"
  );
}

function templateDimensionValue(
  observation: LeadObservation | null,
): string {
  const templates =
    observation?.templateActions
      .map((action) => action.templateCode)
      .filter(
        (template): template is string =>
          template !== null,
      ) ?? [];

  return templates[0] ?? "No matched template";
}
