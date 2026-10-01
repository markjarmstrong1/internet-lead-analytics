import type { TaskWorkflowReportSummary } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report-summary";
import { presentTaskWorkflowReportMetrics } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report-presentation";
import { SummaryCard } from "./summary-card";

type OverviewSectionProps = {
  taskCount: number;
  workflowCount: number;
  summary: TaskWorkflowReportSummary;
};

export function OverviewSection({
  taskCount,
  workflowCount,
  summary,
}: OverviewSectionProps) {
  const metrics =
    presentTaskWorkflowReportMetrics(
      summary.metrics,
    );

  const identityCoverage = metrics.find(
    (metric) =>
      metric.key === "identity_evidence_coverage",
  );

  const qualifyingOutbound = metrics.find(
    (metric) =>
      metric.key === "qualifying_outbound_evidence_rate",
  );

  return (
    <section aria-labelledby="overview-heading">
      <div className="mb-4">
        <h2
          id="overview-heading"
          className="text-lg font-semibold text-slate-950"
        >
          Overview
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          A high-level view of the evidence currently available.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Tasks"
          value={taskCount.toLocaleString()}
          detail="Historical Tekion Tasks loaded into the report."
        />

        <SummaryCard
          label="Workflows"
          value={workflowCount.toLocaleString()}
          detail="Distinct Task titles represented in the report."
        />

        <SummaryCard
          label="Timeline comparisons"
          value={summary.comparisonCount.toLocaleString()}
          detail="Task-to-timeline comparisons evaluated."
        />

        <SummaryCard
          label="Identity evidence"
          value={
            identityCoverage
              ? `${identityCoverage.numerator.toLocaleString()} / ${identityCoverage.denominator.toLocaleString()}`
              : "—"
          }
          detail={
            identityCoverage
              ? identityCoverage.label
              : undefined
          }
        />

        <SummaryCard
          label="Qualifying outbound"
          value={
            qualifyingOutbound
              ? `${qualifyingOutbound.numerator.toLocaleString()} / ${qualifyingOutbound.denominator.toLocaleString()}`
              : "—"
          }
          detail={
            qualifyingOutbound
              ? qualifyingOutbound.label
              : undefined
          }
        />
      </div>
    </section>
  );
}
