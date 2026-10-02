import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";
import { StatPlaceholder } from "@/components/app/stat-placeholder";
import { EvidenceLegend } from "@/components/app/evidence-legend";

const categories = [
  "Action performance",
  "Source performance",
  "Communication",
  "Customer response",
  "Appointments",
  "Sales",
  "Trends",
  "Other analysis",
];

export function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-8 lg:px-8">
      <PageHeader
        eyebrow="Investigation"
        title="Analytics"
        description="Access calculations, comparisons, performance analysis, and the evidence behind them."
      />
      <EvidenceLegend 