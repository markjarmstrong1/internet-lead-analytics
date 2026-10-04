import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";
import {
  buildLeadObservations,
  RESPONSE_SPEED_BUCKETS,
  responseSpeedBucket,
} from "./analytics-observations";

export type EngagementChannelRow = {
  channel: string;
  contacted: number;
  responded: number;
  respondedWithin24h: number;
  responseRate: number | null;
  responseWithin24hRate: number | null;
};

export type EngagementSpeedRow = {
  key: string;
  label: string;
  count: number;
  rate: number | null;
};

export type OutcomeSpeedRow = {
  key: string;
  label: string;
  numerator: number;
  denominator: number;
  rate: number | null;
};

export type EngagementAnalysis = {
  contacted: number;
  responded: number;
  respondedWithin24h: number;
  responseRate: number | null;
  responseWithin24hRate: number | null;
  channels: EngagementChannelRow[];
  speed: EngagementSpeedRow[];
  appointmentSpeed: OutcomeSpeedRow[];
  soldClosedSpeed: OutcomeSpeedRow[];
  soldClosedWithTimeline: number;
  soldClosedWithoutTimeline: number;
  appointmentEvidenceLeads: number;
};

const CHANNELS = [
  "text",
  "email",
  "phone",
  "voicemail",
] as const;

export function buildEngagementAnalysis(
  dataset: AnalyticsDataset,
): EngagementAnalysis {
  const observations =
    buildLeadObservations(dataset);

  const contacted = observations.filter(
    (observation) =>
      observation.firstOutbound !== null,
  );

  const responded = contacted.filter(
    (observation) =>
      observation.responseMinutes !== null,
  );

  const respondedWithin24h =
    contacted.filter(
      (observation) =>
        observation.respondedWithin24h,
    );

  const appointmentObservations =
    contacted.filter(
      (observation) =>
        observation.appointmentEvidence,
    );

  const soldClosedObservations =
    contacted.filter(
      (observation) =>
        observation.soldClosed,
    );

  return {
    contacted: contacted.length,
    responded: responded.length,
    respondedWithin24h:
      respondedWithin24h.length,
    responseRate: ratio(
      responded.length,
      contacted.length,
    ),
    responseWithin24hRate: ratio(
      respondedWithin24h.length,
      contacted.length,
    ),
    channels: CHANNELS.map((channel) => {
      const rows = contacted.filter(
        (observation) =>
          observation.firstOutbound?.channel ===
          channel,
      );

      const respondedRows = rows.filter(
        (observation) =>
          observation.responseMinutes !== null,
      );

      const fastRows = rows.filter(
        (observation) =>
          observation.respondedWithin24h,
      );

      return {
        channel,
        contacted: rows.length,
        responded: respondedRows.length,
        respondedWithin24h: fastRows.length,
        responseRate: ratio(
          respondedRows.length,
          rows.length,
        ),
        responseWithin24hRate: ratio(
          fastRows.length,
          rows.length,
        ),
      };
    }),
    speed: RESPONSE_SPEED_BUCKETS.map(
      (bucket) => {
        const count = contacted.filter(
          (observation) =>
            responseSpeedBucket(
              observation.responseMinutes,
            ) === bucket.key,
        ).length;

        return {
          key: bucket.key,
          label: bucket.label,
          count,
          rate: ratio(
            count,
            contacted.length,
          ),
        };
      },
    ),
    appointmentSpeed:
      buildOutcomeSpeedRows(
        appointmentObservations,
      ),
    soldClosedSpeed:
      buildOutcomeSpeedRows(
        soldClosedObservations,
      ),
    soldClosedWithTimeline:
      dataset.leads.filter(
        (lead) =>
          lead.soldDate !== null ||
          lead.closedTime !== null ||
          ["sold", "closed"].includes(
            lead.stage.trim().toLowerCase(),
          ),
      ).filter(
        (lead) =>
          lead.timelineRecordIds.length > 0,
      ).length,
    soldClosedWithoutTimeline:
      dataset.leads.filter(
        (lead) =>
          ["sold", "closed"].includes(
            lead.stage.trim().toLowerCase(),
          ) &&
          lead.timelineRecordIds.length === 0,
      ).length,
    appointmentEvidenceLeads:
      dataset.leads.filter((lead) =>
        observations.some(
          (observation) =>
            observation.lead.leadId ===
              lead.leadId &&
            observation.appointmentEvidence,
        ),
      ).length,
  };
}

function buildOutcomeSpeedRows(
  observations: ReturnType<
    typeof buildLeadObservations
  >,
): OutcomeSpeedRow[] {
  return RESPONSE_SPEED_BUCKETS.map(
    (bucket) => {
      const count = observations.filter(
        (observation) =>
          responseSpeedBucket(
            observation.responseMinutes,
          ) === bucket.key,
      ).length;

      return {
        key: bucket.key,
        label: bucket.label,
        numerator: count,
        denominator: observations.length,
        rate: ratio(
          count,
          observations.length,
        ),
      };
    },
  );
}

function ratio(
  numerator: number,
  denominator: number,
): number | null {
  return denominator === 0
    ? null
    : numerator / denominator;
}
