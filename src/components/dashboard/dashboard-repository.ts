import "server-only";

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
};

type LeadRow = {
  id: string;
  status: string | null;
  stage: string | null;
  deal_status: string | null;
  sold_date: string | null;
};

type TimelineEventRow = {
  category: string | null;
  direction: string | null;
};

type TimelineRecordRow = {
  lead_id: string | null;
  timeline_events: TimelineEventRow[] | null;
};

type AppointmentRow = {
  scheduled_at: string;
  showed_at: string | null;
};

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = createServerSupabaseClient();

  const [
    { data: leads, error: leadsError },
    { data: timelines, error: timelineError },
    { data: appointments, error: appointmentsError },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("id, status, stage, deal_status, sold_date"),

    supabase
      .from("timeline_records")
      .select("lead_id, timeline_events(category, direction)")
      .not("lead_id", "is", null),

    supabase
      .from("appointments")
      .select("scheduled_at, showed_at"),
  ]);

  if (leadsError) {
    throw new Error(
      `Failed to load dashboard leads: ${leadsError.message}`,
    );
  }

  if (timelineError) {
    throw new Error(
      `Failed to load dashboard timeline coverage: ${timelineError.message}`,
    );
  }

  if (appointmentsError) {
    throw new Error(
      `Failed to load dashboard appointments: ${appointmentsError.message}`,
    );
  }

  const leadRows = (leads ?? []) as LeadRow[];
  const timelineRows = (timelines ?? []) as TimelineRecordRow[];
  const appointmentRows = (appointments ?? []) as AppointmentRow[];

  const totalLeads = leadRows.length;

  const activeLeads = leadRows.filter(
    (lead) => lead.status?.toLowerCase() === "active",
  ).length;

  const inConversation = leadRows.filter(
    (lead) => lead.stage?.toLowerCase() === "engage",
  ).length;

  const sales = leadRows.filter(
    (lead) =>
      lead.sold_date !== null ||
      ["closed or sold", "sold", "booked"].includes(
        lead.deal_status?.toLowerCase() ?? "",
      ),
  ).length;

  const now = Date.now();

  const upcomingAppointments = appointmentRows.filter(
    (appointment) => new Date(appointment.scheduled_at).getTime() >= now,
  ).length;

  const totalAppointmentsBooked = appointmentRows.length;

  const totalAppointmentsShown = appointmentRows.filter(
    (appointment) => appointment.showed_at !== null,
  ).length;

  const timelineLeadIds = new Set<string>();
  const communicationLeadIds = new Set<string>();
  const inboundLeadIds = new Set<string>();

  for (const timeline of timelineRows) {
    if (!timeline.lead_id) {
      continue;
    }

    timelineLeadIds.add(timeline.lead_id);

    for (const event of timeline.timeline_events ?? []) {
      if (event.category !== "communication") {
        continue;
      }

      communicationLeadIds.add(timeline.lead_id);

      if (event.direction === "inbound") {
        inboundLeadIds.add(timeline.lead_id);
      }
    }
  }

  return {
    totalLeads,
    activeLeads,
    engagedLeads: communicationLeadIds.size,
    inConversation,
    upcomingAppointments,
    totalAppointmentsBooked,
    totalAppointmentsShown,
    sales,
    timelineLeads: timelineLeadIds.size,
    timelineCoverageRate:
      totalLeads === 0
        ? 0
        : Math.round((timelineLeadIds.size / totalLeads) * 100),
    communicationLeads: communicationLeadIds.size,
    inboundResponseLeads: inboundLeadIds.size,
  };
}
