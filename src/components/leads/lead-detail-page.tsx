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
        title="Customer / lead"
        description="A compact identity block for the lead."
      >
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Customer
            </p>
            <p className="mt-1 text-sm font-medium">Lead placeholder</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Phone
            </p>
            <p className="mt-1 text-sm">—</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Email
            </p>
            <p className="mt-1 text-sm">—</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Lead source
            </p>
            <p className="mt-1 text-sm">—</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Created
            </p>
            <p className="mt-1 text-sm">—</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Status
            </p>
            <p className="mt-1 text-sm">—</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Salesperson
            </p>
            <p className="mt-1 text-sm">—</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              BDC representative
            </p>
            <p className="mt-1 text-sm">—</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Vehicle
            </p>
            <p className="mt-1 text-sm">—</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Stock number
            </p>
            <p className="mt-1 text-sm">—</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              VIN
            </p>
            <p className="mt-1 text-sm">—</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Trade-in
            </p>
            <p className="mt-1 text-sm">—</p>
          </div>
        </div>
      </SectionPanel>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.8fr)]">
        <SectionPanel
          title="Timeline"
          description="The chronological evidence record for this lead."
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 rounded-lg border border-slate-200 p-1">
              <button
                type="button"
                className="rounded-md bg-slate-950 px-3 py-1.5 text-xs font-medium text-white"
              >
                Newest first
              </button>

              <button
                type="button"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                Oldest first
              </button>
            </div>

            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600"
            >
              Filter timeline
            </button>
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((event) => (
              <button
                key={event}
                type="button"
                className="relative w-full rounded-lg border border-slate-200 p-4 text-left transition hover:border-slate-400 hover:bg-slate-50"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      Timeline event placeholder
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Event type · Actor · Channel · Direction
                    </p>
                  </div>

                  <span className="text-xs text-slate-400">
                    Timestamp
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Event details and normalized interpretation will appear
                  here. Selecting the event will eventually open its evidence
                  details.
                </p>
              </button>
            ))}
          </div>
        </SectionPanel>

        <div className="space-y-6">
          <SectionPanel
            title="Tactics used"
            description="The methods, tactics, templates, and strings observed for this lead."
          >
            <div className="space-y-3">
              {[
                "Tactic placeholder",
                "Tactic placeholder",
                "Tactic placeholder",
              ].map((tactic, index) => (
                <div
                  key={`${tactic}-${index}`}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <p className="text-sm font-medium">{tactic}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Action → purpose → tactic → message
                  </p>
                </div>
              ))}
            </div>
          </SectionPanel>

          <SectionPanel
            title="Lead analysis"
            description="Calculated and observed information about this lead."
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
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
            <div className="min-h-32 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-400">
              Evidence and exception details will appear here.
            </div>
          </SectionPanel>
        </div>
      </div>
    </div>
  );
}
