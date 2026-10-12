import Link from "next/link";

import { EvidenceState } from "@/components/app/evidence-state";
import { PageHeader } from "@/components/app/page-header";

import { getLeadDetail } from "@/integrations/tekion/lead/lead-detail-repository";
import { buildLeadDetailViewModel } from "@/integrations/tekion/lead/lead-detail-view-model";

import { LeadDetailSummary } from "./lead-detail-summary";
import { LeadDetailTimeline } from "./lead-detail-timeline";

type LeadDetailPageProps = {
  leadId: string;
};

export async function LeadDetailPage({
  leadId,
}: LeadDetailPageProps) {
  const result = await getLeadDetail(leadId);

  if (!result) {
    return (
      <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-8">
        <Link
          href="/leads/list"
          className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← Back to Leads
        </Link>

        <div className="mt-8 rounded-[10px] border bg-white p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Lead detail
              </p>

              <h1 className="mt-2 text-xl font-semibold">
                Lead not found
              </h1>

              <p className="mt-2 text-sm text-[var(--muted)]">
                No canonical lead exists for this lead ID.
              </p>
            </div>

            <EvidenceState kind="unknown" />
          </div>
        </div>
      </div>
    );
  }

  const model = buildLeadDetailViewModel(
    result.lead,
    result.timeline,
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8 lg:px-8">
      <Link
        href="/leads/list"
        className="inline-flex text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        ← Back to Leads
      </Link>

      <PageHeader
        eyebrow="Lead investigation"
        title={result.lead.contact_name || "Unnamed lead"}
        description={`${result.lead.external_record_id} · ${result.lead.source || "Unknown source"}`}
      />

      <LeadDetailSummary
        lead={result.lead}
        model={model}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.65fr)]">
        <LeadDetailTimeline
          events={model.events}
          templates={result.templates}
        />

        <LeadDetailSummary.Analytics
          lead={result.lead}
          model={model}
        />
      </div>
    </div>
  );
}
