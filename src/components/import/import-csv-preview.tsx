import type { ImportedCsvFile } from "./import-types";

type ImportCsvPreviewProps = {
  files: ImportedCsvFile[];
};

export function ImportCsvPreview({
  files,
}: ImportCsvPreviewProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      {files.map((file) => (
        <article
          key={file.fileName}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
              CSV preview
            </p>

            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              {file.fileName}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Showing the first 10 source rows. CSV data has not been
              transformed into the canonical model yet.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {file.headers.map((header, index) => (
                    <th
                      key={`${file.fileName}-header-${index}`}
                      className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700"
                    >
                      {header || `Column ${index + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {file.rows.slice(0, 10).map((row, rowIndex) => (
                  <tr key={`${file.fileName}-row-${rowIndex}`}>
                    {file.headers.map((_, columnIndex) => (
                      <td
                        key={`${file.fileName}-${rowIndex}-${columnIndex}`}
                        className="max-w-80 whitespace-nowrap px-4 py-3 text-slate-600"
                      >
                        {row[columnIndex] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {file.rows.length > 10 ? (
            <div className="border-t border-slate-200 px-6 py-4 text-sm text-slate-500">
              Showing the first 10 of {file.rows.length.toLocaleString()} rows.
            </div>
          ) : null}
        </article>
      ))}
    </section>
  );
}
