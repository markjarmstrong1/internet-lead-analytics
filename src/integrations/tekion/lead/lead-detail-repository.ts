import "server-only";

import { unstable_noStore as noStore } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server-client";

export type LeadDetail = {
  id: string;
  source_system: string;
  source_type: string;
  external_record_id: string;
  contact_name: string;
  creation_time: string | null;
  source: string;
  vehicle_interest: string;
  source_type_detailed: string;
  lead_source_group: string;
  email: string;
  mobile_phone: string;
  home_phone: string;
  work_phone: string;
  vehicle_year: string;
  vehicle_make: string;
  vehicle_model: string;
  status: string;
  stage: string;
  department: string;
  dealership: string;
  deal_status: string;
  sold_date: string | null;
  closed_time: string | null;
  raw_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type LeadTimelineEvent = {
  id: string;
  timeline_record_id: string;
  source_event_id: string;
  source_file: string | null;
  occurred_at: string;
  raw_type: string;
  actor: string;
  actor_type: string;
  category: string;
  channel: string | null;
  direction: string | null;
  details: string;
  metadata: Record<string, unknown>;
  raw_data: Record<string, unknown>;
  template_code: string | null;
};

export type LeadTemplateOption = {
  template_code: string;
  name: string;
};

export type LeadTimelineRecord = {
  id: string;
  external_record_id: string | null;
  source_file: string | null;
  fixture_source_key: string | null;
  events: LeadTimelineEvent[];
};

export type LeadDetailResult = {
  lead: LeadDetail;
  timeline: LeadTimelineRecord[];
  templates: LeadTemplateOption[];
};

export async function getLeadDetail(
  leadId: string,
): Promise<LeadDetailResult | null> {
  noStore();

  const supabase = createServerSupabaseClient();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError) {
    throw new Error(
      `Failed to load lead ${leadId}: ${leadError.message}`,
    );
  }

  if (!lead) {
    return null;
  }

  const { data: templateRows, error: templatesError } = await supabase
    .from("templates")
    .select("template_code,name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (templatesError) {
    throw new Error(`Failed to load active templates: ${templatesError.message}`);
  }

  const templates: LeadTemplateOption[] = templateRows ?? [];

  const { data: records, error: recordsError } = await supabase
    .from("timeline_records")
    .select("*")
    .eq("lead_id", lead.id)
    .order("created_at", { ascending: true });

  if (recordsError) {
    throw new Error(
      `Failed to load timeline records for lead ${lead.id}: ${recordsError.message}`,
    );
  }

  const recordIds = (records ?? []).map(
    (record) => record.id,
  );

  if (recordIds.length === 0) {
    return {
      lead,
      timeline: [],
      templates,
    };
  }

  const { data: events, error: eventsError } = await supabase
    .from("timeline_events")
    .select("*")
    .in("timeline_record_id", recordIds)
    .order("occurred_at", { ascending: false });

  if (eventsError) {
    throw new Error(
      `Failed to load timeline events for lead ${lead.id}: ${eventsError.message}`,
    );
  }

  const eventsByRecord = new Map<
    string,
    LeadTimelineEvent[]
  >();

  for (const event of events ?? []) {
    const existing =
      eventsByRecord.get(event.timeline_record_id) ?? [];

    existing.push(event);

    eventsByRecord.set(
      event.timeline_record_id,
      existing,
    );
  }

  return {
    lead,
    timeline: (records ?? []).map((record) => ({
      id: record.id,
      external_record_id:
        record.external_record_id,
      source_file: record.source_file,
      fixture_source_key:
        record.fixture_source_key,
      events:
        eventsByRecord.get(record.id) ?? [],
    })),
    templates,
  };
}
