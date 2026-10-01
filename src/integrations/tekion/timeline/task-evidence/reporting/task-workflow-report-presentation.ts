import type { TekionReportMetric } from "./task-workflow-report-metrics";
import {
  TASK_WORKFLOW_REPORT_METRIC_DEFINITIONS,
} from "./task-workflow-report-metric-definitions";

export type TekionReportMetricPresentation = TekionReportMetric & {
  label: string;
  numeratorText: string;
  denominatorText: string;
  displayValue: string;
};

export function presentTaskWorkflowReportMetric(
  metric: TekionReportMetric,
): TekionReportMetricPresentation {
  const definition =
    TASK_WORKFLOW_REPORT_METRIC_DEFINITIONS.find(
      (item) => item.key === metric.key,
    );

  if (!definition) {
    throw new Error(
      `Missing report metric definition: ${metric.key}`,
    );
  }

  return {
    ...metric,
    label: definition.label,
    numeratorText: definition.numeratorDefinition,
    denominatorText: definition.denominatorDefinition,
    displayValue:
      metric.rate === undefined
        ? "—"
        : `${(metric.rate * 100).toFixed(1)}%`,
  };
}

export function presentTaskWorkflowReportMetrics(
  metrics: TekionReportMetric[],
): TekionReportMetricPresentation[] {
  return metrics.map(presentTaskWorkflowReportMetric);
}
