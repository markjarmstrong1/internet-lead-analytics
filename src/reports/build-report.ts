import type {
  AnalyticsDataset,
  AnalyticsLead,
} from "@/analytics/data/analytics-repository";
import {
  buildLeadObservations,
  responseSpeedBucket,
  RESPONSE_SPEED_BUCKETS,
  type LeadObservation,
} from "@/analytics/metrics/analytics-observations";

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

  const filteredLeads = dataset.leads.filter(
    (lead) =>
      matchesDateRange(
        lead,
        definition,
        observationsByLead.get(lead.leadId),
      ) &&
      matchesFilters(lead, definition),
  );

  const populationIds = new Set(
    filteredLeads.map(
      (lead) => lead.leadId,
    ),
  );

  const filteredObservations =
    observations.filter((observation) =>
      populationIds.has(
        observation.lead.leadId,
      ),
    );

  const grouped = groupObservations(
    filteredLeads,
    filteredObservations,
    definition.groupBy,
  );

  const rows = [...grouped.entries()]
    .map(([key, group]) =>
      buildRow(
        key,
        group.leads,
        group.observations,
        definition.metrics,
      ),
    )
    .sort((left, right) =>
      left.label.localeCompare(right.label),
    );

  const summary: ReportResult["summary"] = {};

  for (const metric of definition.metrics) {
    summary[metric] = calculateMetric(
      metric,
      filteredLeads,
      filteredObservations,
    );
  }

  return {
    definition,
    populationCount: filteredLeads.length,
    summary,
    rows,
  };
}

type ReportGroup = {
  leads: AnalyticsLead[];
  observations: LeadObservation[];
};

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
  metrics: ReportMetricKey[],
): ReportRow {
  const values: ReportRow["values"] = {};

  for (const metric of metrics) {
    values[metric] = calculateMetric(
      metric,
      leads,
      observations,
    );
  }

  return {
    key,
    label: key,
    values,
  };
}

function calculateMetric(
  metric: ReportMetricKey,
  leads: AnalyticsLead[],
  observations: LeadObservation[],
): number | null {
  switch (metric) {
    case "leads":
      return leads.length;

    case "timelineCovered":
      return leads.filter(
        (lead) =>
          lead.timelineRecordIds.length > 0,
      ).length;

    case "contacted":
      return observations.filter(
        (observation) =>
          observation.firstOutbound !== null,
      ).length;

    case "responded":
      return observations.filter(
        (observation) =>
          observation.responseMinutes !== null,
      ).length;

    case "responseWithin24h":
      return observations.filter(
        (observation) =>
          observation.respondedWithin24h,
      ).length;

    case "appointments":
      return observations.filter(
        (observation) =>
          observation.appointmentEvidence,
      ).length;

    case "soldClosed":
      return leads.filter(isSoldClosed).length;

    case "responseRate":
      return ratio(
        observations.filter(
          (observation) =>
            observation.responseMinutes !== null,
        ).length,
        observations.filter(
          (observation) =>
            observation.firstOutbound !== null,
        ).length,
      );

    case "responseWithin24hRate":
      return ratio(
        observations.filter(
          (observation) =>
            observation.respondedWithin24h,
        ).length,
        observations.filter(
          (observation) =>
            observation.firstOutbound !== null,
        ).length,
      );

    case "medianResponseMinutes": {
      const values = observations
        .map(
          (observation) =>
            observation.responseMinutes,
        )
        .filter(
          (value): value is number =>
            value !== null,
        );

      return median(values);
    }

    case "outboundAttempts":
      return observations.reduce(
        (total, observation) =>
          total + observation.outboundCount,
        0,
      );
  }
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
  definition: ReportDefinition,
): boolean {
  const {
    sources,
    sourceGroups,
    stages,
    statuses,
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
    )
  );
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
      return observation
        ? responseSpeedBucketLabel(
            observation.responseMinutes,
          )
        : "No observed response";
  }
}

function responseSpeedBucketLabel(
  minutes: number | null,
): string {
  const key =
    responseSpeedBucket(minutes);

  return (
    RESPONSE_SPEED_BUCKETS.find(
      (bucket) => bucket.key === key,
    )?.label ?? "No observed response"
  );
}

function isSoldClosed(
  lead: AnalyticsLead,
): boolean {
  const stage =
    lead.stage.trim().toLowerCase();

  return (
    stage === "sold" ||
    stage === "closed"
  );
}

function ratio(
  numerator: number,
  denominator: number,
): number | null {
  return denominator === 0
    ? null
    : numerator / denominator;
}

function median(
  values: number[],
): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort(
    (left, right) => left - right,
  );

  const middle = Math.floor(
    sorted.length / 2,
  );

  if (sorted.length % 2 === 0) {
    return (
      (sorted[middle - 1] +
        sorted[middle]) /
      2
    );
  }

  return sorted[middle];
}
