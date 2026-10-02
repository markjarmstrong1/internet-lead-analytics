import type { ReportableMetric } from "@/analytics/metrics/reportable-metric";
import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";
import { EvidenceLegend } from "@/components/app/evidence-legend";
import { AnalysisAnswer } from "@/components/analytics/analysis-answer";
import { AnalysisBreakdown } from "@/components/analytics/analysis-breakdown";
import { AnalysisLimitation } from "@/components/analytics/analysis-limitation";

type AnalyticsPageProps = {
  metric: ReportableMetric;
};

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

export function AnalyticsPage({
  metric,
}: AnalyticsPageProps) {
  const rate =
    metric.rate === null
      ? "—"
      : `${Math.round(metric.rate * 100)}%`;

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
          title={metric.title}
          description="Responses observed after the first qualifying outbound employee communication."
          value={rate}
          numerator={String(metric.numerator)}
          denominator={String(metric.denominator)}
          windowLabel={`${metric.windowHours}-hour response window`}
          classification={metric.classification}
          evidenceState="calculated"
        />

        <div className="mt-6">
          <AnalysisBreakdown rows={metric.breakdowns} />
        </div>

        <div className="mt-6 space-y-3">
          {metric.limitations.map((limitation) => (
            <AnalysisLimitation key={limitation}>
              {limitation}
            </AnalysisLimitation>
          ))}
        </div>
      </SectionPanel>

      <SectionPanel
        title="Evidence and drill-down"
        description="Trace analytical results from the metric to individual leads, events, and source evidence."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Qualifying exposures
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {metric.evidence.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              First qualifying outbound employee communication.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Observed responses
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {metric.numerator}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Inbound communication inside the response window.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Evidence records
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {metric.evidence.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Each record retains the exposure and outcome event references.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
          Detailed source evidence will become available here when the
          evidence read path exposes the underlying normalized and raw event
          records.
        </div>
      </SectionPanel>
    </div>
  );
}
