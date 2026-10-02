import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";
import { getLeadDetail } from "@/integrations/tekion/lead/lead-detail-repository";

type LeadDetailPageProps = {
  leadId: string;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export async function LeadDetailPage({
  leadId,
}: LeadDetailPageProps) {
  const result = await getLeadDetail(leadId);

  if (!result) {
    return (
      <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-8">
        <Link
          href="/leads/list"
          className="text-sm font-medium text-slate-500 hover:text-slate-950"
        >
          ← Back to Leads
        </Link>

        <div className="mt-8">
          <PageHeader
            eyebrow="Lead detail"
            title="Lead not found"
            description={`No canonical lead exists for ${leadId}.`}
          />
        </div>
      </div>
    );
  }

  const { lead, timeline } = result;
  const events = timeline.flatMap((record) => record.events);

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-8 lg:px-8">
      <Link
        href="/leads/list"
        className="text-sm font-medium text-slate-500 hover:text-slate-950"
      >
        ← Back to Leads
      </Link>

      <PageHeader
        eyebrow="Lead detail"
        title={lead.contact_name || "Unnamed lead"}
        description={`${lead.source || "Unknown source"} · ${lead.status || "Status unknown"}`}
      />

      <SectionPanel
        title="Customer / lead"
        compact
      >
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Customer", lead.contact_name],
            ["Mobile phone", lead.mobile_phone],
            ["Email", lead.email],
            ["Lead source", lead.source],
            ["Created", formatDate(lead.creation_time)],
            ["Status", lead.status],
            ["Stage", lead.stage],
            ["Department", lead.department],
            ["Dealership", lead.dealership],
            [
              "Vehicle",
              [lead.vehicle_year, lead.vehicle_make, lead.vehicle_model]
                .filter(Boolean)
                .join(" ") || "—",
            ],
            ["Deal status", lead.deal_status],
            ["Sold date", formatDate(lead.sold_date)],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {label}
              </p>
              <p className="mt-1 text-sm font-medium">
                {value || "—"}
              </p>
            </div>
          ))}
        </div>
      </SectionPanel>

      <SectionPanel
        title="Timeline"
        description={`${events.length} event${events.length === 1 ? "" : "s"} across ${timeline.length} timeline record${timeline.length === 1 ? "" : "s"}.`}
      >
        {events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
            <p className="text-sm font-medium text-slate-600">
              No timeline events are linked to this lead yet.
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Timeline evidence will appear here once the source record is
              associated with this lead.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {event.raw_type || "Timeline event"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {[
                        event.category,
                        event.actor,
                        event.channel,
                        event.direction,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Event evidence"}
                    </p>
                  </div>

                  <span className="text-xs text-slate-400">
                    {formatDate(event.occurred_at)}
                  </span>
                </div>

                {event.details && (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {event.details}
                  </p>
                )}

                <p className="mt-3 text-xs text-slate-400">
                  Source: {event.source_file || "Unknown source"}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
