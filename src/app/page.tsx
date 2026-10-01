import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { buildDashboardReportData } from "@/lib/dashboard/dashboard-report-data";

export default function Home() {
  const data = buildDashboardReportData();

  return <DashboardShell data={data} />;
}
