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
        href="/leads/list"
        className="text-sm font-medium text-slate-500 hover:text-slate-950"
      >
        ← Back to Leads
      </Link>

      <PageHeader
        eyebrow="Lead detail"
        title="Lead placeholder"
        description={`Lead reference: ${leadId}`}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.8fr)]">
        <SectionPanel
          title="Customer / lead"
          compact
        >
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
            {[
              ["Customer", "Lead placeholder"],
              ["Phone", "—"],
              ["Email", "—"],
              ["Lead source", "—"],
              ["Created", "—"],
              ["Status", "—"],
              ["Salesperson", "—"],
              ["BDC representative", "—"],
              ["Vehicle", "—"],
              ["Stock number", "—"],
              ["VIN", "—"],
              ["Trade-in", "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {label}
                </p>
                <p className="mt-1 text-sm font-medium">{value}</p>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel
          title="Methods used"
          compact
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              "Method / tactic placeholder",
              "Method / tactic placeholder",
              "Method / tactic placeholder",
              "Method / tactic placeholder",
            ].map((method, index) => (
              <div
                key={`${method}-${index}`}
                className="rounded-lg border border-slate-200 p-2.5"
              >
                <p className="text-sm font-medium">{method}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Action → purpose → tactic → template → message
                </p>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>

      <div className="grid items-stretch gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.8fr)]">
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

        <SectionPanel
          title="Lead analytics"
          description="Calculated and observed information about this lead."
        >
          <div className="space-y-3">
            <StatPlaceholder label="First outbound → response" />
            <StatPlaceholder label="Response time" />
            <StatPlaceholder label="Outbound actions" />
            <StatPlaceholder label="Inbound responses" />
            <StatPlaceholder label="Tasks completed" />
            <StatPlaceholder label="Tasks missed" />
            <StatPlaceholder label="Appointment" />
            <StatPlaceholder label="Sale" />

            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Exceptions / evidence
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Missing evidence, limitations, and traceability will appear
                here.
              </p>
            </div>
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}
