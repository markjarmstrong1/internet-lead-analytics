import Link from "next/link";

import { createServerAnalyticsRepository } from "@/analytics/data/create-server-analytics-repository";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";
import { ReportResults } from "@/components/reports/report-results";
import { ReportsNavigation } from "@/components/reports/reports-navigation";
import { buildReport } from "@/reports/build-report";
import { createServerReportRepository } from "@/reports/create-server-report-repository";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ReportViewingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const reportId = typeof params.reportId === "string" ? params.reportId : null;
  const repository = createServerReportRepository();
  const savedReports = await repository.list();
  const savedReport = reportId ? await repository.findById(reportId) : null;

  if (savedReport) {
    const dataset = await createServerAnalyticsRepository().load();
    const result = buildReport(dataset, savedReport.definition);

    return (
      <AppShell>
        <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8 lg:px-8">
          <PageHeader
            eyebrow="Reports / Saved report"
            title={savedReport.name}
            description="Review the latest results for this saved report, without the report builder."
            actions={
              <>
                <Link href="/reports/view" className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">All reports</Link>
                <Link href={`/reports/builder?reportId=${encodeURIComponent(savedReport.id)}`} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800">Edit report</Link>
              </>
            }
          />
          <ReportsNavigation />
          <SectionPanel title="Report results" description="Export a PDF or CSV, review metric evidence, or investigate the included leads.">
            <ReportResults
              result={result}
              pdfUrl={`/api/reports/${encodeURIComponent(savedReport.id)}/pdf`}
            />
          </SectionPanel>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8 lg:px-8">
        <PageHeader
          eyebrow="Reporting"
          title="Report library"
          description="Open saved management reports, review their latest results, and export presentation-ready copies."
          actions={
            <>
              <Link href="/reports/template-responses" className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Template response analysis</Link>
              <Link href="/reports" className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800">Build a report</Link>
            </>
          }
        />
        <ReportsNavigation />
        <SectionPanel title="Saved reports" description="Open a report to view results, or edit its definition.">
          {savedReports.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
              <h2 className="font-semibold text-slate-900">Your report library is empty</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">Build and save a report to make it available here. Results are recalculated from the currently loaded analytics data.</p>
              <Link href="/reports" className="mt-5 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">Create your first report</Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {savedReports.map((report) => (
                <article key={report.id} className="flex min-h-52 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="break-words text-base font-semibold text-slate-950">{report.name}</h2>
                  <p className="mt-1 text-xs text-slate-500">Updated {formatDate(report.updatedAt)}</p>
                  <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <dt className="text-xs text-slate-500">Grouped by</dt>
                      <dd className="mt-1 font-medium text-slate-800">{report.definition.groupBy === "none" ? "Entire population" : report.definition.groupBy}</dd>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <dt className="text-xs text-slate-500">Measures</dt>
                      <dd className="mt-1 font-medium text-slate-800">{report.definition.metrics.length}</dd>
                    </div>
                  </dl>
                  <div className="mt-auto flex flex-wrap gap-2 pt-5">
                    <Link href={`/reports/view?reportId=${encodeURIComponent(report.id)}`} className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">View report</Link>
                    <Link href={`/reports/builder?reportId=${encodeURIComponent(report.id)}`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Edit report</Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </SectionPanel>
      </div>
    </AppShell>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown date";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
