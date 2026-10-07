import type { AnalyticsDateBasis } from "./date-basis";
import type { EvidenceState } from "./evidence-state";

export type AnalyticsMetricKey =
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

export type MetricDefinition = {
  key: AnalyticsMetricKey;
  name: string;
  description: string;
  population: string;
  numerator: string;
  denominator: string | null;
  dateBasis: AnalyticsDateBasis;
  evidenceRequirement: EvidenceState | "derived";
  limitations: string[];
};

export const ANALYTICS_METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    key: "leads",
    name: "Leads",
    description: "Leads in the selected population.",
    population: "Selected leads",
    numerator: "One per lead",
    denominator: null,
    dateBasis: "lead_created",
    evidenceRequirement: "derived",
    limitations: [],
  },
  {
    key: "timelineCovered",
    name: "Timeline covered",
    description: "Leads with at least one linked timeline record.",
    population: "Selected leads",
    numerator: "Leads with linked timeline records",
    denominator: "Selected leads",
    dateBasis: "lead_created",
    evidenceRequirement: "observed",
    limitations: [
      "Absence of a timeline does not prove absence of activity.",
    ],
  },
  {
    key: "contacted",
    name: "CRM contacted",
    description:
      "Leads with a populated CRM First Contacted Time value.",
    population: "Selected leads",
    numerator: "Leads with First Contacted Time",
    denominator: "Selected leads",
    dateBasis: "first_contacted",
    evidenceRequirement: "observed",
    limitations: [
      "This is CRM state, not proof of a qualifying outbound communication.",
    ],
  },
  {
    key: "observedOutbound",
    name: "Observed outbound",
    description:
      "Leads with at least one qualifying employee outbound communication in timeline evidence.",
    population: "Selected leads with usable timeline evidence",
    numerator:
      "Leads with qualifying employee outbound communication",
    denominator:
      "Selected leads with usable timeline evidence",
    dateBasis: "first_outbound",
    evidenceRequirement: "observed",
    limitations: [
      "Missing or incomplete timeline evidence can undercount outbound activity.",
    ],
  },
  {
    key: "responded",
    name: "Observed responded",
    description:
      "Leads with a qualifying inbound communication observed after outbound exposure.",
    population: "Selected leads with observed outbound evidence",
    numerator: "Leads with observed inbound response after outbound",
    denominator: "Selected leads with observed outbound evidence",
    dateBasis: "first_response",
    evidenceRequirement: "observed",
    limitations: [
      "A missing timeline response is not equivalent to a confirmed non-response.",
    ],
  },
  {
    key: "responseWithin24h",
    name: "Response within 24 hours",
    description:
      "Leads with an observed response within 24 hours of first observed outbound.",
    population: "Selected leads with observed outbound evidence",
    numerator: "Leads responding within 24 hours",
    denominator: "Selected leads with observed outbound evidence",
    dateBasis: "first_response",
    evidenceRequirement: "observed",
    limitations: [
      "Response timing is limited by timeline completeness and timestamp quality.",
    ],
  },
  {
    key: "appointments",
    name: "Appointment evidence",
    description: "Leads with observed appointment-created evidence.",
    population: "Selected leads",
    numerator: "Leads with appointment evidence",
    denominator: null,
    dateBasis: "activity",
    evidenceRequirement: "observed",
    limitations: [
      "Evidence is based on recognized appointment-created timeline events.",
    ],
  },
  {
    key: "soldClosed",
    name: "Sold / Closed",
    description:
      "Leads currently classified as Sold or Closed.",
    population: "Selected leads",
    numerator: "Leads with Sold or Closed stage",
    denominator: "Selected leads",
    dateBasis: "outcome",
    evidenceRequirement: "observed",
    limitations: [
      "Current stage is CRM state and is distinct from observed timeline outcome evidence.",
    ],
  },
  {
    key: "responseRate",
    name: "Observed response rate",
    description:
      "Observed responses divided by leads with observed outbound evidence.",
    population: "Selected leads with observed outbound evidence",
    numerator: "Leads with observed response",
    denominator: "Leads with observed outbound evidence",
    dateBasis: "first_response",
    evidenceRequirement: "observed",
    limitations: [
      "Do not interpret as a CRM response rate when timeline coverage is incomplete.",
    ],
  },
  {
    key: "responseWithin24hRate",
    name: "24-hour response rate",
    description:
      "Observed responses within 24 hours divided by leads with observed outbound evidence.",
    population: "Selected leads with observed outbound evidence",
    numerator: "Leads responding within 24 hours",
    denominator: "Leads with observed outbound evidence",
    dateBasis: "first_response",
    evidenceRequirement: "observed",
    limitations: [
      "Missing timeline evidence can reduce the observed denominator.",
    ],
  },
  {
    key: "medianResponseMinutes",
    name: "Median response time",
    description:
      "Median elapsed time between first observed outbound and first observed inbound response.",
    population: "Selected leads with observed response",
    numerator: "Median response duration",
    denominator: null,
    dateBasis: "first_response",
    evidenceRequirement: "observed",
    limitations: [
      "Only leads with valid outbound and inbound timestamps are included.",
    ],
  },
  {
    key: "outboundAttempts",
    name: "Outbound attempts",
    description:
      "Total qualifying employee outbound communications.",
    population: "Selected leads",
    numerator: "Qualifying outbound communications",
    denominator: null,
    dateBasis: "first_outbound",
    evidenceRequirement: "observed",
    limitations: [
      "Counts depend on timeline evidence and communication classification.",
    ],
  },
];

export function getMetricDefinition(
  key: AnalyticsMetricKey,
): MetricDefinition {
  const definition = ANALYTICS_METRIC_DEFINITIONS.find(
    (metric) => metric.key === key,
  );

  if (!definition) {
    throw new Error(`Unknown analytics metric: ${key}`);
  }

  return definition;
}
