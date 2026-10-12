"use client";

import Link from "next/link";

import { deleteReportAction } from "@/reports/actions";
import type { SavedReport } from "@/reports/report-types";

export function SavedReports({
  reports,
  activeReportId,
}: {
  reports: SavedReport[];
  activeReportId: string | null;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">
              Saved reports
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Reopen and reuse report configurations.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {reports.length}
          </span>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {reports.map((report) => {
          const active =
            report.id === activeReportId;

          return (
            <div
              key={report.id}
              className={[
                "flex items-center justify-between gap-3 px-4 py-3",
                active
                  ? "bg-slate-50"
                  : "hover:bg-slate-50",
              ].join(" ")}
            >
              <Link
                href={`/reports/builder?reportId=${encodeURIComponent(
                  report.id,
                )}`}
                aria-current={
                  active ? "page" : undefined
                }
                className="min-w-0 flex-1"
              >
                <span className="block truncate text-sm font-medium">
                  {report.name}
                </span>

                <span className="mt-1 block text-xs text-slate-500">
                  Updated {formatDate(report.updatedAt)}
                </span>
              </Link>

              <form
                action={deleteReportAction}
                onSubmit={(event) => {
                  if (
                    !window.confirm(
                      `Delete "${report.name}"? This cannot be undone.`,
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                <input
                  type="hidden"
                  name="reportId"
                  value={report.id}
                />

                <button
                  type="submit"
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-white hover:text-red-700"
                  aria-label={`Delete ${report.name}`}
                >
                  Delete
                </button>
              </form>
            </div>
          );
        })}

        {reports.length === 0 ? (
          <div className="px-5 py-8 text-sm leading-6 text-slate-500">
            No saved reports yet. Configure a report and
            save it to make it available here.
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
