import type {
  ReportDateBasis,
  ReportDimensionKey,
  ReportMetricKey,
} from "./report-types";

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

export const REPORT_DIMENSIONS: Array<{
  key: ReportDimensionKey;
  label: string;
}> = [
  { key: "none", label: "No grouping" },
  { key: "source", label: "Lead source" },
  { key: "sourceGroup", label: "Source group" },
  { key: "stage", label: "Current stage" },
  { key: "status", label: "Current status" },
  { key: "responseSpeed", label: "Response speed" },
];

export const REPORT_METRICS: Array<{
  key: ReportMetricKey;
  label: string;
  description: string;
  format: "count" | "percent" | "minutes";
}> = [
  {
    key: "leads",
    label: "Leads",
    description: "Leads in the report population.",
    format: "count",
  },
  {
    key: "timelineCovered",
    label: "Timeline covered",
    description: "Leads with at least one linked timeline record.",
    format: "count",
  },
  {
    key: "contacted",
    label: "CRM contacted",
    description:
      "Leads with a CRM First Contacted Time value; this is CRM state, not proof of qualifying outbound communication.",
    format: "count",
  },
  {
    key: "observedOutbound",
    label: "Observed outbound",
    description:
      "Leads with at least one qualifying employee outbound communication observed in timeline evidence.",
    format: "count",
  },
  {
    key: "responded",
    label: "Observed responded",
    description: "Leads with an observed inbound communication after contact.",
    format: "count",
  },
  {
    key: "responseWithin24h",
    label: "Response within 24 hours",
    description: "Leads with an observed response within 24 hours.",
    format: "count",
  },
  {
    key: "appointments",
    label: "Appointment evidence",
    description: "Leads with observed appointment-created evidence.",
    format: "count",
  },
  {
    key: "soldClosed",
    label: "Sold / Closed",
    description: "Leads currently in Sold or Closed stage.",
    format: "count",
  },
  {
    key: "responseRate",
    label: "Observed response rate",
    description: "Observed responses divided by leads with observed outbound evidence.",
    format: "percent",
  },
  {
    key: "responseWithin24hRate",
    label: "24-hour response rate",
    description: "Responses within 24 hours divided by leads with observed outbound evidence.",
    format: "percent",
  },
  {
    key: "medianResponseMinutes",
    label: "Median response time",
    description: "Median observed response time among responding leads.",
    format: "minutes",
  },
  {
    key: "outboundAttempts",
    label: "Outbound attempts",
    description: "Total qualifying employee outbound communications.",
    format: "count",
  },
];

export function metricDefinition(
  key: ReportMetricKey,
) {
  return REPORT_METRICS.find(
    (metric) => metric.key === key,
  );
}
