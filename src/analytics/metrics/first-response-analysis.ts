import type { LeadObservation } from "@/analytics/observations/analytics-observations";
import {
  average,
  median,
  RESPONSE_SPEED_BUCKETS,
  responseSpeedBucket,
} from "@/analytics/observations/analytics-observations";

export type FirstResponseSpeedRow = {
  key: string;
  label: string;
  responded: number;
  rate: number | null;
};

export type FirstResponseChannelRow = {
  channel: string;
  responses: number;
  responseRate: number | null;
  averageMinutes: number | null;
  medianMinutes: number | null;
};

export type FirstResponseActionRow = {
  action: string;
  channel: string | null;
  responses: number;
  averageMinutes: number | null;
  medianMinutes: number | null;
  appointmentEvidence: number;
  appointmentRate: number | null;
  soldClosed: number;
  soldClosedRate: number | null;
};

export type FirstResponseAnalysis = {
  contacted: number;
  eligible: number;
  responded: number;
  noResponse: number;
  responseRate: number | null;
  respondedWithin24h: number;
  responseWithin24hRate: number | null;
  averageMinutes: number | null;
  medianMinutes: number | null;
  speed: FirstResponseSpeedRow[];
  channels: FirstResponseChannelRow[];
  actions: FirstResponseActionRow[];
};

export function buildFirstResponseAnalysis(
  observations: LeadObservation[],
): FirstResponseAnalysis {
  const contacted = observations.filter(
    (observation) =>
      observation.firstContactedTime !== null,
  );

  const eligible = contacted.filter(
    (observation) =>
      observation.lead.timelineRecordIds.length > 0,
  );

  const responded = eligible.filter(
    (observation) =>
      observation.responseMinutes !== null &&
      observation.evidence.response.state === "observed",
  );

  const responseTimes = responded
    .map(
      (observation) =>
        observation.responseMinutes,
    )
    .filter(
      (value): value is number =>
        value !== null,
    );

  const respondedWithin24h =
    responded.filter(
      (observation) =>
        observation.respondedWithin24h,
    ).length;

  return {
    contacted: contacted.length,
    eligible: eligible.length,
    responded: responded.length,
    noResponse:
      eligible.length - responded.length,
    responseRate: ratio(
      responded.length,
      eligible.length,
    ),
    respondedWithin24h,
    responseWithin24hRate: ratio(
      respondedWithin24h,
      eligible.length,
    ),
    averageMinutes:
      average(responseTimes),
    medianMinutes:
      median(responseTimes),
    speed:
      buildSpeedRows(eligible),
    channels:
      buildChannelRows(
        responded,
        eligible.length,
      ),
    actions:
      buildActionRows(responded),
  };
}

function buildSpeedRows(
  eligible: LeadObservation[],
): FirstResponseSpeedRow[] {
  return RESPONSE_SPEED_BUCKETS.map(
    (bucket) => {
      const responded = eligible.filter(
        (observation) =>
          responseSpeedBucket(
            observation.responseMinutes,
          ) === bucket.key,
      ).length;

      return {
        key: bucket.key,
        label: bucket.label,
        responded,
        rate: ratio(
          responded,
          eligible.length,
        ),
      };
    },
  );
}

function buildChannelRows(
  responded: LeadObservation[],
  eligibleCount: number,
): FirstResponseChannelRow[] {
  const groups = new Map<
    string,
    LeadObservation[]
  >();

  for (const observation of responded) {
    const channel =
      observation.firstInbound?.channel ??
      "unknown";

    const existing = groups.get(channel);

    if (existing) {
      existing.push(observation);
    } else {
      groups.set(channel, [observation]);
    }
  }

  return [...groups.entries()]
    .map(([channel, rows]) => {
      const times = rows
        .map(
          (row) =>
            row.responseMinutes,
        )
        .filter(
          (value): value is number =>
            value !== null,
        );

      return {
        channel,
        responses: rows.length,
        responseRate: ratio(
          rows.length,
          eligibleCount,
        ),
        averageMinutes: average(times),
        medianMinutes: median(times),
      };
    })
    .sort(
      (left, right) =>
        right.responses - left.responses ||
        left.channel.localeCompare(
          right.channel,
        ),
    );
}

function buildActionRows(
  responded: LeadObservation[],
): FirstResponseActionRow[] {
  const groups = new Map<
    string,
    LeadObservation[]
  >();

  for (const observation of responded) {
    const action =
      observation.responseAction;

    if (!action) {
      continue;
    }

    const key = [
      action.actionType,
      action.channel ?? "none",
    ].join("|");

    const existing = groups.get(key);

    if (existing) {
      existing.push(observation);
    } else {
      groups.set(key, [observation]);
    }
  }

  return [...groups.entries()]
    .map(([key, rows]) => {
      const [action, channel] =
        key.split("|");

      const times = rows
        .map(
          (row) =>
            row.responseMinutes,
        )
        .filter(
          (value): value is number =>
            value !== null,
        );

      const appointmentEvidence =
        rows.filter(
          (row) =>
            row.appointmentEvidence,
        ).length;

      const soldClosed =
        rows.filter(
          (row) =>
            row.soldClosed,
        ).length;

      return {
        action,
        channel:
          channel === "none"
            ? null
            : channel,
        responses: rows.length,
        averageMinutes: average(times),
        medianMinutes: median(times),
        appointmentEvidence,
        appointmentRate: ratio(
          appointmentEvidence,
          rows.length,
        ),
        soldClosed,
        soldClosedRate: ratio(
          soldClosed,
          rows.length,
        ),
      };
    })
    .sort(
      (left, right) =>
        right.responses - left.responses ||
        left.action.localeCompare(
          right.action,
        ),
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
