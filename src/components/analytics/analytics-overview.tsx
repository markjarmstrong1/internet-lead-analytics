import Link from "next/link";

import type { DashboardAnalysis } from "@/analytics/metrics/dashboard";
import { pct, minutes, Stat, Card } from "./analytics-section-page";

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
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Leads"
          value={String(analysis.acquisition.leads)}
          detail={`${analysis.acquisition.timelineCovered} with timeline evidence`}
        />
        <Stat
          label="Contact rate"
          value={pct(analysis.contact.contactRate)}
          detail={`${analysis.contact.contacted} contacted`}
        />
        <Stat
          label="Response rate"
          value={pct(analysis.engagement.responseRate)}
          detail={`${analysis.engagement.responded} responded`}
        />
        <Stat
          label="Sold / Closed"
          value={pct(analysis.progression.soldClosedRateOfAll)}
          detail={`${analysis.progression.soldClosed} current states`}
        />
      </div>

      <Card
        title="Management signals"
        description="The few measures that deserve attention before drilling into a specific area."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Signal
            label="Median first contact"
            value={minutes(analysis.contact.medianFirstContactMinutes)}
            detail="Lead creation → first qualifying outbound"
          />
          <Signal
            label="Response within 24h"
            value={pct(analysis.engagement.responseWithin24hRate)}
            detail={`${analysis.engagement.respondedWithin24h} contacted leads`}
          />
          <Signal
            label="Appointment evidence"
            value={String(analysis.progression.appointmentEvidence)}
            detail={`${pct(analysis.progression.appointmentRateOfContacted)} of contacted leads`}
          />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-400 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{item.title}</h2>
              <span className="text-slate-400 transition group-hover:translate-x-1">
                →
              </span>
            </div>
            <p className="mt-2 text-sm leading-5 text-slate-500">
              {item.description}
            </p>
          </Link>
        ))}
      </div>

      <Card
        title="Evidence coverage"
        description="Communication metrics depend on the timeline data available for each lead."
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
      </Card>
    </>
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
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  );
}
