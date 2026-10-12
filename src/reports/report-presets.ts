import type { ReportDefinition } from "./report-types";

export type ManagementReportPreset = {
  key: string;
  label: string;
  description: string;
  category: "Lead performance" | "Response & follow-up" | "Appointments & sales" | "Email & templates";
  name: string;
  groupBy: ReportDefinition["groupBy"];
  evidence: Partial<
    ReportDefinition["filters"]["evidence"]
  >;
  metrics: ReportDefinition["metrics"];
};

export const MANAGEMENT_REPORT_PRESETS: ManagementReportPreset[] = [
  {
    key: "losing-internet-leads",
    label: "Lead leakage",
    description: "Find leads with observed outbound and no observed response; compare by source.",
    category: "Lead performance",
    name: "Where are we losing Internet leads?",
    groupBy: "source",
    evidence: {
      outbound: "observed",
      response: "not_observed",
    },
    metrics: [
      "leads",
      "observedOutbound",
      "appointments",
      "soldClosed",
    ],
  },
  {
    key: "response-patterns",
    label: "Response speed",
    description: "Compare observed response rates and response times by source.",
    category: "Response & follow-up",
    name: "How quickly are people responding?",
    groupBy: "source",
    evidence: {
      outbound: "observed",
    },
    metrics: [
      "leads",
      "observedOutbound",
      "responded",
      "responseRate",
      "responseWithin24hRate",
      "medianResponseMinutes",
    ],
  },
  {
    key: "non-responder-commonalities",
    label: "Non-responder patterns",
    description: "Compare leads with observed outbound and no response by current stage.",
    category: "Lead performance",
    name: "Non-responder commonalities",
    groupBy: "stage",
    evidence: {
      outbound: "observed",
      response: "not_observed",
    },
    metrics: [
      "leads",
      "observedOutbound",
      "appointments",
      "soldClosed",
    ],
  },
  {
    key: "positive-outcome-patterns",
    label: "Sold / closed patterns",
    description: "Compare observed activity and recorded sold/closed outcomes by source.",
    category: "Appointments & sales",
    name: "Patterns associated with sold / closed leads",
    groupBy: "source",
    evidence: {
      outbound: "observed",
    },
    metrics: [
      "leads",
      "observedOutbound",
      "responded",
      "responseRate",
      "appointments",
      "soldClosed",
    ],
  },
  {
    key: "template-usage",
    label: "Template usage",
    description: "Count matched-template actions and average uses per lead.",
    category: "Email & templates",
    name: "Matched template usage",
    groupBy: "none",
    evidence: {
      outbound: "observed",
    },
    metrics: [
      "leads",
      "observedOutbound",
      "outboundAttempts",
      "templateUses",
      "templateUsesPerLead",
    ],
  },
];
