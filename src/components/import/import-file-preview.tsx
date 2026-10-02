import type { ImportBatch } from "./import-types";

type ImportFilePreviewProps = {
  batch: ImportBatch;
};

export function ImportFilePreview({
  batch,
}: ImportFilePreviewProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
          Import files
        </p>

        <h2 className="mt-1 text-xl font-semibold text-slate-950">
          Source inventory
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Every selected file is shown before any data is persisted.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {batch.timelineFiles.map((file) => (
          <div
            key={`timeline-${file.sourceKey}`}
            className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
          >
            <div>
              <p className="font-medium text-slate-950">
                {file.fileName}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Timeline · {file.events.length.toLocaleString()} events
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              .txt
            </span>
          </div>
        ))}

        {batch.csvFiles.map((file) => (
          <div
            key={`csv-${file.fileName}`}
            className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
          >
            <div>
              <p className="font-medium text-slate-950">
                {file.fileName}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                CSV · {file.rows.length.toLocaleString()} rows ·{" "}
                {file.headers.length.toLocaleString()} columns
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              .csv
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
