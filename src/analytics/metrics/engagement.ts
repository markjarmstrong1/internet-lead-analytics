import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";
import {
  buildLeadObservations,
  RESPONSE_SPEED_BUCKETS,
  responseSpeedBucket,
} from "@/analytics/observations/analytics-observations";

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
        const rows = contacted.filter(
          (observation) =>
            responseSpeedBucket(
              observation.responseMinutes,
            ) === bucket.key,
        );

        return {
          key: bucket.key,
          label: bucket.label,
          count: rows.length,
          rate: ratio(
            rows.length,
            contacted.length,
          ),
        };
      },
    ),

    appointmentSpeed:
      buildOutcomeSpeedRows(
        contacted,
        (observation) =>
          observation.appointmentEvidence,
      ),

    soldClosedSpeed:
      buildOutcomeSpeedRows(
        contacted,
        (observation) =>
          observation.soldClosed,
      ),

    soldClosedWithTimeline:
      observations.filter(
        (observation) =>
          observation.soldClosed &&
          observation.lead.timelineRecordIds
            .length > 0,
      ).length,

    soldClosedWithoutTimeline:
      observations.filter(
        (observation) =>
          observation.soldClosed &&
          observation.lead.timelineRecordIds
            .length === 0,
      ).length,

    appointmentEvidenceLeads:
      observations.filter(
        (observation) =>
          observation.appointmentEvidence,
      ).length,
  };
}

function buildOutcomeSpeedRows(
  contacted: ReturnType<
    typeof buildLeadObservations
  >,
  predicate: (
    observation: ReturnType<
      typeof buildLeadObservations
    >[number],
  ) => boolean,
): OutcomeSpeedRow[] {
  return RESPONSE_SPEED_BUCKETS.map(
    (bucket) => {
      const rows = contacted.filter(
        (observation) =>
          responseSpeedBucket(
            observation.responseMinutes,
          ) === bucket.key,
      );

      const numerator = rows.filter(
        predicate,
      ).length;

      return {
        key: bucket.key,
        label: bucket.label,
        numerator,
        denominator: rows.length,
        rate: ratio(
          numerator,
          rows.length,
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
