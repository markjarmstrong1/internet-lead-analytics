import type { ReportableMetric } from "@/analytics/metrics/reportable-metric";
import type { ResponseSpeedOutcomesMetric } from "@/analytics/metrics/response-speed-outcomes";
import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";
import { EvidenceLegend } from "@/components/app/evidence-legend";
import { AnalysisAnswer } from "@/components/analytics/analysis-answer";
import { AnalysisBreakdown } from "@/components/analytics/analysis-breakdown";
import { AnalysisEvidenceTable } from "@/components/analytics/analysis-evidence-table";
import { AnalysisLimitation } from "@/components/analytics/analysis-limitation";
import { AnalysisMethod } from "@/components/analytics/analysis-method";
import { ResponseSpeedOutcomes } from "@/components/analytics/response-speed-outcomes";

type AnalyticsPageProps = {
  metric: ReportableMetric;
  responseSpeedOutcomes: ResponseSpeedOutcomesMetric;
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
  responseSpeedOutcomes,
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

      <ResponseSpeedOutcomes
        metric={responseSpeedOutcomes}
      />

      <SectionPanel
        title="Analysis areas"
        description="Available areas for investigation as analytical definitions are added."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <div
              key={category}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <p className="text-sm font-medium text-slate-700">
                {category}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Analysis available as a defined metric is added.
              </p>
            </div>
          ))}
        </div>
      </SectionPanel>

      <SectionPanel
        title="Selected analysis"
        description="The selected metric or analysis occupies the main workspace."
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
          <AnalysisMethod
            items={[
              {
                label: "Population",
                value:
                  "Timeline records containing a qualifying outbound employee communication.",
              },
              {
                label: "Exposure",
                value:
                  "The first outbound employee communication with a recognized channel.",
              },
              {
                label: "Outcome",
                value:
                  "The first inbound communication observed after the exposure.",
              },
              {
                label: "Window",
                value: `${metric.windowHours} hours after the exposure.`,
              },
            ]}
          />
        </div>

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

        <div className="mt-5">
          <AnalysisEvidenceTable evidence={metric.evidence} />
        </div>

        <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
          These are normalized evidence links used by the metric. Raw source
          event details will be exposed separately when the evidence read path
          is added.
        </div>
      </SectionPanel>
    </div>
  );
}
