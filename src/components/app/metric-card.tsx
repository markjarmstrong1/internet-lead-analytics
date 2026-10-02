import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: string;
  detail?: string;
  state?: ReactNode;
};

export function MetricCard({
  label,
  value,
  detail,
  state,
}: MetricCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {state}
      </div>

      <p className="mt-3 text-3xl font-semibold tracking-tight">
        {value}
      </p>

      {detail ? (
        <p className="mt-2 text-xs text-slate-400">{detail}</p>
      ) : null}
    </article>
  );
}
