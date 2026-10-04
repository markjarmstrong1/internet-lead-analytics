import { EvidenceState } from "@/components/app/evidence-state";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";
import { getDashboardMetrics } from "./dashboard-repository";

export async function DashboardPage() {
  const metrics = await getDashboardMetrics();

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-8 lg:px-8">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="A broad view of where the dealership's internet leads are today."
      />

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Current landscape</h2>
          <p className="mt-1 text-sm text-slate-500">
            Current-state statistics calculated from the canonical lead
            records.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Total leads"
            value={String(metrics.totalLeads)}
            detail="Canonical lead records"
            state={<EvidenceState kind="calculated" />}
          />

          <MetricCard
            label="Active leads"
            value={String(metrics.activeLeads)}
            detail="Status = Active"
            state={<EvidenceState kind="calculated" />}
          />

          <MetricCard
            label="In conversation"
            value={String(metrics.inConversation)}
            detail="Stage = Engage"
            state={<EvidenceState kind="calculated" />}
          />

          <MetricCard
            label="Appointments"
            value={String(metrics.appointments)}
            detail="Leads in Appt. Created stage"
            state={<EvidenceState kind="calculated" />}
          />

          <MetricCard
            label="Sales"
            value={String(metrics.sales)}
            detail="Leads with sold/closed evidence"
            state={<EvidenceState kind="calculated" />}
          />
        </div>
      </section>

      <SectionPanel
        title="Timeline evidence"
        description="Behavioral metrics are limited to leads for which timeline evidence has been imported."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label="Timeline coverage"
            value={`${metrics.timelineLeads} / ${metrics.totalLeads}`}
            detail={`${metrics.timelineCoverageRate}% of canonical leads`}
            state={<EvidenceState kind="calculated" />}
          />

          <MetricCard
            label="Observed communication"
            value={`${metrics.communicationLeads} / ${metrics.timelineLeads}`}
            detail="Among leads with timeline evidence"
            state={<EvidenceState kind="calculated" />}
          />

          <MetricCard
            label="Inbound responses"
            value={`${metrics.inboundResponseLeads} / ${metrics.timelineLeads}`}
            detail="Observed inbound communication"
            state={<EvidenceState kind="calculated" />}
          />
        </div>

        <p className="mt-5 text-xs leading-5 text-slate-400">
          Timeline metrics are not presented as percentages of all leads
          because timeline evidence currently covers only a subset of the
          canonical lead population.
        </p>
      </SectionPanel>

      <SectionPanel
        title="Broad view"
        description="High-level trends and landscape information will live here."
      >
        <div className="grid min-h-64 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">
          Dashboard visualization area
        </div>
      </SectionPanel>
    </div>
  );
}
