import "server-only";

import {
  SupabaseAnalyticsRepository,
} from "@/analytics/data/analytics-repository";
import {
  buildLeadObservations,
  isSoldClosedStage,
} from "@/analytics/observations/analytics-observations";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

export type DashboardMetrics = {
  totalLeads: number;
  activeLeads: number;
  engagedLeads: number;
  inConversation: number;
  upcomingAppointments: number;
  totalAppointmentsBooked: number;
  totalAppointmentsShown: number;
  sales: number;
  timelineLeads: number;
  timelineCoverageRate: number;
  communicationLeads: number;
  inboundResponseLeads: number;
  observedOutboundLeads: number;
  responseRate: number | null;
  medianResponseMinutes: number | null;
};

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const client = createServerSupabaseClient();
  const repository = new SupabaseAnalyticsRepository(client);

  const dataset = await repository.load();
  const observations = buildLeadObservations(dataset);

  const totalLeads = dataset.leads.length;

  const activeLeads = dataset.leads.filter(
    (lead) => lead.status.trim().toLowerCase() === "active",
  ).length;

  const timelineLeadIds = new Set(
    dataset.leads
      .filter((lead) => lead.timelineRecordIds.length > 0)
      .map((lead) => lead.leadId),
  );

  const timelineLeads = timelineLeadIds.size;

  const communicationObservations = observations.filter(
    (observation) => observation.outboundCount > 0,
  );

  const engagedLeads = communicationObservations.length;

  const observedOutboundObservations = observations.filter(
    (observation) =>
      observation.evidence.outbound.state === "observed",
  );

  const observedOutboundLeads =
    observedOutboundObservations.length;

  const respondedObservations = observations.filter(
    (observation) =>
      observation.evidence.response.state === "observed",
  );

  const inboundResponseLeads =
    respondedObservations.length;

  const responseRate =
    observedOutboundLeads === 0
      ? null
      : inboundResponseLeads / observedOutboundLeads;

  const inConversation = observations.filter(
    (observation) =>
      observation.evidence.outbound.state === "observed" &&
      observation.evidence.response.state === "observed",
  ).length;

  const appointmentObservations = observations.filter(
    (observation) =>
      observation.evidence.appointment.state === "observed",
  );

  const totalAppointmentsBooked =
    appointmentObservations.length;

  /*
   * Appointment show evidence is intentionally not inferred from
   * current lead stage. The current canonical observation model
   * only establishes appointment-created evidence.
   *
   * Keep this at zero until appointment-shown evidence is modeled
   * explicitly rather than inventing a proxy.
   */
  const totalAppointmentsShown = 0;

  const now = Date.now();

  const upcomingAppointments = appointmentObservations.filter(
    (observation) =>
      observation.appointmentAt !== null &&
      Date.parse(observation.appointmentAt) >= now,
  ).length;

  const sales = observations.filter(
    (observation) =>
      observation.evidence.outcome.state === "observed" &&
      isSoldClosedStage(observation.lead.stage),
  ).length;

  const responseTimes = respondedObservations
    .map((observation) => observation.responseMinutes)
    .filter(
      (value): value is number => value !== null,
    )
    .sort((a, b) => a - b);

  const medianResponseMinutes =
    responseTimes.length === 0
      ? null
      : responseTimes.length % 2 === 1
        ? responseTimes[
            Math.floor(responseTimes.length / 2)
          ]
        : (
            responseTimes[
              responseTimes.length / 2 - 1
            ] +
            responseTimes[
              responseTimes.length / 2
            ]
          ) / 2;

  return {
    totalLeads,
    activeLeads,
    engagedLeads,
    inConversation,
    upcomingAppointments,
    totalAppointmentsBooked,
    totalAppointmentsShown,
    sales,
    timelineLeads,
    timelineCoverageRate:
      totalLeads === 0
        ? 0
        : Math.round(
            (timelineLeads / totalLeads) * 100,
          ),
    communicationLeads: engagedLeads,
    inboundResponseLeads,
    observedOutboundLeads,
    responseRate,
    medianResponseMinutes,
  };
}
