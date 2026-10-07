export const REPORT_DEFINITION_VERSION = 1 as const;

export type ReportDateBasis =
  | "lead_created"
  | "first_contacted"
  | "first_outbound"
  | "first_response"
  | "timeline_activity"
  | "outcome_date";

export type ReportDimensionKey =
  | "none"
  | "source"
  | "sourceGroup"
  | "stage"
  | "status"
  | "responseSpeed";

export type ReportDimension = {
  key: ReportDimensionKey;
  label: string;
  description: string;
};

export type ReportMetricKey =
  | "leads"
  | "timelineCovered"
  | "contacted"
  | "observedOutbound"
  | "responded"
  | "responseWithin24h"
  | "appointments"
  | "soldClosed"
  | "responseRate"
  | "responseWithin24hRate"
  | "medianResponseMinutes"
  | "outboundAttempts";

export type ReportMeasure = {
  key: ReportMetricKey;
  label: string;
  description: string;
  format: "count" | "percent" | "minutes";
};

export type ReportDateRange = {
  basis: ReportDateBasis;
  start: string | null;
  end: string | null;
};

export type ReportEvidenceFilters = {
  outbound: "any" | "observed" | "not_observed";
  response: "any" | "observed" | "not_observed";
  appointment: "any" | "observed" | "not_observed";
  outcome: "any" | "observed" | "not_observed";
  responseWithin24h: "any" | "yes" | "no";
};

export type ReportFilters = {
  sources: string[];
  sourceGroups: string[];
  stages: string[];
  statuses: string[];
  evidence: ReportEvidenceFilters;
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
