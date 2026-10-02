import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";
import { StatPlaceholder } from "@/components/app/stat-placeholder";

const categories = [
  "Action performance",
  "Source performance",
  "Communication",
  "Customer response",
  "Appointments",
  "Sales",
  "Trends",
  "Other analysis",
];

export function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-8 lg:px-8">
      <PageHeader
        eyebrow="Investigation"
        title="Analytics"
        description="Access calculations, comparisons, performance analysis, and the evidence behind them."
      />

      <SectionPanel
        title="Analysis categories"
        description="Select the type of question you want to investigate."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className="rounded-lg border border-slate-200 p-4 text-left text-sm font-medium hover:border-slate-400 hover:bg-slate-50"
            >
              {category}
            </button>
          ))}
        </div>
      </SectionPanel>

      <SectionPanel
        title="Selected analysis"
        description="The selected metric or analysis will occupy the main workspace."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatPlaceholder label="Primary metric" />
          <StatPlaceholder label="Denominator" />
          <StatPlaceholder label="Numerator" />
          <StatPlaceholder label="Classification" />
        </div>

        <div className="mt-6 grid min-h-80 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">
          Chart / analytical visualization
        </div>
      </SectionPanel>

      <SectionPanel
        title="Breakdown"
        description="Break the analysis down by channel, source, method, lead, or other supported dimension."
      >
        <div className="min-h-48 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-400">
          Analytical breakdown table
        </div>
      </SectionPanel>

      <SectionPanel
        title="Evidence and drill-down"
        description="Trace analytical results from the metric to individual leads, events, and source evidence."
      >
        <div className="min-h-36 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-400">
          Metric → breakdown → lead → timeline → evidence
        </div>
      </SectionPanel>
    </div>
  );
}
