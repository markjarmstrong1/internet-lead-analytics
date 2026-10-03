// src/components/leads/lead-detail-page.tsx

import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";
import { StatPlaceholder } from "@/components/app/stat-placeholder";
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

function displayName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length <= 2) {
    return parts.join(" ");
  }

  return `${parts[0]} ${parts[parts.length - 1]}`;
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

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8">
          <h1 className="text-xl font-semibold text-slate-950">
            Lead not found
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            No canonical lead exists for this lead ID.
          </p>
        </div>
      </div>
    );
  }

  const { lead, timeline } = result;

    const events = timeline
    .flatMap((record) => record.events)
    .filter(
      (event) =>
        Boolean(event.id) &&
        Boolean(event.occurred_at),
    )
    .sort(
      (a, b) =>
        new Date(b.occurred_at).getTime() -
        new Date(a.occurred_at).getTime(),
    );

  const firstOutbound = [...events]
    .reverse()
    .find((event) => event.direction === "outbound");

  const lastEngaged = events.find(
    (event) => event.direction === "inbound",
  );

  const lastContacted = events.find(
    (event) =>
      event.direction === "outbound" &&
      Boolean(event.channel),
  );

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
        title={displayName(lead.contact_name) || "Unnamed lead"}
        description={`Lead ID: ${lead.external_record_id}`}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.8fr)]">
        <SectionPanel title="Customer / lead" compact>
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              ["Customer", displayName(lead.contact_name)],
              ["Lead ID", lead.external_record_id],
              ["Phone", lead.mobile_phone || lead.home_phone || lead.work_phone],
              ["Email", lead.email],
              ["Lead source", lead.source],
              ["Created", formatDate(lead.creation_time)],
              ["Status", lead.status],
              ["Stage", lead.stage],
              ["Deal status", lead.deal_status],
              ["Salesperson", lead.raw_data?.salesperson as string],
              ["BDC representative", lead.raw_data?.bdc_representative as string],
              [
                "Vehicle",
                [lead.vehicle_year, lead.vehicle_make, lead.vehicle_model]
                  .filter(Boolean)
                  .join(" "),
              ],
              ["Department", lead.department],
              ["Dealership", lead.dealership],
              ["Trade-in", lead.raw_data?.trade_in as string],
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

        <SectionPanel title="Methods used" compact>
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-medium">
                {events.length > 0
                  ? `${events.length} timeline event${
                      events.length === 1 ? "" : "s"
                    }`
                  : "No timeline events"}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Observed activity associated with this lead.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-medium">
                {lastContacted?.channel || "—"}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Most recent outbound contact channel.
              </p>
            </div>
          </div>
        </SectionPanel>
      </div>

      <div className="grid items-stretch gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.8fr)]">
        <SectionPanel
          title="Timeline"
          description="The chronological evidence record for this lead."
        >
          {events.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              No timeline evidence is currently linked to this lead.
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={`${event.timeline_record_id}:${event.source_event_id}`}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap justify-between gap-3">
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
                          .join(" · ") || "Observed event"}
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
                </div>
              ))}
            </div>
          )}
        </SectionPanel>

        <SectionPanel
          title="Lead analytics"
          description="Calculated and observed information about this lead."
        >
          <div className="space-y-3">
            <StatPlaceholder
              label="First outbound"
              value={formatDate(firstOutbound?.occurred_at ?? null)}
              detail="Earliest observed outbound event."
            />

            <StatPlaceholder
              label="Last engaged"
              value={formatDate(lastEngaged?.occurred_at ?? null)}
              detail="Most recent observed inbound event."
            />

            <StatPlaceholder
              label="Last contacted"
              value={formatDate(lastContacted?.occurred_at ?? null)}
              detail="Most recent observed outbound contact."
            />

            <StatPlaceholder
              label="Outbound actions"
              value={String(
                events.filter(
                  (event) => event.direction === "outbound",
                ).length,
              )}
              detail="Observed outbound timeline events."
            />

            <StatPlaceholder
              label="Inbound responses"
              value={String(
                events.filter(
                  (event) => event.direction === "inbound",
                ).length,
              )}
              detail="Observed inbound timeline events."
            />

            <StatPlaceholder
              label="Appointment"
              value="—"
              detail="No appointment evidence connected yet."
            />

            <StatPlaceholder
              label="Sale"
              value={lead.sold_date ? formatDate(lead.sold_date) : "—"}
              detail={
                lead.sold_date
                  ? "Recorded sold date."
                  : "No sale evidence recorded."
              }
            />

            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Exceptions / evidence
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Timeline metrics are based only on observed events currently
                linked to this canonical lead.
              </p>
            </div>
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}