import type { AnalyticsLead } from "@/analytics/data/analytics-repository";
import {
  isSoldClosedStage,
  median,
  type LeadObservation,
} from "@/analytics/observations/analytics-observations";
import { buildEmailEvidence } from "@/analytics/metrics/email-evidence";

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

export function calculateTemplateUses(
  context: ReportMeasureCalculationContext,
): number {
  return context.observations.reduce(
    (total, observation) =>
      total + observation.templateActions.length,
    0,
  );
}

export function calculateTemplateUsesPerLead(
  context: ReportMeasureCalculationContext,
): number | null {
  if (context.leads.length === 0) {
    return null;
  }

  return (
    calculateTemplateUses(context) /
    context.leads.length
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


function emailEvidence(context: ReportMeasureCalculationContext) {
  return buildEmailEvidence(
    context.observations.flatMap((observation) => observation.events),
  );
}

export function calculateEmailSends(
  context: ReportMeasureCalculationContext,
): number {
  return emailEvidence(context).length;
}

export function calculateTrackedEmailSends(
  context: ReportMeasureCalculationContext,
): number {
  return emailEvidence(context).filter((email) => email.trackingKnown).length;
}

export function calculateEmailsOpened(
  context: ReportMeasureCalculationContext,
): number {
  return emailEvidence(context).filter(
    (email) => email.trackingKnown && email.opens > 0,
  ).length;
}

export function calculateEmailOpens(
  context: ReportMeasureCalculationContext,
): number {
  return emailEvidence(context)
    .filter((email) => email.trackingKnown)
    .reduce((total, email) => total + email.opens, 0);
}

export function calculateEmailOpenRate(
  context: ReportMeasureCalculationContext,
): number | null {
  const emails = emailEvidence(context);
  const tracked = emails.filter((email) => email.trackingKnown);
  if (tracked.length === 0) return null;
  return tracked.filter((email) => email.opens > 0).length / tracked.length;
}

export function calculateEmailTrackingCoverage(
  context: ReportMeasureCalculationContext,
): number | null {
  const emails = emailEvidence(context);
  if (emails.length === 0) return null;
  return emails.filter((email) => email.trackingKnown).length / emails.length;
}
