import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";
import {
  buildLeadObservations,
} from "./analytics-observations";

export type JourneyStageRow = {
  stage: string;
  leads: number;
  timelineCovered: number;
  contacted: number;
  responded: number;
  appointmentEvidence: number;
};

export type JourneyAnalysis = {
  rows: JourneyStageRow[];
  timelineLeads: number;
  contactedLeads: number;
  respondedLeads: number;
  appointmentEvidenceLeads: number;
};

export function buildJourneyAnalysis(
  dataset: AnalyticsDataset,
): JourneyAnalysis {
  const observations =
    buildLeadObservations(dataset);

  const byLead = new Map(
    observations.map((observation) => [
      observation.lead.leadId,
      observation,
    ]),
  );

  const stages = new Map<
    string,
    AnalyticsDataset["leads"]
  >();

  for (const lead of dataset.leads) {
    const stage =
      lead.stage.trim() || "Unknown";

    const existing = stages.get(stage);

    if (existing) {
      existing.push(lead);
    } else {
      stages.set(stage, [lead]);
    }
  }

  const rows = [...stages.entries()]
    .map(([stage, leads]) => {
      const observationsForStage =
        leads
          .map((lead) =>
            byLead.get(lead.leadId),
          )
          .filter(
            (
              value,
            ): value is ReturnType<
              typeof buildLeadObservations
            >[number] =>
              value !== undefined,
          );

      return {
        stage,
        leads: leads.length,
        timelineCovered: leads.filter(
          (lead) =>
            lead.timelineRecordIds.length > 0,
        ).length,
        contacted: observationsForStage.filter(
          (observation) =>
            observation.firstOutbound !== null,
        ).length,
        responded: observationsForStage.filter(
          (observation) =>
            observation.responseMinutes !== null,
        ).length,
        appointmentEvidence:
          observationsForStage.filter(
            (observation) =>
              observation.appointmentEvidence,
          ).length,
      };
    })
    .sort(
      (left, right) =>
        right.leads - left.leads ||
        left.stage.localeCompare(right.stage),
    );

  return {
    rows,
    timelineLeads: dataset.leads.filter(
      (lead) =>
        lead.timelineRecordIds.length > 0,
    ).length,
    contactedLeads: observations.filter(
      (observation) =>
        observation.firstOutbound !== null,
    ).length,
    respondedLeads: observations.filter(
      (observation) =>
        observation.responseMinutes !== null,
    ).length,
    appointmentEvidenceLeads:
      observations.filter(
        (observation) =>
          observation.appointmentEvidence,
      ).length,
  };
}
