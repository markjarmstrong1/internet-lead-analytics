import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";
import { StatPlaceholder } from "@/components/app/stat-placeholder";

type LeadDetailPageProps = {
  leadId: string;
};

export function LeadDetailPage({ leadId }: LeadDetailPageProps) {
  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-8 lg:px-8">
      <Link
        href="/leads"
        className="text-sm font-medium text-slate-500 hover:text-slate-950"
      >
        ← Back to Leads
      </Link>

      <PageHeader
        eyebrow="Lead detail"
        title="Lead placeholder"
        description={`Lead reference: ${leadId}`}
      />

      <SectionPanel
        title="Lead header"
        description="Customer and lead identity information will live here."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatPlaceholder label="Phone" />
          <StatPlaceholder label="Email" />
          <StatPlaceholder label="Lead source" />
          <StatPlaceholder label="Lead creation date" />
          <StatPlaceholder label="Current status" />
          <StatPlaceholder label="Salesperson" />
          <StatPlaceholder label="BDC representative" />
          <StatPlaceholder label="Vehicle" />
          <StatPlaceholder label="Stock number" />
          <StatPlaceholder label="VIN" />
          <StatPlaceholder label="Trade-in" />
          <StatPlaceholder label="Appointment status" />
        </div>
      </SectionPanel>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatPlaceholder label="Lead age" />
        <StatPlaceholder label="Last dealership action" />
        <StatPlaceholder label="Last customer response" />
        <StatPlaceholder label="Deal status" />
      </section>

      <SectionPanel
        title="Timeline"
        description="The chronological evidence record for this lead."
      >
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((event) => (
            <button
              key={event}
              type="button"
              className="w-full rounded-lg border border-slate-200 p-4 text-left hover:bg-slate-50"
            >
              <div className="flex justify-between gap-4">
                <span className="font-medium">
                  Timeline event placeholder
                </span>
                <span className="text-xs text-slate-400">
                  Timestamp
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Actor · Channel · Direction · Event details
              </p>
            </button>
          ))}
        </div>
      </SectionPanel>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionPanel
          title="Lead analysis"
          description="Calculated and observed lead-level information."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <StatPlaceholder label="First outbound → response" />
            <StatPlaceholder label="Response time" />
            <StatPlaceholder label="Outbound actions" />
            <StatPlaceholder label="Inbound responses" />
            <StatPlaceholder label="Tasks completed" />
            <StatPlaceholder label="Tasks missed" />
            <StatPlaceholder label="Appointment" />
            <StatPlaceholder label="Sale" />
          </div>
        </SectionPanel>

        <SectionPanel
          title="Exceptions / evidence"
          description="Missing evidence, limitations, and traceability."
        >
          <div className="min-h-48 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-400">
            Evidence and exception details will appear here.
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}
