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
  DEFAULT_REPORT_PDF_OPTIONS,
  type ReportPdfOptions,
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
    templates: [],
    evidence: {
      outbound: "any",
      response: "any",
      appointment: "any",
      outcome: "any",
      responseWithin24h: "any",
    },
  },
  groupBy: "source",
  pdfOptions: { ...DEFAULT_REPORT_PDF_OPTIONS },
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
  ) as ReportMetricKey[];

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
      templates: unique(asStringArray(filters.templates)),
      evidence: {
        outbound:
          getEvidenceStateFilter(
            filters.evidence,
            "outbound",
          ),
        response:
          getEvidenceStateFilter(
            filters.evidence,
            "response",
          ),
        appointment:
          getEvidenceStateFilter(
            filters.evidence,
            "appointment",
          ),
        outcome:
          getEvidenceStateFilter(
            filters.evidence,
            "outcome",
          ),
        responseWithin24h:
          getResponseWithin24hFilter(
            filters.evidence,
          ),
      },
    },
    groupBy: isReportDimension(input.groupBy)
      ? input.groupBy
      : DEFAULT_REPORT_DEFINITION.groupBy,
    metrics:
      metrics.length > 0
        ? metrics
        : [...DEFAULT_REPORT_DEFINITION.metrics],
    pdfOptions: normalizePdfOptions(input.pdfOptions),
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
      templates: values("template"),
      evidence: {
        outbound:
          first("evidenceOutbound") ?? "any",
        response:
          first("evidenceResponse") ?? "any",
        appointment:
          first("evidenceAppointment") ?? "any",
        outcome:
          first("evidenceOutcome") ?? "any",
        responseWithin24h:
          first("evidenceResponseWithin24h") ?? "any",
      },
    },
    groupBy:
      first("groupBy") ??
      DEFAULT_REPORT_DEFINITION.groupBy,
    metrics: values("metric"),
    pdfOptions: first("pdfOptions"),
  });
}

function getEvidenceStateFilter(
  value: unknown,
  key:
    | "outbound"
    | "response"
    | "appointment"
    | "outcome",
): "any" | "observed" | "not_observed" {
  if (!isRecord(value)) {
    return "any";
  }

  const selected = value[key];

  return selected === "observed" ||
    selected === "not_observed"
    ? selected
    : "any";
}

function getResponseWithin24hFilter(
  value: unknown,
): "any" | "yes" | "no" {
  if (!isRecord(value)) {
    return "any";
  }

  const selected = value.responseWithin24h;

  return selected === "yes" || selected === "no"
    ? selected
    : "any";
}

function normalizePdfOptions(value: unknown): ReportPdfOptions {
  let candidate = value;

  // GET-form submissions serialize this object as JSON.
  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate);
    } catch {
      candidate = {};
    }
  }

  const input =
    typeof candidate === "object" && candidate !== null &&
    !Array.isArray(candidate)
      ? candidate as Record<string, unknown>
      : {};

  return {
    includeExecutiveSummary:
      typeof input.includeExecutiveSummary === "boolean"
        ? input.includeExecutiveSummary
        : DEFAULT_REPORT_PDF_OPTIONS.includeExecutiveSummary,
    includeDetailedResults:
      typeof input.includeDetailedResults === "boolean"
        ? input.includeDetailedResults
        : DEFAULT_REPORT_PDF_OPTIONS.includeDetailedResults,
    includeMetricDefinitions:
      typeof input.includeMetricDefinitions === "boolean"
        ? input.includeMetricDefinitions
        : DEFAULT_REPORT_PDF_OPTIONS.includeMetricDefinitions,
    includeTemplateUsage:
      typeof input.includeTemplateUsage === "boolean"
        ? input.includeTemplateUsage
        : DEFAULT_REPORT_PDF_OPTIONS.includeTemplateUsage,
    includeEmailEngagement:
      typeof input.includeEmailEngagement === "boolean"
        ? input.includeEmailEngagement
        : DEFAULT_REPORT_PDF_OPTIONS.includeEmailEngagement,
    layoutPreset:
      input.layoutPreset === "executive" ||
      input.layoutPreset === "detailed" ||
      input.layoutPreset === "data"
        ? input.layoutPreset
        : DEFAULT_REPORT_PDF_OPTIONS.layoutPreset,
    theme:
      input.theme === "executive" ||
      input.theme === "modern" ||
      input.theme === "minimal" ||
      input.theme === "premium"
        ? input.theme
        : DEFAULT_REPORT_PDF_OPTIONS.theme,
    orientation:
      input.orientation === "portrait" ||
      input.orientation === "landscape"
        ? input.orientation
        : DEFAULT_REPORT_PDF_OPTIONS.orientation,
    density:
      input.density === "compact" ||
      input.density === "comfortable"
        ? input.density
        : DEFAULT_REPORT_PDF_OPTIONS.density,
    maxRows:
      input.maxRows === "all" ||
      input.maxRows === "25" ||
      input.maxRows === "50" ||
      input.maxRows === "100"
        ? input.maxRows
        : DEFAULT_REPORT_PDF_OPTIONS.maxRows,
    subtitle:
      typeof input.subtitle === "string"
        ? input.subtitle.trim().slice(0, 240)
        : DEFAULT_REPORT_PDF_OPTIONS.subtitle,
    sectionTitles: normalizePdfSectionTitles(input.sectionTitles),
  };
}

function normalizePdfSectionTitles(value: unknown): ReportPdfOptions["sectionTitles"] {
  const input = isRecord(value) ? value : {};
  const defaults = DEFAULT_REPORT_PDF_OPTIONS.sectionTitles;

  return {
    executiveSummary: normalizeSectionTitle(input.executiveSummary, defaults.executiveSummary),
    detailedResults: normalizeSectionTitle(input.detailedResults, defaults.detailedResults),
    metricDefinitions: normalizeSectionTitle(input.metricDefinitions, defaults.metricDefinitions),
    templateUsage: normalizeSectionTitle(input.templateUsage, defaults.templateUsage),
    emailEngagement: normalizeSectionTitle(input.emailEngagement, defaults.emailEngagement),
  };
}

function normalizeSectionTitle(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const title = value.trim().slice(0, 100);
  return title || fallback;
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

function unique<T extends string>(
  values: T[],
): T[] {
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
