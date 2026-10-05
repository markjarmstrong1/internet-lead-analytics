import Link from "next/link";

import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import type { DashboardAnalysis } from "@/analytics/metrics/dashboard";
import type { AnalyticsFilters } from "@/analytics/filters/analytics-filters";

import { AnalyticsFilters as Filters } from "./analytics-filters";

type Props = {
  title: string;
  description: string;
  analysis: DashboardAnalysis;
  filters: AnalyticsFilters;
  options: {
    sources: string[];
    sourceGroups: string[];
    stages: string[];
    statuses: string[];
  };
  children: React.ReactNode;
};

const sections = [
  ["Overview", "/analytics"],
  ["Acquisition", "/analytics/acquisition"],
  ["Contact", "/analytics/contact"],
  ["Engagement", "/analytics/engagement"],
  ["Progression", "/analytics/progression"],
  ["Sources", "/analytics/sources"],
  ["Trends", "/analytics/trends"],
  ["Investigation", "/analytics/investigation"],
] as const;

export function AnalyticsSectionPage({
  title,
  description,
  analysis,
  filters,
  options,
  children,
}: Props) {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1500px] space-y-6 px-6 py-7 lg:px-8">
        <PageHeader
          eyebrow="Analytics"
          title={title}
          description={description}
          actions={
            <Link
              href="/reports"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Build a report
            </Link>
          }
        />

        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200">
          {sections.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="whitespace-nowrap px-3 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-950"
            >
              {label}
            </Link>
          ))}
        </nav>

        <Filters filters={filters} options={options} />

        {children}

        <footer className="border-t border-slate-200 pt-4 text-xs leading-5 text-slate-400">
          Contact = qualifying employee outbound. Response = observed inbound
          at or after first qualifying outbound. Sold/Closed = current observed
          lead state, not a reconstructed transaction record. Source differences
          are associations, not causal findings.
        </footer>
      </div>
    </AppShell>
  );
}

export function pct(value: number | null) {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

export function minutes(value: number | null) {
  if (value === null) return "—";
  return value < 60
    ? `${value.toFixed(1)} min`
    : `${(value / 60).toFixed(1)} hr`;
}

export function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm leading-5 text-slate-500">
          {description}
        </p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {detail ? (
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

export function Bars({
  rows,
}: {
  rows: Array<{
    label: string;
    value: number;
    detail: string;
  }>;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-[120px_minmax(0,1fr)_90px] items-center gap-3"
        >
          <span className="truncate text-xs font-medium text-slate-600">
            {row.label}
          </span>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-900"
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>

          <span className="text-right text-xs tabular-nums text-slate-500">
            {row.value} · {row.detail}
          </span>
        </div>
      ))}
    </div>
  );
}
