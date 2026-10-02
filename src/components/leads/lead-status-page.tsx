import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";
import { LeadsNavigation } from "@/components/leads/leads-navigation";

const linearStages = [
  "New",
  "Attempted contact",
  "Engaged",
  "In conversation",
];

export function LeadStatusPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-8 lg:px-8">
      <PageHeader
        eyebrow="Lead management"
        title="Lead status"
        description="A journey view of where leads are currently sitting in the customer process."
      />

      <LeadsNavigation active="status" />

      <SectionPanel
        title="Lead journey"
        description="The status model will eventually be populated from available evidence."
      >
        <div className="overflow-x-auto">
          <div className="min-w-[1180px] py-8">
            <div className="flex items-center">
              {linearStages.map((stage, index) => (
                <div key={stage} className="flex flex-1 items-center">
                  <button
                    type="button"
                    className="w-full rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-400 hover:shadow"
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                      Stage {index + 1}
                    </p>

                    <p className="mt-2 text-base font-semibold">
                      {stage}
                    </p>

                    <p className="mt-5 text-3xl font-semibold">—</p>

                    <p className="mt-1 text-xs text-slate-400">
                      leads
                    </p>
                  </button>

                  <div className="w-16 shrink-0 px-3">
                    <div className="relative h-px bg-slate-300">
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400">
                        →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[repeat(4,minmax(0,1fr))_64px_1fr] items-start">
              <div />
              <div />
              <div />
              <div className="relative flex justify-center">
                <div className="h-12 w-px bg-slate-300" />
              </div>

              <div />

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-slate-400 hover:shadow"
                >
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                    Branch A
                  </p>

                  <p className="mt-2 text-base font-semibold">
                    Constraint
                  </p>

                  <p className="mt-5 text-3xl font-semibold">—</p>

                  <p className="mt-1 text-xs text-slate-400">
                    leads
                  </p>
                </button>

                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-slate-400 hover:shadow"
                >
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                    Branch B
                  </p>

                  <p className="mt-2 text-base font-semibold">
                    Appointment scheduled
                  </p>

                  <p className="mt-5 text-3xl font-semibold">—</p>

                  <p className="mt-1 text-xs text-slate-400">
                    leads
                  </p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-[repeat(4,minmax(0,1fr))_64px_1fr]">
              <div />
              <div />
              <div />
              <div />
              <div />
              <div className="relative mt-0">
                <div className="mx-auto h-10 w-full">
                  <div className="absolute left-1/4 top-0 h-px w-1/2 bg-slate-300" />
                  <div className="absolute left-1/4 top-0 h-8 w-px bg-slate-300" />
                  <div className="absolute right-1/4 top-0 h-8 w-px bg-slate-300" />
                </div>
              </div>
            </div>

            <div className="ml-auto mt-2 w-[calc(50%-8px)]">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-300" />

                <button
                  type="button"
                  className="w-48 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-slate-400 hover:shadow"
                >
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                    Next stage
                  </p>

                  <p className="mt-2 text-base font-semibold">
                    Shown
                  </p>

                  <p className="mt-5 text-3xl font-semibold">—</p>

                  <p className="mt-1 text-xs text-slate-400">
                    leads
                  </p>
                </button>

                <div className="h-px flex-1 bg-slate-300" />
              </div>
            </div>

            <div className="flex justify-end pr-24">
              <div className="h-10 w-px bg-slate-300" />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="w-48 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-slate-400 hover:shadow"
              >
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                  Outcome
                </p>

                <p className="mt-2 text-base font-semibold">Sale</p>

                <p className="mt-5 text-3xl font-semibold">—</p>

                <p className="mt-1 text-xs text-slate-400">
                  leads
                </p>
              </button>
            </div>
          </div>
        </div>
      </SectionPanel>
    </div>
  );
}
