import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: string;
  detail?: string;
  state?: ReactNode;
  variant?: "primary" | "supporting" | "outcome";
};

export function MetricCard({
  label,
  value,
  detail,
  state,
  variant = "supporting",
}: MetricCardProps) {
  return (
    <article
      data-metric-variant={variant}
      className="metric-card theme-density rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-[calc(1.25rem*var(--content-density))] shadow-[var(--shadow-card)]"
    >
      <div className="metric-card-header flex items-start justify-between gap-3">
        <p className="metric-card-label text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          {label}
        </p>

        {state ? (
          <span className="metric-card-state">{state}</span>
        ) : null}
      </div>

      <div className="metric-card-reading">
        <p className="metric-card-value mt-3 text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
      </div>

      {detail ? (
        <p className="metric-card-detail mt-2 text-xs leading-5 text-[var(--muted)]">
          {detail}
        </p>
      ) : null}
    </article>
  );
}
