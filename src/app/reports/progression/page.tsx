import { loadProgressionAnalysis } from "@/analytics/progression/load-progression-analysis";
import { buildProgressionReport } from "@/analytics/progression/build-progression-report";
import { ProgressionManagementReportView } from "@/components/reports/progression-management-report";

export const dynamic = "force-dynamic";

export default async function ProgressionManagementReportRoute() {
  const analysis = await loadProgressionAnalysis();
  const report = buildProgressionReport(analysis);
  return <ProgressionManagementReportView report={report} />;
}
