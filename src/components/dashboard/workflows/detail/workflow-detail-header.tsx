type WorkflowDetailHeaderProps = {
  title: string;
  comparisonCount: number;
};

export function WorkflowDetailHeader({
  title,
  comparisonCount,
}: WorkflowDetailHeaderProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Workflow investigation
      </p>

      <div className="mt-1 flex items-baseline justify-between gap-6">
        <h3 className="text-lg font-semibold text-slate-950">
          {title}
        </h3>

        <span className="shrink-0 text-sm tabular-nums text-slate-500">
          {comparisonCount.toLocaleString()} evidence comparisons
        </span>
      </div>
    </div>
  );
}
