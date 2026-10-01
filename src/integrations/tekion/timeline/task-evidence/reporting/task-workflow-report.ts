import {
  calculateTaskWorkflowReportMetrics,
  type TekionReportMetric,
} from "./task-workflow-report-metrics";
import {
  buildTaskWorkflowReportSummary,
  type TaskWorkflowReportSummary,
} from "./task-workflow-report-summary";
import type { TaskWorkflowReportRow } from "./task-workflow-report-row";

export type TaskWorkflowReportItem = {
  row: TaskWorkflowReportRow;
  metrics: TekionReportMetric[];
};

export type TaskWorkflowReport = {
  summary: TaskWorkflowReportSummary;
  workflows: TaskWorkflowReportItem[];
};

export function buildTaskWorkflowReport(
  rows: TaskWorkflowReportRow[],
): TaskWorkflowReport {
  return {
    summary: buildTaskWorkflowReportSummary(rows),
    workflows: rows.map((row) => ({
      row,
      metrics: calculateTaskWorkflowReportMetrics(row),
    })),
  };
}
