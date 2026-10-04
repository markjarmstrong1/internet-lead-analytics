import {
  REPORT_DATE_BASES,
  REPORT_DIMENSIONS,
  REPORT_METRICS,
} from "./report-catalog";
import {
  REPORT_DEFINITION_VERSION,
  type ReportDateBasis,
  type ReportDefinition,
  type ReportDimensionKey,
  type ReportMetricKey,
} from "./report-types";

export const DEFAULT_REPORT_DEFINITION: ReportDefinition = {
  version: REPORT_DEFINITION_VERSION,
  name: "New report",
  dateRange: {
    basis: "lead_created",
    start: null,
    end: null,
  },
  filters: {
    sources: [],
    sourceGroups: [],
    stages: [],
    statuses: [],
  },
  groupBy: "source",
  metrics: [
    "leads",
    "contacted",
    "responded",
    "appointments",
    "soldClosed",
    "responseRate",
  ],
};

export function normalizeReportDefinition(
  value: unknown,
): ReportDefinition {
  const input = isRecord(value) ? value : {};
  const dateRange = isRecord(input.dateRange)
    ? input.dateRange
    : {};
  const filters = isRecord(input.filters)
    ? input.filters
    : {};

  const metrics = unique(
    asStringArray(input.metrics).filter(isReportMetric),
  );

  const normalized: ReportDefinition = {
    version: REPORT_DEFINITION_VERSION,
    name: normalizeName(input.name),
    dateRange: {
      basis: isReportDateBasis(dateRange.basis)
        ? dateRange.basis
        : DEFAULT_REPORT_DEFINITION.dateRange.basis,
      start: normalizeDate(dateRange.start),
      end: normalizeDate(dateRange.end),
    },
    filters: {
      sources: unique(asStringArray(filters.sources)),
      sourceGroups: unique(
        asStringArray(filters.sourceGroups),
      ),
      stages: unique(asStringArray(filters.stages)),
      statuses: unique(asStringArray(filters.statuses)),
    },
    groupBy: isReportDimension(input.groupBy)
      ? input.groupBy
      : DEFAULT_REPORT_DEFINITION.groupBy,
    metrics:
      metrics.length > 0
        ? metrics
        : [...DEFAULT_REPORT_DEFINITION.metrics],
  };

  if (
    normalized.dateRange.start &&
    normalized.dateRange.end &&
    normalized.dateRange.start >
      normalized.dateRange.end
  ) {
    throw new Error(
      "Report start date cannot be after the end date.",
    );
  }

  return normalized;
}

export function reportDefinitionFromSearchParams(
  params: Record<
    string,
    string | string[] | undefined
  >,
): ReportDefinition {
  const values = (
    key: string,
  ): string[] => {
    const value = params[key];

    if (Array.isArray(value)) {
      return value;
    }

    return value ? [value] : [];
  };

  const first = (
    key: string,
  ): string | undefined => values(key)[0];

  return normalizeReportDefinition({
    name:
      first("name") ??
      DEFAULT_REPORT_DEFINITION.name,
    dateRange: {
      basis:
        first("dateBasis") ??
        DEFAULT_REPORT_DEFINITION.dateRange.basis,
      start: first("start") ?? null,
      end: first("end") ?? null,
    },
    filters: {
      sources: values("source"),
      sourceGroups: values("sourceGroup"),
      stages: values("stage"),
      statuses: values("status"),
    },
    groupBy:
      first("groupBy") ??
      DEFAULT_REPORT_DEFINITION.groupBy,
    metrics: values("metric"),
  });
}

function normalizeName(
  value: unknown,
): string {
  if (typeof value !== "string") {
    return DEFAULT_REPORT_DEFINITION.name;
  }

  const trimmed = value.trim();

  return trimmed.length > 0
    ? trimmed.slice(0, 120)
    : DEFAULT_REPORT_DEFINITION.name;
}

function normalizeDate(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const parsed = Date.parse(
    `${trimmed}T00:00:00.000Z`,
  );

  return Number.isNaN(parsed)
    ? null
    : trimmed;
}

function asStringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string",
    )
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(
  values: string[],
): string[] {
  return [...new Set(values)];
}

function isReportMetric(
  value: string,
): value is ReportMetricKey {
  return REPORT_METRICS.some(
    (metric) => metric.key === value,
  );
}

function isReportDimension(
  value: unknown,
): value is ReportDimensionKey {
  return REPORT_DIMENSIONS.some(
    (dimension) => dimension.key === value,
  );
}

function isReportDateBasis(
  value: unknown,
): value is ReportDateBasis {
  return REPORT_DATE_BASES.some(
    (basis) => basis.key === value,
  );
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}
