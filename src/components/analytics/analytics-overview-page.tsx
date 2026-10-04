import { EvidenceState } from "@/components/app/evidence-state";
import { MetricCard } from "@/components/app/metric-card";
import { SectionPanel } from "@/components/app/section-panel";

import type { OverviewAnalysis } from "@/analytics/metrics/overview";

function formatPercent(
  value: number | null,
): string {
  return value === null
    ? "—"
    : `${(value * 100).toFixed(1)}%`;
}

function formatMinutes(
  value: number | null,
): string {
  if (value === null) {
    return "—";
  }

  if (value < 60) {
    return `${value.toFixed(1)} min`;
  }

  return `${(value / 60).toFixed(1)} hr`;
}

export function AnalyticsOverviewPage({
  overview,
}: {
  overview: OverviewAnalysis;
}) {
  return (
    <>
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">
            Are Internet leads producing value?
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            These are observed populations, not a literal
            conversion funnel. Each population requires its
            own evidence.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Total leads"
            value={String(overview.totalLeads)}
            detail="All canonical lead records"
            state={
              <EvidenceState kind="calculated" />
            }
          />
          <MetricCard
            label="Timeline covered"
            value={String(overview.timelineLeads)}
            detail={`${formatPercent(overview.timelineCoverageRate)} of leads`}
            state={
              <EvidenceState kind="calculated" />
            }
          />
          <MetricCard
            label="Observed contacted"
            value={String(overview.contactedLeads)}
            detail="First qualifying employee outbound"
            state={
              <EvidenceState kind="calculated" />
            }
          />
          <MetricCard
            label="Observed responded"
            value={String(overview.respondedLeads)}
            detail="Inbound communication after contact"
            state={
              <EvidenceState kind="calculated" />
            }
          />
          <MetricCard
            label="Appointment evidence"
            value={String(overview.appointmentEvidenceLeads)}
            detail="Observed Appt. Created evidence"
            state={
              <EvidenceState kind="observed" />
            }
          />
        </div>
      </section>

      <SectionPanel
        title="Outcome evidence"
        description="Current Sold / Closed stages are outcome evidence, but they are not treated as populated sales records."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            label="Sold / Closed"
            value={String(overview.soldClosedLeads)}
            detail="Current Sold or Closed stage"
            state={
              <EvidenceState kind="observed" />
            }
          />
          <MetricCard
            label="Response within 24 hours"
            value={String(overview.responseWithin24h)}
            detail={`${formatPercent(overview.responseWithin24hRate)} of contacted leads`}
            state={
              <EvidenceState kind="calculated" />
            }
          />
        </div>
      </SectionPanel>

      <SectionPanel
        title="Engagement signal"
        description="The current timeline evidence shows a meaningful response signal, but it does not establish causation."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Any observed response"
            value={formatPercent(overview.responseRate)}
            detail={`${overview.respondedLeads} of ${overview.contactedLeads} contacted`}
            state={
              <EvidenceState kind="calculated" />
            }
          />
          <MetricCard
            label="24-hour response"
            value={formatPercent(overview.responseWithin24hRate)}
            detail={`${overview.responseWithin24h} of ${overview.contactedLeads} contacted`}
            state={
              <EvidenceState kind="calculated" />
            }
          />
          <MetricCard
            label="Median response time"
            value={formatMinutes(overview.medianResponseMinutes)}
            detail="Among leads with an observed response"
            state={
              <EvidenceState kind="calculated" />
            }
          />
        </div>
      </SectionPanel>

      <SectionPanel
        title="What we can and cannot conclude"
        description="The evidence currently supports descriptive and associational analysis."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold">
              Strong enough to analyze
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>• How quickly contacted leads respond.</li>
              <li>• Which first-touch channels show different response rates.</li>
              <li>• Which sources have different observed response or outcome populations.</li>
              <li>• Which leads have appointment evidence.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <p className="text-sm font-semibold">
              Evidence gap
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The six current Sold / Closed leads do not have linked
              timeline records. Their sales outcome is known, but their
              initial-contact response speed is not. The application
              therefore keeps that comparison explicitly unknown.
            </p>
          </div>
        </div>
      </SectionPanel>
    </>
  );
}
