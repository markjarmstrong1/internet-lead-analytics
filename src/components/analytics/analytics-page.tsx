import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";
import { EvidenceLegend } from "@/components/app/evidence-legend";
import { AnalysisAnswer } from "@/components/analytics/analysis-answer";
import { AnalysisBreakdown } from "@/components/analytics/analysis-breakdown";
import { AnalysisLimitation } from "@/components/analytics/analysis-limitation";

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

const breakdownRows = [
  {
    key: "email",
    label: "Email",
    numerator: 0,
    denominator: 0,
    rate: null,
  },
  {
    key: "text",
    label: "Text",
    numerator: 0,
    denominator: 0,
    rate: null,
  },
  {
    key: "phone",
    label: "Phone",
    numerator: 0,
    denominator: 0,
    rate: null,
  },
  {
    key: "voicemail",
    label: "Voicemail",
    numerator: 0,
    denominator: 0,
    rate: null,
  },
];

export function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-8 lg:px-8">
      <PageHeader
        eyebrow="Investigation"
        title="Analytics"
        description="Access calculations, comparisons, performance analysis, and the evidence behind them."
      />

      <EvidenceLegend />

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
        <AnalysisAnswer
          title="Inbound communication response rate"
          description="Responses observed after the first qualifying outbound employee communication."
          value="—"
          numerator="—"
          denominator="—"
          windowLabel="24-hour response window"
          classification="descriptive"
          evidenceState="unknown"
        />

        <div className="mt-6">
          <AnalysisBreakdown rows={breakdownRows} />
        </div>

        <div className="mt-6">
          <AnalysisLimitation>
            This is an observational descriptive metric. It identifies
            communication responses in the available evidence but does not
            establish that the outbound communication caused the response.
          </AnalysisLimitation>
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
