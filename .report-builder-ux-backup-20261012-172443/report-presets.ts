import type { ReportDefinition } from "./report-types";

export type ManagementReportPreset = {
  key: string;
  label: string;
  description: string;
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
    label: "Where are we losing Internet leads?",
    description:
      "Focus on leads with observed outbound but no observed response, then compare where those leads come from.",
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
    label: "How quickly are people responding?",
    description:
      "Compare response rates and response times across lead sources, including leads with observed outbound but no observed response.",
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
    label: "What do non-responders have in common?",
    description:
      "Focus on leads with observed outbound and no observed response, then compare current stage.",
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
    label: "What patterns are associated with sold / closed leads?",
    description:
      "Compare sources using observed activity and the current CRM Sold / Closed outcome measure.",
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
    label: "How often are matched templates being used?",
    description:
      "Measure total matched-template uses and average uses per lead with observed outbound. This report summarizes overall usage; individual-template attribution needs a separate action-level analysis.",
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
