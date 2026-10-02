import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";
import { StatPlaceholder } from "@/components/app/stat-placeholder";

export function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-8 lg:px-8">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="A broad view of where the dealership's internet leads are today."
      />

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Current landscape</h2>
          <p className="mt-1 text-sm text-slate-500">
            Current-state operational statistics.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatPlaceholder label="Active leads" />
          <StatPlaceholder label="Engaged leads / %" />
          <StatPlaceholder label="In conversation" />
          <StatPlaceholder
            label="Appointments"
            detail="Scheduled · total scheduled · shown"
          />
          <StatPlaceholder label="Sales" />
        </div>
      </section>

      <SectionPanel
        title="Broad view"
        description="High-level trends and landscape information will live here."
      >
        <div className="grid min-h-80 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">
          Dashboard visualization area
        </div>
      </SectionPanel>

      <SectionPanel
        title="Current activity"
        description="Additional current-state information can be added here."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-28 rounded-lg border border-dashed border-slate-300 bg-slate-50" />
          <div className="h-28 rounded-lg border border-dashed border-slate-300 bg-slate-50" />
          <div className="h-28 rounded-lg border border-dashed border-slate-300 bg-slate-50" />
        </div>
      </SectionPanel>
    </div>
  );
}
