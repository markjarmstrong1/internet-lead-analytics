import type { AnalyticsLead } from "@/analytics/data/analytics-repository";
import {
  isSoldClosedStage,
  median,
  type LeadObservation,
} from "@/analytics/observations/analytics-observations";

export type ReportMeasureCalculationContext = {
  leads: AnalyticsLead[];
  observations: LeadObservation[];
};

export function calculateLeads(
  context: ReportMeasureCalculationContext,
): number {
  return context.leads.length;
}

export function calculateTimelineCovered(
  context: ReportMeasureCalculationContext,
): number {
  return context.leads.filter(
    (lead) => lead.timelineRecordIds.length > 0,
  ).length;
}

export function calculateContacted(
  context: ReportMeasureCalculationContext,
): number {
  return context.observations.filter(
    (observation) =>
      observation.firstContactedTime !== null,
  ).length;
}

export function calculateObservedOutbound(
  context: ReportMeasureCalculationContext,
): number {
  return context.observations.filter(
    (observation) =>
      observation.evidence.outbound.state === "observed",
  ).length;
}

export function calculateResponded(
  context: ReportMeasureCalculationContext,
): number {
  return context.observations.filter(
    (observation) =>
      observation.evidence.response.state === "observed",
  ).length;
}

export function calculateResponseWithin24h(
  context: ReportMeasureCalculationContext,
): number {
  return context.observations.filter(
    (observation) =>
      observation.respondedWithin24h,
  ).length;
}

export function calculateAppointments(
  context: ReportMeasureCalculationContext,
): number {
  return context.observations.filter(
    (observation) =>
      observation.appointmentEvidence,
  ).length;
}

export function calculateSoldClosed(
  context: ReportMeasureCalculationContext,
): number {
  return context.leads.filter((lead) =>
    isSoldClosedStage(lead.stage),
  ).length;
}

export function calculateResponseRate(
  context: ReportMeasureCalculationContext,
): number | null {
  const outbound =
    observedOutboundPopulation(context.observations);
  const responded =
    respondedPopulationFrom(outbound);

  return ratio(
    responded.length,
    outbound.length,
  );
}

export function calculateResponseWithin24hRate(
  context: ReportMeasureCalculationContext,
): number | null {
  const outbound =
    observedOutboundPopulation(context.observations);

  const respondedWithin24h =
    outbound.filter(
      (observation) =>
        observation.respondedWithin24h,
    );

  return ratio(
    respondedWithin24h.length,
    outbound.length,
  );
}

export function calculateMedianResponseMinutes(
  context: ReportMeasureCalculationContext,
): number | null {
  const values = context.observations
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

export function calculateOutboundAttempts(
  context: ReportMeasureCalculationContext,
): number {
  return context.observations.reduce(
    (total, observation) =>
      total + observation.outboundCount,
    0,
  );
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
  observations: LeadObservation[],
): LeadObservation[] {
  return observations.filter(
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
