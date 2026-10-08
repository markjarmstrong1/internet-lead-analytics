// src/components/leads/lead-list-page.tsx

import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";
import { LeadsNavigation } from "@/components/leads/leads-navigation";
import { LeadListTable } from "@/components/leads/lead-list-table";
import { listLeads } from "@/integrations/tekion/lead/supabase-lead-repository";

type LeadListPageProps = {
  searchParams: Promise<{
    status?: string;
    stage?: string;
    sourceGroup?: string;
  }>;
};

export async function LeadListPage({
  searchParams,
}: LeadListPageProps) {
  const [leads, params] = await Promise.all([
    listLeads(),
    searchParams,
  ]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-8 lg:px-8">
      <PageHeader
        eyebrow="Lead management"
        title="Leads"
        description="Find, filter, group, and open individual internet leads."
      />

      <LeadsNavigation active="list" />

      <SectionPanel
        title="Lead queue"
        description={`${leads.length} canonical lead${
          leads.length === 1 ? "" : "s"
        } available for investigation.`}
      >
        <div className="overflow-hidden rounded-[10px] border bg-white">
          <LeadListTable
            leads={leads}
            initialStatus={params.status ?? "all"}
            initialStage={params.stage ?? "all"}
            initialSourceGroup={params.sourceGroup ?? "all"}
          />
        </div>
      </SectionPanel>
    </div>
  );
}
