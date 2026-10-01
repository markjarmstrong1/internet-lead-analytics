import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { buildDashboardReportData } from "@/lib/dashboard/dashboard-report-data";
import { buildDashboardWorkflowDetailData } from "@/lib/dashboard/dashboard-workflow-detail-data";

export default function Home() {
  const data = buildDashboardReportData();

  const workflowDetails = Object.fromEntries(
    data.report.workflows.map((workflow) => {
      const title = workflow.row.taskTitle;

      return [
        title,
        buildDashboardWorkflowDetailData(title),
      ];
    }),
  );

  return (
    <DashboardShell
      data={data}
      workflowDetails={workflowDetails}
    />
  );
}
