export type TekionTaskWorkflowReportMetricKey =
  | "identity_evidence_coverage"
  | "direct_identity_rate"
  | "unresolved_identity_rate"
  | "qualifying_outbound_evidence_rate"
  | "outbound_channel_mismatch_rate"
  | "inbound_only_rate"
  | "no_communication_evidence_rate"
  | "allowed_channel_event_share"
  | "mismatched_channel_event_share";

export type TekionTaskWorkflowReportMetricDefinition = {
  key: TekionTaskWorkflowReportMetricKey;
  label: string;
  numeratorDefinition: string;
  denominatorDefinition: string;
};

export const TASK_WORKFLOW_REPORT_METRIC_DEFINITIONS:
  TekionTaskWorkflowReportMetricDefinition[] = [
    {
      key: "identity_evidence_coverage",
      label: "Identity evidence coverage",
      numeratorDefinition:
        "Comparisons with direct or unresolved identity evidence.",
      denominatorDefinition:
        "All Task-to-timeline comparisons.",
    },
    {
      key: "direct_identity_rate",
      label: "Direct identity rate",
      numeratorDefinition:
        "Comparisons with direct identity evidence.",
      denominatorDefinition:
        "All Task-to-timeline comparisons.",
    },
    {
      key: "unresolved_identity_rate",
      label: "Unresolved identity rate",
      numeratorDefinition:
        "Comparisons with unresolved identity-variant evidence.",
      denominatorDefinition:
        "All Task-to-timeline comparisons.",
    },
    {
      key: "qualifying_outbound_evidence_rate",
      label: "Qualifying outbound evidence rate",
      numeratorDefinition:
        "Evaluated comparisons with qualifying outbound employee communication.",
      denominatorDefinition:
        "Evaluated communication comparisons.",
    },
    {
      key: "outbound_channel_mismatch_rate",
      label: "Outbound channel mismatch rate",
      numeratorDefinition:
        "Evaluated comparisons with outbound communication on a channel not allowed by the Task.",
      denominatorDefinition:
        "Evaluated communication comparisons.",
    },
    {
      key: "inbound_only_rate",
      label: "Inbound-only rate",
      numeratorDefinition:
        "Evaluated comparisons with inbound communication and no qualifying outbound communication.",
      denominatorDefinition:
        "Evaluated communication comparisons.",
    },
    {
      key: "no_communication_evidence_rate",
      label: "No communication evidence rate",
      numeratorDefinition:
        "Evaluated comparisons with no communication evidence.",
      denominatorDefinition:
        "Evaluated communication comparisons.",
    },
    {
      key: "allowed_channel_event_share",
      label: "Allowed-channel event share",
      numeratorDefinition:
        "Observed communication events using a channel allowed by the Task.",
      denominatorDefinition:
        "Observed communication events with an evaluated channel.",
    },
    {
      key: "mismatched_channel_event_share",
      label: "Mismatched-channel event share",
      numeratorDefinition:
        "Observed communication events using a channel not allowed by the Task.",
      denominatorDefinition:
        "Observed communication events with an evaluated channel.",
    },
  ];
