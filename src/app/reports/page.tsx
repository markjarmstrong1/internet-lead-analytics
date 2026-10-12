import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { ReportsHome } from "@/components/reports/reports-home";
import { ReportsNavigation } from "@/components/reports/reports-navigation";
import { createServerReportRepository } from "@/reports/create-server-report-repository";

export const dynamic = "force-dynamic";

export default async function ReportsHomePage() {
  const reports = await createServerReportRepository().list();

  return (
    <AppShell>
      <div className="mx-auto max-w-[1500px] space-y-7 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageHeader
          eyebrow="Workspace / Management intelligence"
          title="Reports"
          description="Build, organize, and review management reports from your lead analytics."
          actions={
            <Link href="/reports/builder" className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
              + Create report
            </Link>
          }
        />
        <ReportsNavigation />
        <ReportsHome reports={reports} />
      </div>
    </AppShell>
  );
}
