import type { ImportBatch } from "./import-types";

type ImportBatchSummaryProps = {
  batch: ImportBatch;
};

export function ImportBatchSummary({
  batch,
}: ImportBatchSummaryProps) {
  const timelineEvents = batch.timelineFiles.reduce(
    (total, file) => total + file.events.length,
    0,
  );

  const csvRows = batch.csvFiles.reduce(
    (total, file) => total + file.rows.length,
    0,
  );

  return (
    <section className="grid gap-4 md:grid-cols-4">
      <SummaryItem
        label="Timeline files"
        value={batch.timelineFiles.length.toLocaleString()}
        detail={`${timelineEvents.toLocaleString()} normalized events`}
      />

      <SummaryItem
        label="CSV files"
        value={batch.csvFiles.length.toLocaleString()}
        detail={`${csvRows.toLocaleString()} source rows`}
      />

      <SummaryItem
        label="Source files"
        value={(
          batch.timelineFiles.length + batch.csvFiles.length
        ).toLocaleString()}
        detail="Files loaded in this import"
      />

      <SummaryItem
        label="Status"
        value="Preview"
        detail="Nothing persisted yet"
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
