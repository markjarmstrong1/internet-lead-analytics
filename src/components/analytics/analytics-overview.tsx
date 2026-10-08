import Link from "next/link";

import type { DashboardAnalysis } from "@/analytics/metrics/dashboard";
import { Card, minutes, pct } from "./analytics-section-page";
import { ThemeSignature } from "@/components/app/theme-signature";

const links = [
  {
    href: "/analytics/acquisition",
    title: "Acquisition",
    description: "Lead volume, source mix, and timeline coverage.",
  },
  {
    href: "/analytics/contact",
    title: "Contact",
    description: "Contact rate and speed-to-lead performance.",
  },
  {
    href: "/analytics/engagement",
    title: "Engagement",
    description: "Response behavior, speed, and communication channels.",
  },
  {
    href: "/analytics/progression",
    title: "Progression",
    description: "Appointment evidence and observed outcomes.",
  },
  {
    href: "/analytics/sources",
    title: "Sources",
    description: "Compare performance across lead sources.",
  },
  {
    href: "/analytics/trends",
    title: "Trends",
    description: "See performance by lead-creation cohort over time.",
  },
  {
    href: "/analytics/investigation",
    title: "Investigation",
    description: "Move from aggregate numbers to individual leads.",
  },
];

export function AnalyticsOverview({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  const fastestContact = analysis.contact.contactSpeed
    .filter((row) => row.key !== "unknown")
    .reduce<
      (typeof analysis.contact.contactSpeed)[number] | null
    >((best, row) => {
      if (!best || row.contacted > best.contacted) {
        return row;
      }

      return best;
    }, null);

  const soldLeadAnalytics = analysis.soldLeadAnalytics;

  return (
    <>
      <div className="rounded-[12px] border border-[var(--sidebar-border)] bg-[var(--sidebar)] p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Internet Lead Intelligence
        </p>

        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          What actually happens after an Internet lead arrives?
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-6 text-[#c2c8ce]">
          This view turns lead and timeline evidence into management-level
          answers about contact speed, customer response, communication
          behavior, sources, and observed outcomes.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <HeroMetric
            label="Internet leads"
            value={String(analysis.acquisition.leads)}
          />
          <HeroMetric
            label="Contacted"
            value={pct(analysis.contact.contactRate)}
            detail={`${analysis.contact.contacted} leads`}
          />
          <HeroMetric
            label="Responded"
            value={pct(analysis.engagement.responseRate)}
            detail={`${analysis.engagement.responded} observed outbound leads`}
          />
          <HeroMetric
            label="Appointment evidence"
            value={String(analysis.progression.appointmentEvidence)}
            detail={pct(
              analysis.progression.appointmentRateOfContacted,
            )}
          />
          <HeroMetric
            label="Sold / Closed"
            value={pct(analysis.progression.soldClosedRateOfAll)}
            detail={`${analysis.progression.soldClosed} observed states`}
          />
        </div>
      </div>

      <ThemeSignature
        primary={String(analysis.acquisition.leads)}
        secondary={pct(analysis.engagement.responseRate)}
        tertiary={pct(analysis.progression.soldClosedRateOfAll)}
      />

      <Card
        title="Where are we losing leads?"
        description="The largest observable gaps in the Internet-lead process."
      >
        <div className="grid gap-3 md:grid-cols-4">
          <StoryStep
            number="01"
            label="Leads received"
            value={String(analysis.acquisition.leads)}
            detail="Internet leads in the current dataset"
          />

          <StoryStep
            number="02"
            label="Never contacted"
            value={String(analysis.contact.notContacted)}
            detail={`${pct(
              analysis.contact.notContacted /
                Math.max(analysis.acquisition.leads, 1),
            )} of all leads`}
            warning={analysis.contact.notContacted > 0}
          />

          <StoryStep
            number="03"
            label="Observed outbound, no observed response"
            value={String(
              Math.max(
                analysis.engagement.responseEligible -
                  analysis.engagement.responded,
                0,
              ),
            )}
            detail={`${pct(
              analysis.engagement.responseEligible === 0
                ? null
                : (analysis.engagement.responseEligible -
                    analysis.engagement.responded) /
                    analysis.engagement.responseEligible,
            )} of leads with observed outbound`}
          />

          <StoryStep
            number="04"
            label="Observed appointment evidence"
            value={String(analysis.progression.appointmentEvidence)}
            detail={`${pct(
              analysis.progression.appointmentRateOfResponded,
            )} of respondents`}
          />
        </div>

        <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
          Appointment evidence is shown separately rather than treated as a
          strict funnel stage because the current timeline evidence does not
          prove that every appointment came after an observed response.
        </p>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card
          title="How fast are we contacting leads?"
          description="Lead creation → first qualifying employee outbound."
        >
          <div className="space-y-3">
            {analysis.contact.contactSpeed.map((row) => (
              <MetricBar
                key={row.key}
                label={row.label}
                count={row.contacted}
                rate={row.rate}
              />
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MiniMetric
              label="Median first contact"
              value={minutes(
                analysis.contact.medianFirstContactMinutes,
              )}
            />

            <MiniMetric
              label="Largest contact bucket"
              value={fastestContact?.label ?? "—"}
              detail={
                fastestContact
                  ? `${fastestContact.contacted} leads`
                  : undefined
              }
            />
          </div>
        </Card>

        <Card
          title="When customers respond"
          description="First qualifying outbound → first observed inbound."
        >
          <div className="space-y-3">
            {analysis.engagement.speed.map((row) => (
              <MetricBar
                key={row.key}
                label={row.label}
                count={row.responded}
                rate={row.responseRate}
                denominator={row.contacted}
              />
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MiniMetric
              label="Median response"
              value={minutes(
                analysis.engagement.medianResponseMinutes,
              )}
            />

            <MiniMetric
              label="Responded within 24h"
              value={pct(
                analysis.engagement.responseWithin24hRate,
              )}
              detail={`${analysis.engagement.respondedWithin24h} leads`}
            />
          </div>
        </Card>
      </div>

      <Card
        title="Which channels are producing responses?"
        description="First-touch channel compared using the same contacted-lead denominator."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[10px] font-semibold uppercase tracking-[0.11em] text-[var(--muted)]">
                <th className="pb-3 pr-4">Channel</th>
                <th className="pb-3 pr-4">Contacted</th>
                <th className="pb-3 pr-4">Responded</th>
                <th className="pb-3 pr-4">Response rate</th>
                <th className="pb-3">Within 24h</th>
              </tr>
            </thead>
            <tbody>
              {analysis.engagement.channels
                .filter((row) => row.contacted > 0)
                .map((row) => (
                  <tr
                    key={row.channel}
                    className="border-b border-[var(--border)] last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium capitalize">
                      {row.channel}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {row.contacted}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {row.responded}
                    </td>
                    <td className="py-3 pr-4 font-medium tabular-nums">
                      {pct(row.responseRate)}
                    </td>
                    <td className="py-3 tabular-nums">
                      {pct(row.responseWithin24hRate)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="What happened immediately before customers responded?"
        description="Among Sold / Closed leads with observed responses, this shows the outbound action immediately preceding the observed response."
      >
        {soldLeadAnalytics.responseActions.length === 0 ? (
          <EmptyState text="No timeline evidence is linked to the current Sold / Closed population, so response actions cannot be evaluated." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[10px] font-semibold uppercase tracking-[0.11em] text-[var(--muted)]">
                  <th className="pb-3 pr-4">Outbound action</th>
                  <th className="pb-3 pr-4">Channel</th>
                  <th className="pb-3 pr-4">Responses</th>
                  <th className="pb-3 pr-4">Avg response</th>
                  <th className="pb-3 pr-4">Median response</th>
                  <th className="pb-3">Appointment evidence</th>
                </tr>
              </thead>
              <tbody>
                {soldLeadAnalytics.responseActions.map((row) => (
                  <tr
                    key={`${row.action}-${row.channel ?? "none"}`}
                    className="border-b border-[var(--border)] last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium">
                      {row.action}
                    </td>
                    <td className="py-3 pr-4 capitalize">
                      {row.channel ?? "—"}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {row.responses}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {minutes(row.averageResponseMinutes)}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {minutes(row.medianResponseMinutes)}
                    </td>
                    <td className="py-3 tabular-nums">
                      {row.appointmentEvidence}{" "}
                      <span className="text-[var(--muted)]">
                        ({pct(row.appointmentRate)})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
          These are observed associations, not causal findings. A response
          action appearing alongside faster responses does not prove that the
          action caused the response.
        </p>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card
          title="Which lead sources are producing workable leads?"
          description="Compare the same progression measures across sources."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[10px] font-semibold uppercase tracking-[0.11em] text-[var(--muted)]">
                  <th className="pb-3 pr-4">Source</th>
                  <th className="pb-3 pr-4">Leads</th>
                  <th className="pb-3 pr-4">Contact</th>
                  <th className="pb-3 pr-4">Response</th>
                  <th className="pb-3 pr-4">Appointment</th>
                  <th className="pb-3">Sold / Closed</th>
                </tr>
              </thead>
              <tbody>
                {analysis.sources.slice(0, 10).map((row) => (
                  <tr
                    key={row.source}
                    className="border-b border-[var(--border)] last:border-0"
                  >
                    <td className="max-w-[220px] truncate py-3 pr-4 font-medium">
                      {row.source}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {row.leads}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {pct(row.contactRate)}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {pct(row.responseRate)}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {pct(row.appointmentRate)}
                    </td>
                    <td className="py-3 tabular-nums">
                      {pct(row.soldClosedRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
            Source differences are associations in the observed dataset, not
            evidence that the source itself caused the outcome.
          </p>
        </Card>

        <Card
          title="What do Sold / Closed leads look like?"
          description="Behavior observed in the current Sold / Closed population."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniMetric
              label="Sold / Closed"
              value={String(soldLeadAnalytics.soldClosed)}
            />
            <MiniMetric
              label="Timeline evidence"
              value={`${soldLeadAnalytics.timelineCovered} / ${soldLeadAnalytics.soldClosed}`}
              detail="Sold / Closed leads with linked timeline records"
            />
            <MiniMetric
              label="Contacted"
              value={
                soldLeadAnalytics.timelineCovered === 0
                  ? "—"
                  : String(soldLeadAnalytics.contacted)
              }
              detail={
                soldLeadAnalytics.timelineCovered === 0
                  ? "No communication evidence available"
                  : undefined
              }
            />
            <MiniMetric
              label="Responded"
              value={
                soldLeadAnalytics.timelineCovered === 0
                  ? "—"
                  : String(soldLeadAnalytics.responded)
              }
              detail={
                soldLeadAnalytics.timelineCovered === 0
                  ? "No communication evidence available"
                  : undefined
              }
            />
            <MiniMetric
              label="Response within 24h"
              value={
                soldLeadAnalytics.timelineCovered === 0
                  ? "—"
                  : pct(
                      soldLeadAnalytics.responseWithin24hRate,
                    )
              }
            />
            <MiniMetric
              label="Avg first contact"
              value={minutes(
                soldLeadAnalytics.averageFirstContactMinutes,
              )}
            />
            <MiniMetric
              label="Median first contact"
              value={minutes(
                soldLeadAnalytics.medianFirstContactMinutes,
              )}
            />
            <MiniMetric
              label="Avg first response"
              value={minutes(
                soldLeadAnalytics.averageFirstResponseMinutes,
              )}
            />
            <MiniMetric
              label="Median first response"
              value={minutes(
                soldLeadAnalytics.medianFirstResponseMinutes,
              )}
            />
          </div>

          {soldLeadAnalytics.timelineCovered === 0 ? (
            <p className="mt-4 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning-soft)] px-4 py-3 text-xs leading-5 text-[var(--warning)]">
              The current Sold / Closed population has no linked timeline
              evidence. Communication behavior, response speed, actions, and
              message/template associations cannot be evaluated for these
              leads from the current dataset.
            </p>
          ) : null}
        </Card>
      </div>

      <Card
        title="Evidence coverage"
        description="The strength of these conclusions depends on how much timeline evidence is available."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Signal
            label="Timeline coverage"
            value={pct(analysis.acquisition.timelineCoverageRate)}
            detail={`${analysis.acquisition.timelineCovered} leads`}
          />
          <Signal
            label="Sold / Closed with timeline"
            value={String(analysis.progression.soldClosedWithTimeline)}
            detail="Observed outcome states"
          />
          <Signal
            label="Sold / Closed without timeline"
            value={String(analysis.progression.soldClosedWithoutTimeline)}
            detail="Outcome exists without communication evidence"
          />
        </div>

        <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
          Contact and response metrics describe observed timeline evidence.
          Sold / Closed describes the lead&apos;s current observed state; it is not
          a reconstructed sales transaction history.
        </p>
      </Card>

      <Card
        title="Go deeper"
        description="The Overview is designed for the management conversation. These pages contain the supporting analysis."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {links.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-[var(--border)] p-4 transition hover:border-[var(--accent)] hover:bg-[var(--surface-muted)]"
            >
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                {item.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {links.slice(4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-[var(--border)] p-4 transition hover:border-[var(--accent)] hover:bg-[var(--surface-muted)]"
            >
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </Card>
    </>
  );
}

function HeroMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {detail ? (
        <p className="mt-1 text-xs text-[var(--muted)]">{detail}</p>
      ) : null}
    </div>
  );
}

function StoryStep({
  number,
  label,
  value,
  detail,
  warning = false,
}: {
  number: string;
  label: string;
  value: string;
  detail: string;
  warning?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        warning
          ? "border-[var(--warning)]/30 bg-[var(--warning-soft)]"
          : "border-[var(--border)] bg-[var(--surface-muted)]"
      }`}
    >
      <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">
        {number}
      </p>
      <p className="mt-3 text-sm font-medium text-[var(--muted-strong)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function MetricBar({
  label,
  count,
  rate,
  denominator,
}: {
  label: string;
  count: number;
  rate: number | null;
  denominator?: number;
}) {
  const width = rate === null ? 0 : Math.max(0, Math.min(rate * 100, 100));

  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-[var(--muted)]">
          {count}
          {denominator !== undefined ? ` / ${denominator}` : ""}
          {rate !== null ? ` · ${pct(rate)}` : ""}
        </span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
        <div
          className="theme-chart-bar h-full rounded-full bg-[var(--accent)] transition-all"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg bg-[var(--surface-muted)] p-4">
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      {detail ? (
        <p className="mt-1 text-xs text-[var(--muted)]">{detail}</p>
      ) : null}
    </div>
  );
}

function Signal({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg bg-[var(--surface-muted)] p-4">
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg bg-[var(--surface-muted)] p-5 text-sm text-[var(--muted)]">
      {text}
    </div>
  );
}
