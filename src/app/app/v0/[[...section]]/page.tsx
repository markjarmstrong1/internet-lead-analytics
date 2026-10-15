import type { Metadata } from "next";
import { getDashboardMetrics } from "@/components/dashboard/dashboard-repository";
import { listLeads } from "@/integrations/tekion/lead/supabase-lead-repository";
import { getLeadDetail } from "@/integrations/tekion/lead/lead-detail-repository";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { MantikV0Workspace } from "@/components/mantik-v0/workspace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MANTIK | Evidence Intelligence",
  description:
    "Evidence-driven management intelligence for dealership internet leads.",
};

type RouteParams = {
  section?: string[];
};

export default async function MantikV0Route({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { section = [] } = await params;
  const view = section[0] || "dashboard";
  const leadId =
    view === "leads" && section.length > 1
      ? section[1]
      : null;

  const [records, metrics, detail] = await Promise.all([
    listLeads(),
    getDashboardMetrics(),
    leadId
      ? getLeadDetail(leadId)
      : Promise.resolve(null),
  ]);

  let timelineLeadIds: string[] = [];

  if (view === "exceptions") {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("timeline_records")
      .select("lead_id")
      .not("lead_id", "is", null);

    if (error) {
      throw new Error(
        `Could not load timeline coverage: ${error.message}`,
      );
    }

    timelineLeadIds = [
      ...new Set(
        (data ?? [])
          .map((row) => row.lead_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
  }

  const leads = records.map((lead) => ({
    id: lead.id,
    name: lead.contact_name || "",
    externalId: lead.external_record_id || "",
    source: lead.source || "",
    sourceGroup: lead.lead_source_group || "",
    status: lead.status || "",
    stage: lead.stage || "",
    createdAt: lead.creation_time,
    lastContactedAt: lead.last_contacted_at,
    lastEngagedAt: lead.last_engaged_at,
    vehicle: [
      lead.vehicle_year,
      lead.vehicle_make,
      lead.vehicle_model,
    ]
      .filter(Boolean)
      .join(" "),
    dealStatus: lead.deal_status || "",
  }));

  const leadDetail = detail
    ? {
        lead: {
          id: detail.lead.id,
          name: detail.lead.contact_name || "",
          externalId: detail.lead.external_record_id || "",
          source: detail.lead.source || "",
          sourceGroup: detail.lead.lead_source_group || "",
          status: detail.lead.status || "",
          stage: detail.lead.stage || "",
          createdAt: detail.lead.creation_time,
          vehicle: [
            detail.lead.vehicle_year,
            detail.lead.vehicle_make,
            detail.lead.vehicle_model,
          ]
            .filter(Boolean)
            .join(" "),
          dealStatus: detail.lead.deal_status || "",
          soldDate: detail.lead.sold_date,
        },
        events: detail.timeline
          .flatMap((record) => record.events)
          .sort(
            (a, b) =>
              new Date(b.occurred_at).getTime() -
              new Date(a.occurred_at).getTime(),
          )
          .map((event) => ({
            id: event.id,
            occurredAt: event.occurred_at,
            type: event.raw_type || "Timeline event",
            category: event.category || "",
            actor: event.actor || "",
            actorType: event.actor_type || "",
            channel: event.channel || "",
            direction: event.direction || "",
            details: event.details || "",
            sourceFile: event.source_file || "",
            sourceEventId: event.source_event_id || "",
            templateCode: event.template_code || "",
            rawData: event.raw_data,
            metadata: event.metadata,
          })),
      }
    : null;

  return (
    <MantikV0Workspace
      view={view}
      leadId={leadId}
      leads={leads}
      metrics={metrics}
      leadDetail={leadDetail}
      timelineLeadIds={timelineLeadIds}
    />
  );
}
