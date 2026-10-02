import type { ReactNode } from "react";

type SectionPanelProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function SectionPanel({
  title,
  description,
  children,
}: SectionPanelProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="font-semibold">{title}</h2>

        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}
