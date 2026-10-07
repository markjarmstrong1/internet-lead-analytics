import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--border)] pb-6">
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="mt-1.5 text-3xl font-semibold tracking-[-0.025em]">
          {title}
        </h1>

        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
