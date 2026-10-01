import type { DashboardReportData } from "@/lib/dashboard/dashboard-report-data";
import type { DashboardWorkflowDetailData } from "@/lib/dashboard/dashboard-workflow-detail-data";
import { OverviewSection } from "./overview/overview-section";
import { WorkflowSection } from "./workflows/workflow-section";

type DashboardShellProps = {
  data: DashboardReportData;
  workflowDetails: Record<string, DashboardWorkflowDetailData>;
};

export function DashboardShell({
  data,
  workflowDetails,
}: DashboardShellProps) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Dealership reporting
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Internet Lead Analytics
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Understand what happened, where evidence exists, and what the underlying timeline supports.
          </p>
        </header>

        <div className="space-y-10">
          <OverviewSection
            taskCount={data.taskCount}
            workflowCount={data.workflowCount}
            summary={data.report.summary}
          />

          <WorkflowSection
            workflows={data.report.workflows}
            workflowDetails={workflowDetails}
          />
        </div>
      </div>
    </main>
  );
}
