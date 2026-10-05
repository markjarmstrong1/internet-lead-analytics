import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";

export type AnalyticsDateBasis =
  | "lead_created"
  | "timeline_activity"
  | "outcome_date";

export type AnalyticsFilters = {
  dateBasis: AnalyticsDateBasis;
  start: string | null;
  end: string | null;
  sources: string[];
  sourceGroups: string[];
  stages: string[];
  statuses: string[];
};

export const ANALYTICS_DATE_BASES: Array<{
  key: AnalyticsDateBasis;
  label: string;
  description: string;
}> = [
  {
    key: "lead_created",
    label: "Lead created",
    description: "Include leads based on their creation date.",
  },
  {
    key: "timeline_activity",
    label: "Timeline activity",
    description:
      "Include leads with at least one timeline event in the selected period. Metrics describe the selected leads' observed history.",
  },
  {
    key: "outcome_date",
    label: "Outcome date",
    description:
      "Include leads with a recorded sold or closed date in the selected period.",
  },
];

export const DEFAULT_ANALYTICS_FILTERS: AnalyticsFilters = {
  dateBasis: "lead_created",
  start: null,
  end: null,
  sources: [],
  sourceGroups: [],
  stages: [],
  statuses: [],
};

export function normalizeAnalyticsFilters(
  input: Partial<AnalyticsFilters>,
): AnalyticsFilters {
  const dateBasis =
    input.dateBasis &&
    ANALYTICS_DATE_BASES.some(
      (item) => item.key === input.dateBasis,
    )
      ? input.dateBasis
      : DEFAULT_ANALYTICS_FILTERS.dateBasis;

  const start = normalizeDate(input.start);
  const end = normalizeDate(input.end);

  if (start && end && start > end) {
    throw new Error(
      "Analytics start date cannot be after the end date.",
    );
  }

  return {
    dateBasis,
    start,
    end,
    sources: unique(input.sources ?? []),
    sourceGroups: unique(input.sourceGroups ?? []),
    stages: unique(input.stages ?? []),
    statuses: unique(input.statuses ?? []),
  };
}

export function analyticsFiltersFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): AnalyticsFilters {
  const values = (key: string) => {
    const value = params[key];
    return Array.isArray(value)
      ? value
      : value
        ? [value]
        : [];
  };

  const first = (key: string) => values(key)[0];

  return normalizeAnalyticsFilters({
    dateBasis: first("dateBasis") as
      | AnalyticsDateBasis
      | undefined,
    start: first("start") ?? null,
    end: first("end") ?? null,
    sources: values("source"),
    sourceGroups: values("sourceGroup"),
    stages: values("stage"),
    statuses: values("status"),
  });
}

export function filterAnalyticsDataset(
  dataset: AnalyticsDataset,
  filters: AnalyticsFilters,
): AnalyticsDataset {
  const selectedLeads = dataset.leads.filter((lead) => {
    if (!matchesDateBasis(lead, dataset, filters)) {
      return false;
    }

    if (
      filters.sources.length > 0 &&
      !filters.sources.includes(
        lead.source.trim() || "Unknown",
      )
    ) {
      return false;
    }

    if (
      filters.sourceGroups.length > 0 &&
      !filters.sourceGroups.includes(
        lead.sourceGroup.trim() || "Unknown",
      )
    ) {
      return false;
    }

    if (
      filters.stages.length > 0 &&
      !filters.stages.includes(
        lead.stage.trim() || "Unknown",
      )
    ) {
      return false;
    }

    if (
      filters.statuses.length > 0 &&
      !filters.statuses.includes(
        lead.status.trim() || "Unknown",
      )
    ) {
      return false;
    }

    return true;
  });

  const leadIds = new Set(
    selectedLeads.map((lead) => lead.leadId),
  );

  const recordIds = new Set(
    selectedLeads.flatMap(
      (lead) => lead.timelineRecordIds,
    ),
  );

  return {
    leads: selectedLeads,
    events: dataset.events.filter((event) =>
      recordIds.has(event.timelineRecordId),
    ),
  };
}

function matchesDateBasis(
  lead: AnalyticsDataset["leads"][number],
  dataset: AnalyticsDataset,
  filters: AnalyticsFilters,
): boolean {
  const timestamps =
    filters.dateBasis === "lead_created"
      ? [lead.creationTime]
      : filters.dateBasis === "outcome_date"
        ? [lead.soldDate, lead.closedTime]
        : dataset.events
            .filter((event) =>
              lead.timelineRecordIds.includes(
                event.timelineRecordId,
              ),
            )
            .map((event) => event.occurredAt);

  if (
    filters.start === null &&
    filters.end === null
  ) {
    return true;
  }

  return timestamps.some((value) =>
    value ? isWithinDateRange(value, filters) : false,
  );
}

function isWithinDateRange(
  value: string,
  filters: AnalyticsFilters,
): boolean {
  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return false;
  }

  if (filters.start) {
    const start = Date.parse(
      `${filters.start}T00:00:00.000Z`,
    );

    if (timestamp < start) {
      return false;
    }
  }

  if (filters.end) {
    const end = Date.parse(
      `${filters.end}T23:59:59.999Z`,
    );

    if (timestamp > end) {
      return false;
    }
  }

  return true;
}

function normalizeDate(
  value: string | null | undefined,
): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const timestamp = Date.parse(
    `${value}T00:00:00.000Z`,
  );

  return Number.isFinite(timestamp) ? value : null;
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function analyticsFilterOptions(
  dataset: AnalyticsDataset,
) {
  return {
    sources: uniqueSorted(
      dataset.leads.map(
        (lead) => lead.source.trim() || "Unknown",
      ),
    ),
    sourceGroups: uniqueSorted(
      dataset.leads.map(
        (lead) => lead.sourceGroup.trim() || "Unknown",
      ),
    ),
    stages: uniqueSorted(
      dataset.leads.map(
        (lead) => lead.stage.trim() || "Unknown",
      ),
    ),
    statuses: uniqueSorted(
      dataset.leads.map(
        (lead) => lead.status.trim() || "Unknown",
      ),
    ),
  };
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right),
  );
}
