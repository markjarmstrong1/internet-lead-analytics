export const ANALYTICS_DATE_BASES = [
  {
    key: "lead_created",
    label: "Lead creation date",
    description: "The lead creation timestamp.",
  },
  {
    key: "first_contacted",
    label: "First contacted date",
    description: "The CRM First Contacted Time value.",
  },
  {
    key: "first_outbound",
    label: "First outbound date",
    description: "The first qualifying employee outbound communication observed in timeline evidence.",
  },
  {
    key: "first_response",
    label: "First response date",
    description: "The first qualifying inbound communication observed after outbound exposure.",
  },
  {
    key: "activity",
    label: "Activity date",
    description: "A qualifying timeline event occurred in the period.",
  },
  {
    key: "outcome",
    label: "Outcome date",
    description: "A recorded Sold or Closed outcome date.",
  },
] as const;

export type AnalyticsDateBasis =
  (typeof ANALYTICS_DATE_BASES)[number]["key"];
