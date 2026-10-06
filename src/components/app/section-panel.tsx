import type { ReactNode } from "react";

type SectionPanelProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  compact?: boolean;
};

export function SectionPanel({
  title,
  description,
  children,
  compact = false,
}: SectionPanelProps) {
  return (
    <section className="rounded-[10px] border bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div
        className={
          compact
            ? "border-b px-4 py-2.5"
            : "border-b px-5 py-4"
        }
      >
        <h2 className="text-[15px] font-semibold tracking-tight">
          {title}
        </h2>

        {description ? (
          <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
            {description}
          </p>
        ) : null}
      </div>

      <div className={compact ? "p-3" : "p-5"}>{children}</div>
    </section>
  );
}
