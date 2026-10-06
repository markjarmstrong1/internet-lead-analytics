import type { ReactNode } from "react";

type PanelProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Panel({
  title,
  description,
  actions,
  children,
  className = "",
}: PanelProps) {
  return (
    <section
      className={[
        "rounded-[10px] border bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
        className,
      ].join(" ")}
    >
      {title || description || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            {title ? (
              <h2 className="text-[15px] font-semibold tracking-tight">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}

      <div className="p-5">{children}</div>
    </section>
  );
}
