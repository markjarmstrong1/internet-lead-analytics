import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";
import {
  buildLeadObservations,
  median,
} from "./analytics-observations";

export type OverviewAnalysis = {
  totalLeads: number;
  timelineLeads: number;
  contactedLeads: number;
  respondedLeads: number;
  appointmentEvidenceLeads: number;
  soldClosedLeads: number;
  timelineCoverageRate: number | null;
  responseRate: number | null;
  responseWithin24h: number;
  responseWithin24hRate: number | null;
  medianResponseMinutes: number | null;
};

export function buildOverviewAnalysis(
  dataset: AnalyticsDataset,
): OverviewAnalysis {
  const observations =
    buildLeadObservations(dataset);

  const timelineLeads = dataset.leads.filter(
    (lead) => lead.timelineRecordIds.length > 0,
  ).length;

  const contactedLeads = observations.filter(
    (observation) =>
      observation.firstOutbound !== null,
  ).length;

  const respondedLeads = observations.filter(
    (observation) =>
      observation.responseMinutes !== null,
  ).length;

  const responseWithin24h =
    observations.filter(
      (observation) =>
        observation.respondedWithin24h,
    ).length;

  const responseTimes = observations
    .map(
      (observation) =>
        observation.responseMinutes,
    )
    .filter(
      (value): value is number =>
        value !== null,
    );

  return {
    totalLeads: dataset.leads.length,
    timelineLeads,
    contactedLeads,
    respondedLeads,
    appointmentEvidenceLeads:
      observations.filter(
        (observation) =>
          observation.appointmentEvidence,
      ).length,
    soldClosedLeads:
      dataset.leads.filter((lead) =>
        ["sold", "closed"].includes(
          lead.stage.trim().toLowerCase(),
        ),
      ).length,
    timelineCoverageRate: ratio(
      timelineLeads,
      dataset.leads.length,
    ),
    responseRate: ratio(
      respondedLeads,
      contactedLeads,
    ),
    responseWithin24h,
    responseWithin24hRate: ratio(
      responseWithin24h,
      contactedLeads,
    ),
    medianResponseMinutes:
      median(responseTimes),
  };
}

function ratio(
  numerator: number,
  denominator: number,
): number | null {
  return denominator === 0
    ? null
    : numerator / denominator;
}
