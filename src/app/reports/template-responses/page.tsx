import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";
import { TemplateResponseReport } from "@/components/reports/template-response-report";
import { ReportsNavigation } from "@/components/reports/reports-navigation";
import { createServerAnalyticsRepository } from "@/analytics/data/create-server-analytics-repository";
import { buildTemplateResponseAnalysis } from "@/reports/template-response-analysis";

export const dynamic = "force-dynamic";

export default async function TemplateResponsesPage() {
  const dataset = await createServerAnalyticsRepository().load();
  const analysis = buildTemplateResponseAnalysis(dataset);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8 lg:px-8">
        <PageHeader
          eyebrow="Reporting / Message performance"
          title="Template response analysis"
          description="Compare canonical template-coded outbound actions by their observed inbound response within 24 hours."
        />

        <ReportsNavigation />

        <SectionPanel
          title="Response performance"
          description="Each matched template-coded outbound action counts as one use. A lead can contribute multiple uses."
        >
          <TemplateResponseReport
            analysis={analysis}
            templates={dataset.templates ?? []}
          />
        </SectionPanel>
      </div>
    </AppShell>
  );
}
