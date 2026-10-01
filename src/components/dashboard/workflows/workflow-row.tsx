import type { TaskWorkflowReportItem } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report";

type WorkflowRowProps = {
  workflow: TaskWorkflowReportItem;
  selected: boolean;
  onSelect: () => void;
};

export function WorkflowRow({
  workflow,
  selected,
  onSelect,
}: WorkflowRowProps) {
  const {
    row,
    metrics,
  } = workflow;

  const identity = metrics.find(
    (metric) =>
      metric.key === "identity_evidence_coverage",
  );

  const communication = metrics.find(
    (metric) =>
      metric.key === "qualifying_outbound_evidence_rate",
  );

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "grid w-full grid-cols-[minmax(0,1fr)_100px_150px_170px] items-center gap-4",
        "border-b border-slate-100 px-5 py-4 text-left transition",
        "hover:bg-slate-50",
        selected ? "bg-slate-50" : "bg-white",
      ].join(" ")}
    >
      <span className="min-w-0">
        <span className="block truncate font-medium text-slate-950">
          {row.taskTitle}
        </span>
      </span>

      <span className="text-sm tabular-nums text-slate-600">
        {row.taskCount.toLocaleString()}
      </span>

      <span className="text-sm tabular-nums text-slate-600">
        {identity?.displayValue ?? "—"}
      </span>

      <span className="text-sm tabular-nums text-slate-600">
        {communication?.displayValue ?? "—"}
      </span>
    </button>
  );
}
