import type { AnalyticsLead } from "@/analytics/data/analytics-repository";
import {
  isSoldClosedStage,
  median,
  type LeadObservation,
} from "@/analytics/observations/analytics-observations";

import type { ReportMetricKey } from "../report-types";

export function calculateReportMeasure(
  metric: ReportMetricKey,
  leads: AnalyticsLead[],
  observations: LeadObservation[],
): number | null {
  switch (metric) {
    case "leads":
      return leads.length;

    case "timelineCovered":
      return leads.filter(
        (lead) =>
          lead.timelineRecordIds.length > 0,
      ).length;

    case "contacted":
      return observations.filter(
        (observation) =>
          observation.firstContactedTime !== null,
      ).length;

    case "observedOutbound":
      return observations.filter(
        (observation) =>
          observation.firstOutbound !== null,
      ).length;

    case "responded":
      return observations.filter(
        (observation) =>
          observation.responseMinutes !== null,
      ).length;

    case "responseWithin24h":
      return observations.filter(
        (observation) =>
          observation.respondedWithin24h,
      ).length;

    case "appointments":
      return observations.filter(
        (observation) =>
          observation.appointmentEvidence,
      ).length;

    case "soldClosed":
      return leads.filter((lead) =>
        isSoldClosedStage(lead.stage),
      ).length;

    case "responseRate": {
      const outboundPopulation =
        observedOutboundPopulation(observations);
      const respondedPopulation =
        respondedPopulationFrom(outboundPopulation);

      return ratio(
        respondedPopulation.length,
        outboundPopulation.length,
      );
    }

    case "responseWithin24hRate": {
      const outboundPopulation =
        observedOutboundPopulation(observations);
      const respondedWithin24h = outboundPopulation.filter(
        (observation) =>
          observation.respondedWithin24h,
      );

      return ratio(
        respondedWithin24h.length,
        outboundPopulation.length,
      );
    }

    case "medianResponseMinutes": {
      const values = observations
        .map(
          (observation) =>
            observation.responseMinutes,
        )
        .filter(
          (value): value is number =>
            value !== null,
        );

      return median(values);
    }

    case "outboundAttempts":
      return observations.reduce(
        (total, observation) =>
          total + observation.outboundCount,
        0,
      );
  }
}

function observedOutboundPopulation(
  observations: LeadObservation[],
): LeadObservation[] {
  return observations.filter(
    (observation) =>
      observation.evidence.outbound.state === "observed",
  );
}

function respondedPopulationFrom(
  outboundPopulation: LeadObservation[],
): LeadObservation[] {
  return outboundPopulation.filter(
    (observation) =>
      observation.evidence.response.state === "observed",
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
