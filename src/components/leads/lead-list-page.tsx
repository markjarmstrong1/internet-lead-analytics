// src/components/leads/lead-list-page.tsx

import { buildLeadObservations } from "@/analytics/observations/analytics-observations";
import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";
import { LeadsNavigation } from "@/components/leads/leads-navigation";
import { LeadListTable } from "@/components/leads/lead-list-table";
import { SupabaseAnalyticsRepository } from "@/analytics/data/analytics-repository";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { listLeads } from "@/integrations/tekion/lead/supabase-lead-repository";

type LeadListPageProps = {
  searchParams: Promise<{
    status?: string;
    stage?: string;
    sourceGroup?: string;
    leadIds?: string;
    context?: string;
  }>;
};

export async function LeadListPage({
  searchParams,
}: LeadListPageProps) {
  const params = await searchParams;

  const reportLeadIds =
    params.leadIds
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? [];

  const leads = await listLeads(
    reportLeadIds.length > 0
      ? reportLeadIds
      : undefined,
  );

  const analyticsClient = createServerSupabaseClient();
  const analyticsRepository =
    new SupabaseAnalyticsRepository(analyticsClient);
  const analyticsDataset =
    await analyticsRepository.load();

  const observations = buildLeadObservations(
    analyticsDataset,
  );

  const leadIds = new Set(
    leads.map((lead) => lead.id),
  );

  const populationEvidence = Object.fromEntries(
    observations
      .filter((observation) =>
        leadIds.has(observation.lead.leadId),
      )
      .map((observation) => [
        observation.lead.leadId,
        {
          outbound:
            observation.evidence.outbound.state,
          response:
            observation.evidence.response.state,
          appointment:
            observation.evidence.appointment.state,
          outcome:
            observation.evidence.outcome.state,
        },
      ]),
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-8 lg:px-8">
      <PageHeader
        eyebrow="Lead management"
        title={
          reportLeadIds.length > 0
            ? params.context ?? "Report lead population"
            : "Leads"
        }
        description={
          reportLeadIds.length > 0
            ? "The exact lead population behind the selected report result. Evidence below is derived from the canonical analytics timeline."
            : "Find, filter, group, and open individual internet leads."
        }
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
            populationEvidence={populationEvidence}
            initialStatus={params.status ?? "all"}
            initialStage={params.stage ?? "all"}
            initialSourceGroup={params.sourceGroup ?? "all"}
          />
        </div>
      </SectionPanel>
    </div>
  );
}
