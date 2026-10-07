import Link from "next/link";

import { EvidenceState } from "@/components/app/evidence-state";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";
import { ThemeSignature } from "@/components/app/theme-signature";
import { getDashboardMetrics } from "./dashboard-repository";

export async function DashboardPage() {
  const metrics = await getDashboardMetrics();

  const responseCoverage =
    metrics.communicationLeads === 0
      ? 0
      : Math.round(
          (metrics.inboundResponseLeads / metrics.communicationLeads) * 100,
        );

  const activeCoverage =
    metrics.totalLeads === 0
      ? 0
      : Math.round((metrics.activeLeads / metrics.totalLeads) * 100);

  const conversationCoverage =
    metrics.activeLeads === 0
      ? 0
      : Math.round((metrics.inConversation / metrics.activeLeads) * 100);

  const contactGap = Math.max(
    metrics.activeLeads - metrics.engagedLeads,
    0,
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8 lg:px-8">
      <PageHeader
        eyebrow="Management overview"
        title="Internet lead performance"
        description="A concise view of lead volume, engagement, conversations, appointments, and observed sales evidence."
      />

      <ThemeSignature
        primary={String(metrics.totalLeads)}
        secondary={`${responseCoverage}%`}
        tertiary={String(metrics.sales)}
      />

      <section>
        <div className="dashboard-kpis grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Active leads"
            value={String(metrics.activeLeads)}
            detail={`${activeCoverage}% of ${metrics.totalLeads} total leads`}
            state={<EvidenceState kind="calculated" />}
          />
          <MetricCard
            label="Engaged"
            value={String(metrics.engagedLeads)}
            detail={`${responseCoverage}% of communicated leads have inbound response evidence`}
            state={<EvidenceState kind="calculated" />}
          />
          <MetricCard
            label="In conversation"
            value={String(metrics.inConversation)}
            detail={`${conversationCoverage}% of active leads`}
            state={<EvidenceState kind="calculated" />}
          />
          <MetricCard
            label="Appointments"
            value={String(metrics.upcomingAppointments)}
            detail={`${metrics.totalAppointmentsBooked} booked · ${metrics.totalAppointmentsShown} shown`}
            state={<EvidenceState kind="calculated" />}
          />
          <MetricCard
            label="Sales"
            value={String(metrics.sales)}
            detail="Observed sold / closed evidence"
            state={<EvidenceState kind="calculated" />}
          />
        </div>
      </section>

      <div className="dashboard-secondary grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
        <SectionPanel
          title="What needs attention?"
          description="The dashboard highlights observable gaps rather than pretending to reconstruct a perfect funnel."
        >
          <div className="grid gap-3 md:grid-cols-3">
            <AttentionItem
              label="Active leads without communication"
              value={contactGap}
              detail="Active leads with no observed communication evidence."
              tone={contactGap > 0 ? "warning" : "positive"}
            />
            <AttentionItem
              label="Communication → response"
              value={`${responseCoverage}%`}
              detail="Share of leads with communication evidence that also show inbound response."
              tone={responseCoverage >= 50 ? "positive" : "warning"}
            />
            <AttentionItem
              label="Active → conversation"
              value={`${conversationCoverage}%`}
              detail="Share of active leads showing recent two-way communication."
              tone={conversationCoverage >= 25 ? "positive" : "warning"}
            />
          </div>
        </SectionPanel>

        <SectionPanel
          title="Evidence coverage"
          description="How much of the lead population has timeline evidence."
        >
          <div className="space-y-4">
            <CoverageRow
              label="Timeline coverage"
              value={metrics.timelineLeads}
              total={metrics.totalLeads}
            />
            <CoverageRow
              label="Communication evidence"
              value={metrics.communicationLeads}
              total={metrics.timelineLeads}
            />
            <CoverageRow
              label="Inbound response evidence"
              value={metrics.inboundResponseLeads}
              total={metrics.communicationLeads}
            />
          </div>

          <p className="mt-5 text-xs leading-5 text-[var(--muted)]">
            Behavioral conclusions are limited to the evidence currently
            imported into the timeline.
          </p>
        </SectionPanel>
      </div>

      <SectionPanel
        title="Current operating picture"
        description="Use these signals to decide where to investigate next."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <OperatingSignal
            number="01"
            label="Lead volume"
            value={String(metrics.totalLeads)}
            detail={`${metrics.activeLeads} currently active`}
          />
          <OperatingSignal
            number="02"
            label="Customer engagement"
            value={String(metrics.inboundResponseLeads)}
            detail="Leads with observed inbound response evidence"
          />
          <OperatingSignal
            number="03"
            label="Observed outcomes"
            value={String(metrics.sales)}
            detail={`${metrics.totalAppointmentsBooked} appointments booked`}
          />
        </div>
      </SectionPanel>

      <SectionPanel
        title="Go deeper"
        description="Move from the management summary into the evidence behind it."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardLink
            href="/analytics/acquisition"
            title="Acquisition"
            description="Lead volume and source mix."
          />
          <DashboardLink
            href="/analytics/contact"
            title="Contact"
            description="Contact rate and speed-to-lead."
          />
          <DashboardLink
            href="/analytics/engagement"
            title="Engagement"
            description="Responses and communication behavior."
          />
          <DashboardLink
            href="/analytics/progression"
            title="Progression"
            description="Appointments and observed outcomes."
          />
        </div>
      </SectionPanel>
    </div>
  );
}

function AttentionItem({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: number | string;
  detail: string;
  tone: "warning" | "positive";
}) {
  return (
    <div
      className={[
        "rounded-[10px] border p-4",
        tone === "warning"
          ? "border-[var(--warning)]/30 bg-[var(--warning-soft)]"
          : "border-[var(--success)]/30 bg-[var(--success-soft)]",
      ].join(" ")}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function CoverageRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const rate = total === 0 ? 0 : Math.round((value / total) * 100);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-[var(--muted)]">
          {value} / {total} · {rate}%
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]">
        <div
          className="h-full rounded-full bg-[var(--accent)]"
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
    </div>
  );
}

function OperatingSignal({
  number,
  label,
  value,
  detail,
}: {
  number: string;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[10px] border bg-[var(--surface-muted)] p-4">
      <p className="text-[11px] font-semibold tracking-[0.12em] text-[var(--muted)]">
        {number}
      </p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function DashboardLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[10px] border bg-white p-4 transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
        {description}
      </p>
      <p className="mt-3 text-xs font-semibold text-[var(--accent-strong)]">
        View analysis →
      </p>
    </Link>
  );
}
