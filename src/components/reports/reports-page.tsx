import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";

const reportGroups = ["Daily", "Weekly", "Monthly", "Custom"];

export function ReportsPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-8 lg:px-8">
      <PageHeader
        eyebrow="Reporting"
        title="Reports"
        description="Review, configure, save, and export management-facing reports."
        actions={
          <button
            type="button"
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white"
          >
            Create report
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        {reportGroups.map((group) => (
          <SectionPanel key={group} title={`${group} reports`}>
            <p className="text-sm text-slate-400">
              Report list placeholder
            </p>
          </SectionPanel>
        ))}
      </div>

      <SectionPanel
        title="Report workspace"
        description="Custom reports can compare leads, sources, methods, actions, and other supported dimensions."
      >
        <div className="grid min-h-80 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">
          Custom report builder
        </div>
      </SectionPanel>

      <SectionPanel
        title="Export"
        description="Configured reports can eventually be exported in supported formats."
      >
        <div className="flex flex-wrap gap-3">
          {["PDF", "CSV", "Table", "Chart"].map((format) => (
            <button
              key={format}
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            >
              {format}
            </button>
          ))}
        </div>
      </SectionPanel>
    </div>
  );
}
