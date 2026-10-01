import type { TekionNormalizedTimelineEvent } from "@/integrations/tekion/timeline/normalized-timeline-event";

type ImportSummaryProps = {
  fileName: string;
  events: TekionNormalizedTimelineEvent[];
};

export function ImportSummary({
  fileName,
  events,
}: ImportSummaryProps) {
  const categories = new Set(
    events.map((event) => event.category),
  );

  const communications = events.filter(
    (event) => event.category === "communication",
  ).length;

  return (
    <section className="grid gap-4 md:grid-cols-4">
      <SummaryItem
        label="Timeline"
        value={fileName}
        detail="Source file"
      />

      <SummaryItem
        label="Events"
        value={events.length.toLocaleString()}
        detail="Normalized timeline events"
      />

      <SummaryItem
        label="Categories"
        value={categories.size.toLocaleString()}
        detail="Distinct event categories"
      />

      <SummaryItem
        label="Communications"
        value={communications.toLocaleString()}
        detail="Communication events"
      />
    </section>
  );
}

function SummaryItem({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 truncate text-xl font-semibold text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  );
}
