import Link from "next/link";

import { EvidenceState } from "@/components/app/evidence-state";
import { PageHeader } from "@/components/app/page-header";

import { getLeadDetail } from "@/integrations/tekion/lead/lead-detail-repository";
import {
  buildLeadDetailViewModel,
} from "@/integrations/tekion/lead/lead-detail-view-model";

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
          className="text-sm font-medium text-slate-500 hover:text-slate-950"
        >
          ← Back to Leads
        </Link>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-950">
                Lead not found
              </h1>

              <p className="mt-2 text-sm text-slate-500">
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
    <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-8 lg:px-8">
      <Link
        href="/leads/list"
        className="text-sm font-medium text-slate-500 hover:text-slate-950"
      >
        ← Back to Leads
      </Link>

      <PageHeader
        eyebrow="Lead detail"
        title={
          result.lead.contact_name ||
          "Unnamed lead"
        }
        description={`Canonical lead ${result.lead.external_record_id}`}
      />

      <LeadDetailSummary
        lead={result.lead}
        model={model}
      />

      <LeadDetailTimeline
        events={model.events}
      />
    </div>
  );
}
