import type { TekionTaskWorkflowReportRow } from "./task-workflow-report-row";
import type {
  TekionTaskWorkflowReportMetricKey,
} from "./task-workflow-report-metric-definitions";

export type TekionReportMetric = {
  key: TekionTaskWorkflowReportMetricKey;
  numerator: number;
  denominator: number;
  rate: number | undefined;
};

function ratio(
  numerator: number,
  denominator: number,
): number | undefined {
  if (denominator === 0) {
    return undefined;
  }

  return numerator / denominator;
}

export function calculateTaskWorkflowReportMetrics(
  row: TekionTaskWorkflowReportRow,
): TekionReportMetric[] {
  const evaluatedCommunicationComparisons =
    row.qualifyingOutboundComparisonCount +
    row.outboundChannelMismatchComparisonCount +
    row.inboundOnlyComparisonCount +
    row.noCommunicationEvidenceComparisonCount;

  const identityEvidenceComparisons =
    row.directIdentityComparisonCount +
    row.unresolvedIdentityComparisonCount;

  const evaluatedCommunicationEvents =
    row.allowedChannelEventCount +
    row.mismatchedChannelEventCount;

  return [
    {
      key: "identity_evidence_coverage",
      numerator: identityEvidenceComparisons,
      denominator: row.comparisonCount,
      rate: ratio(
        identityEvidenceComparisons,
        row.comparisonCount,
      ),
    },
    {
      key: "direct_identity_rate",
      numerator: row.directIdentityComparisonCount,
      denominator: row.comparisonCount,
      rate: ratio(
        row.directIdentityComparisonCount,
        row.comparisonCount,
      ),
    },
    {
      key: "unresolved_identity_rate",
      numerator: row.unresolvedIdentityComparisonCount,
      denominator: row.comparisonCount,
      rate: ratio(
        row.unresolvedIdentityComparisonCount,
        row.comparisonCount,
      ),
    },
    {
      key: "qualifying_outbound_evidence_rate",
      numerator: row.qualifyingOutboundComparisonCount,
      denominator: evaluatedCommunicationComparisons,
      rate: ratio(
        row.qualifyingOutboundComparisonCount,
        evaluatedCommunicationComparisons,
      ),
    },
    {
      key: "outbound_channel_mismatch_rate",
      numerator: row.outboundChannelMismatchComparisonCount,
      denominator: evaluatedCommunicationComparisons,
      rate: ratio(
        row.outboundChannelMismatchComparisonCount,
        evaluatedCommunicationComparisons,
      ),
    },
    {
      key: "inbound_only_rate",
      numerator: row.inboundOnlyComparisonCount,
      denominator: evaluatedCommunicationComparisons,
      rate: ratio(
        row.inboundOnlyComparisonCount,
        evaluatedCommunicationComparisons,
      ),
    },
    {
      key: "no_communication_evidence_rate",
      numerator: row.noCommunicationEvidenceComparisonCount,
      denominator: evaluatedCommunicationComparisons,
      rate: ratio(
        row.noCommunicationEvidenceComparisonCount,
        evaluatedCommunicationComparisons,
      ),
    },
    {
      key: "allowed_channel_event_share",
      numerator: row.allowedChannelEventCount,
      denominator: evaluatedCommunicationEvents,
      rate: ratio(
        row.allowedChannelEventCount,
        evaluatedCommunicationEvents,
      ),
    },
    {
      key: "mismatched_channel_event_share",
      numerator: row.mismatchedChannelEventCount,
      denominator: evaluatedCommunicationEvents,
      rate: ratio(
        row.mismatchedChannelEventCount,
        evaluatedCommunicationEvents,
      ),
    },
  ];
}
