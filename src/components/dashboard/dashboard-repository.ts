import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server-client";

export type DashboardMetrics = {
  totalLeads: number;
  activeLeads: number;
  inConversation: number;
  appointments: number;
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

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = createServerSupabaseClient();

  const [{ data: leads, error: leadsError }, { data: timelines, error: timelineError }] =
    await Promise.all([
      supabase
        .from("leads")
        .select("id, status, stage, deal_status, sold_date"),

      supabase
        .from("timeline_records")
        .select("lead_id, timeline_events(category, direction)")
        .not("lead_id", "is", null),
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

  const leadRows = (leads ?? []) as LeadRow[];
  const timelineRows = (timelines ?? []) as TimelineRecordRow[];

  const totalLeads = leadRows.length;

  const activeLeads = leadRows.filter(
    (lead) => lead.status?.toLowerCase() === "active",
  ).length;

  const inConversation = leadRows.filter(
    (lead) => lead.stage?.toLowerCase() === "engage",
  ).length;

  const appointments = leadRows.filter(
    (lead) => lead.stage?.toLowerCase() === "appt. created",
  ).length;

  const sales = leadRows.filter(
    (lead) =>
      lead.sold_date !== null ||
      ["closed or sold", "sold", "booked"].includes(
        lead.deal_status?.toLowerCase() ?? "",
      ),
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
    inConversation,
    appointments,
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
