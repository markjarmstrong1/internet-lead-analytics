import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";
import { LeadsNavigation } from "@/components/leads/leads-navigation";
import { listLeads } from "@/integrations/tekion/lead/supabase-lead-repository";

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export async function LeadListPage() {
  const leads = await listLeads();

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-8 lg:px-8">
      <PageHeader
        eyebrow="Lead management"
        title="Leads"
        description="Find, filter, group, and open individual internet leads."
      />

      <LeadsNavigation active="list" />

      <SectionPanel
        title="All leads"
        description={`${leads.length} canonical lead${leads.length === 1 ? "" : "s"} loaded from Supabase.`}
      >
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="grid grid-cols-5 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Lead</span>
            <span>Status</span>
            <span>Lead source</span>
            <span>Created</span>
            <span />
          </div>

          {leads.length === 0 ? (
            <div className="px-4 py-10 text-sm text-slate-500">
              No canonical leads have been imported yet.
            </div>
          ) : (
            leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="grid grid-cols-5 border-b border-slate-100 px-4 py-4 text-sm last:border-b-0 hover:bg-slate-50"
              >
                <span className="font-medium">
                  {lead.contact_name || "Unnamed lead"}
                </span>
                <span className="text-slate-500">
                  {lead.status || "—"}
                </span>
                <span className="text-slate-500">
                  {lead.source || "—"}
                </span>
                <span className="text-slate-500">
                  {formatDate(lead.creation_time)}
                </span>
                <span className="text-right font-medium">
                  Open →
                </span>
              </Link>
            ))
          )}
        </div>
      </SectionPanel>
    </div>
  );
}
