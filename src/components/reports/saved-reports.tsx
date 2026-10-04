import Link from "next/link";

import { deleteReportAction } from "@/reports/actions";
import type { SavedReport } from "@/reports/report-types";

export function SavedReports({
  reports,
}: {
  reports: SavedReport[];
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="font-semibold">
          Saved reports
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Reopen and reuse report configurations.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {reports.map((report) => (
          <div
            key={report.id}
            className="flex items-center justify-between gap-4 px-5 py-4"
          >
            <div className="min-w-0">
              <Link
                href={`/reports?reportId=${encodeURIComponent(
                  report.id,
                )}`}
                className="font-medium hover:underline"
              >
                {report.name}
              </Link>

              <p className="mt-1 text-xs text-slate-500">
                Updated{" "}
                {formatDate(report.updatedAt)}
              </p>
            </div>

            <form
              action={deleteReportAction}
            >
              <input
                type="hidden"
                name="reportId"
                value={report.id}
              />

              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
              >
                Delete
              </button>
            </form>
          </div>
        ))}

        {reports.length === 0 ? (
          <div className="px-5 py-8 text-sm text-slate-500">
            No saved reports yet. Build one below and save it.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function formatDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}
