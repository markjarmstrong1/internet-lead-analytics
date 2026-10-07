import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";
import {
  buildLeadObservations,
} from "@/analytics/observations/analytics-observations";

export type InvestigationRow = {
  leadId: string;
  contactName: string;
  source: string;
  stage: string;
  firstOutboundAt: string | null;
  firstOutboundChannel: string | null;
  firstOutboundEventId: string | null;
  firstOutboundSource: string | null;
  responseAt: string | null;
  responseMinutes: number | null;
  responseEventId: string | null;
  responseSource: string | null;
  appointmentEvidence: boolean;
  soldClosed: boolean;
};

export function buildInvestigationRows(
  dataset: AnalyticsDataset,
): InvestigationRow[] {
  return buildLeadObservations(dataset)
    .filter(
      (observation) =>
        observation.firstOutbound !== null,
    )
    .map((observation) => ({
      leadId: observation.lead.leadId,
      contactName:
        observation.lead.contactName ||
        "Unnamed lead",
      source:
        observation.lead.source ||
        "Unknown source",
      stage:
        observation.lead.stage ||
        "Unknown",
      firstOutboundAt:
        observation.firstOutbound?.occurredAt ??
        null,
      firstOutboundChannel:
        observation.firstOutbound?.channel ??
        null,
      firstOutboundEventId:
        observation.firstOutbound?.sourceEventId ??
        null,
      firstOutboundSource:
        observation.firstOutbound?.sourceFile ??
        null,
      responseAt:
        observation.firstInbound?.occurredAt ??
        null,
      responseMinutes:
        observation.responseMinutes,
      responseEventId:
        observation.firstInbound?.sourceEventId ??
        null,
      responseSource:
        observation.firstInbound?.sourceFile ??
        null,
      appointmentEvidence:
        observation.appointmentEvidence,
      soldClosed: observation.soldClosed,
    }))
    .sort((left, right) => {
      if (
        left.responseMinutes === null &&
        right.responseMinutes !== null
      ) {
        return 1;
      }

      if (
        left.responseMinutes !== null &&
        right.responseMinutes === null
      ) {
        return -1;
      }

      return (
        (left.responseMinutes ?? Infinity) -
        (right.responseMinutes ?? Infinity)
      );
    });
}
