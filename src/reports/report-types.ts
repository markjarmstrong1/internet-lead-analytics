export const REPORT_DEFINITION_VERSION = 1 as const;

export type ReportDateBasis =
  | "lead_created"
  | "timeline_activity"
  | "outcome_date";

export type ReportDimensionKey =
  | "none"
  | "source"
  | "sourceGroup"
  | "stage"
  | "status"
  | "responseSpeed";

export type ReportMetricKey =
  | "leads"
  | "timelineCovered"
  | "contacted"
  | "responded"
  | "responseWithin24h"
  | "appointments"
  | "soldClosed"
  | "responseRate"
  | "responseWithin24hRate"
  | "medianResponseMinutes"
  | "outboundAttempts";

export type ReportDateRange = {
  basis: ReportDateBasis;
  start: string | null;
  end: string | null;
};

export type ReportFilters = {
  sources: string[];
  sourceGroups: string[];
  stages: string[];
  statuses: string[];
};

export type ReportDefinition = {
  version: typeof REPORT_DEFINITION_VERSION;
  name: string;
  dateRange: ReportDateRange;
  filters: ReportFilters;
  groupBy: ReportDimensionKey;
  metrics: ReportMetricKey[];
};

export type SavedReport = {
  id: string;
  name: string;
  definition: ReportDefinition;
  createdAt: string;
  updatedAt: string;
};

export type ReportMetricValue = number | null;

export type ReportRow = {
  key: string;
  label: string;
  values: Partial<
    Record<ReportMetricKey, ReportMetricValue>
  >;
};

export type ReportResult = {
  definition: ReportDefinition;
  populationCount: number;
  summary: Partial<
    Record<ReportMetricKey, ReportMetricValue>
  >;
  rows: ReportRow[];
};
