import type {
  ReportDateBasis,
  ReportDimension,
  ReportDimensionKey,
  ReportMeasure,
  ReportMetricKey,
} from "./report-types";

import {
  calculateAppointments,
  calculateContacted,
  calculateLeads,
  calculateMedianResponseMinutes,
  calculateObservedOutbound,
  calculateOutboundAttempts,
  calculateResponseRate,
  calculateResponseWithin24h,
  calculateResponseWithin24hRate,
  calculateResponded,
  calculateSoldClosed,
  calculateTimelineCovered,
  calculateTemplateUses,
  calculateTemplateUsesPerLead,
} from "./calculations/report-measures";

export const REPORT_DATE_BASES: Array<{
  key: ReportDateBasis;
  label: string;
  description: string;
}> = [
  {
    key: "lead_created",
    label: "Lead creation date",
    description: "Include leads based on when the lead was created.",
  },
  {
    key: "first_contacted",
    label: "First contacted date",
    description:
      "Select leads based on the CRM First Contacted Time value.",
  },
  {
    key: "first_outbound",
    label: "First outbound date",
    description:
      "Select leads based on the first qualifying employee outbound communication.",
  },
  {
    key: "first_response",
    label: "First response date",
    description:
      "Select leads based on the first qualifying inbound response after outbound exposure.",
  },
  {
    key: "timeline_activity",
    label: "Timeline activity",
    description:
      "Select leads with timeline activity in the period; metrics use the selected leads' observed timeline/state evidence.",
  },
  {
    key: "outcome_date",
    label: "Outcome date",
    description:
      "Select leads with a recorded Sold or Closed date in the period; Sold / Closed counts use current stage evidence.",
  },
];

export const REPORT_DIMENSIONS: ReportDimension[] = [
  {
    key: "none",
    label: "No grouping",
    description: "Show one row for the entire report population.",
  },
  {
    key: "source",
    label: "Lead source",
    description: "Compare report measures by lead source.",
  },
  {
    key: "sourceGroup",
    label: "Source group",
    description: "Compare report measures by source group.",
  },
  {
    key: "stage",
    label: "Current stage",
    description: "Compare report measures by the lead's current stage.",
  },
  {
    key: "status",
    label: "Current status",
    description: "Compare report measures by the lead's current status.",
  },
  {
    key: "responseSpeed",
    label: "Response speed",
    description:
      "Compare leads by observed response-speed bucket; leads without observed response remain explicit.",
  },
  {
    key: "template",
    label: "First matched template",
    description:
      "Assign each lead to its first matched template code observed on qualifying outbound communications. Template-use measures still count all matched template actions, so uses can exceed leads. Grouped response rates are observational associations, not proof that a template caused a response.",
  },
];

export const REPORT_MEASURES: ReportMeasure[] = [
  {
    key: "leads",
    label: "Leads",
    description: "Leads in the report population.",
    format: "count",
    population: "report_population",
    evidence: "none",
    denominator: null,
    calculate: calculateLeads,
  },
  {
    key: "timelineCovered",
    label: "Timeline covered",
    description: "Leads with at least one linked timeline record.",
    format: "count",
    population: "report_population",
    evidence: "none",
    denominator: null,
    calculate: calculateTimelineCovered,
  },
  {
    key: "contacted",
    label: "CRM contacted",
    description:
      "Leads with a CRM First Contacted Time value; this is CRM state, not proof of qualifying outbound communication.",
    format: "count",
    population: "report_population",
    evidence: "crm_state",
    denominator: null,
    calculate: calculateContacted,
  },
  {
    key: "observedOutbound",
    label: "Observed outbound",
    description:
      "Leads with at least one qualifying employee outbound communication observed in timeline evidence.",
    format: "count",
    population: "report_population",
    evidence: "observed_outbound",
    denominator: null,
    calculate: calculateObservedOutbound,
  },
  {
    key: "responded",
    label: "Observed responded",
    description:
      "Leads with an observed inbound communication after contact.",
    format: "count",
    population: "report_population",
    evidence: "observed_response",
    denominator: null,
    calculate: calculateResponded,
  },
  {
    key: "responseWithin24h",
    label: "Response within 24 hours",
    description:
      "Leads with an observed response within 24 hours.",
    format: "count",
    population: "report_population",
    evidence: "observed_response",
    denominator: null,
    calculate: calculateResponseWithin24h,
  },
  {
    key: "appointments",
    label: "Appointment evidence",
    description:
      "Leads with observed appointment-created evidence.",
    format: "count",
    population: "report_population",
    evidence: "observed_appointment",
    denominator: null,
    calculate: calculateAppointments,
  },
  {
    key: "soldClosed",
    label: "Sold / Closed",
    description:
      "Leads currently in Sold or Closed stage.",
    format: "count",
    population: "report_population",
    evidence: "crm_outcome",
    denominator: null,
    calculate: calculateSoldClosed,
  },
  {
    key: "responseRate",
    label: "Observed response rate",
    description:
      "Observed responses divided by leads with observed outbound evidence.",
    format: "percent",
    population: "observed_outbound_population",
    evidence: "observed_response",
    denominator: "observedOutbound",
    calculate: calculateResponseRate,
  },
  {
    key: "responseWithin24hRate",
    label: "24-hour response rate",
    description:
      "Responses within 24 hours divided by leads with observed outbound evidence.",
    format: "percent",
    population: "observed_outbound_population",
    evidence: "observed_response",
    denominator: "observedOutbound",
    calculate: calculateResponseWithin24hRate,
  },
  {
    key: "medianResponseMinutes",
    label: "Median response time",
    description:
      "Median observed response time among responding leads.",
    format: "minutes",
    population: "responding_population",
    evidence: "observed_response",
    denominator: null,
    calculate: calculateMedianResponseMinutes,
  },
  {
    key: "outboundAttempts",
    label: "Outbound attempts",
    description:
      "Total qualifying employee outbound communications.",
    format: "count",
    population: "report_population",
    evidence: "observed_outbound",
    denominator: null,
    calculate: calculateOutboundAttempts,
  },
  {
    key: "templateUses",
    label: "Matched template uses",
    description:
      "Total qualifying outbound communications with canonical matched-template evidence.",
    format: "count",
    population: "report_population",
    evidence: "observed_outbound",
    denominator: null,
    calculate: calculateTemplateUses,
  },
  {
    key: "templateUsesPerLead",
    label: "Template uses per lead",
    description:
      "Matched template uses divided by leads in the report population.",
    format: "decimal",
    population: "report_population",
    evidence: "observed_outbound",
    denominator: "leads",
    calculate: calculateTemplateUsesPerLead,
  },
];

/*
 * Backward-compatible alias.
 * Existing callers can continue using REPORT_METRICS while
 * the domain vocabulary moves toward dimensions + measures.
 */
export const REPORT_METRICS = REPORT_MEASURES;

export function dimensionDefinition(
  key: ReportDimensionKey,
): ReportDimension | undefined {
  return REPORT_DIMENSIONS.find(
    (dimension) => dimension.key === key,
  );
}

export function measureDefinition(
  key: ReportMetricKey,
): ReportMeasure | undefined {
  return REPORT_MEASURES.find(
    (measure) => measure.key === key,
  );
}

export function metricDefinition(
  key: ReportMetricKey,
): ReportMeasure | undefined {
  return measureDefinition(key);
}
