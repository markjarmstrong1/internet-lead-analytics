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
  | "responseSpeed"
  | "template";

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
  | "outboundAttempts"
  | "templateUses"
  | "templateUsesPerLead"
  | "emailSends"
  | "trackedEmailSends"
  | "emailsOpened"
  | "emailOpens"
  | "emailOpenRate"
  | "emailTrackingCoverage";

export type ReportMeasureEvidence =
  | "none"
  | "crm_state"
  | "observed_outbound"
  | "observed_response"
  | "observed_appointment"
  | "crm_outcome";

export type ReportMeasurePopulation =
  | "report_population"
  | "observed_outbound_population"
  | "responding_population";

export type ReportMeasureCalculationContext = {
  leads: import("@/analytics/data/analytics-repository").AnalyticsLead[];
  observations: import("@/analytics/observations/analytics-observations").LeadObservation[];
};

export type ReportMeasure = {
  key: ReportMetricKey;
  label: string;
  description: string;
  format: "count" | "percent" | "minutes" | "decimal";
  population: ReportMeasurePopulation;
  evidence: ReportMeasureEvidence;
  denominator: ReportMetricKey | null;
  numerator?: ReportMetricKey | null;
  calculate: (
    context: ReportMeasureCalculationContext,
  ) => number | null;
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
  templates: string[];
  evidence: ReportEvidenceFilters;
};

export type ReportPdfOptions = {
  includeExecutiveSummary: boolean;
  includeDetailedResults: boolean;
  includeMetricDefinitions: boolean;
  includeTemplateUsage: boolean;
  includeEmailEngagement: boolean;
};

export const DEFAULT_REPORT_PDF_OPTIONS: ReportPdfOptions = {
  includeExecutiveSummary: true,
  includeDetailedResults: true,
  includeMetricDefinitions: true,
  includeTemplateUsage: true,
  includeEmailEngagement: true,
};

export type ReportDefinition = {
  version: typeof REPORT_DEFINITION_VERSION;
  name: string;
  dateRange: ReportDateRange;
  filters: ReportFilters;
  groupBy: ReportDimensionKey;
  metrics: ReportMetricKey[];
  pdfOptions: ReportPdfOptions;
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
  leadIds: string[];
  values: Partial<
    Record<ReportMetricKey, ReportMetricValue>
  >;
};

export type ReportMetricDiagnostic = {
  population: ReportMeasurePopulation;
  evidence: ReportMeasureEvidence;
  denominatorMetric: ReportMetricKey | null;
  eligibleLeadCount: number;
  timelineCoveredLeadCount: number;
  numerator: number | null;
  denominator: number | null;
};

export type ReportResult = {
  definition: ReportDefinition;
  populationCount: number;
  leadIds: string[];
  summary: Partial<
    Record<ReportMetricKey, ReportMetricValue>
  >;
  summaryDiagnostics: Partial<
    Record<ReportMetricKey, ReportMetricDiagnostic>
  >;
  rows: ReportRow[];
};
