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
    <article className="theme-density rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-[calc(1.25rem*var(--content-density))] shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          {label}
        </p>
        {state}
      </div>

      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>

      {detail ? (
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          {detail}
        </p>
      ) : null}
    </article>
  );
}
