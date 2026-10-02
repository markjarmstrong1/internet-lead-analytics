// src/components/leads/lead-list-page.tsx

import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";
import { LeadsNavigation } from "@/components/leads/leads-navigation";
import { LeadListTable } from "@/components/leads/lead-list-table";
import { listLeads } from "@/integrations/tekion/lead/supabase-lead-repository";

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
        description={`${leads.length} canonical lead${
          leads.length === 1 ? "" : "s"
        } loaded from Supabase.`}
      >
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <LeadListTable leads={leads} />
        </div>
      </SectionPanel>
    </div>
  );
}