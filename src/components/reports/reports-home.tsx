"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SavedReport } from "@/reports/report-types";

const starters = [
  {
    number: "01",
    title: "Lead source performance",
    description: "Compare lead volume, engagement, and outcomes across sources.",
    href: "/reports/builder?groupBy=source&metric=leads&metric=contacted&metric=responded&metric=appointments&metric=soldClosed",
  },
  {
    number: "02",
    title: "Response & follow-up",
    description: "Review observed outbound activity, responses, and response rates.",
    href: "/reports/builder?groupBy=source&metric=observedOutbound&metric=responded&metric=responseRate&metric=medianResponseMinutes",
  },
  {
    number: "03",
    title: "Appointments & sales",
    description: "Compare appointment activity with sold and closed outcomes.",
    href: "/reports/builder?groupBy=stage&metric=leads&metric=appointments&metric=soldClosed",
  },
  {
    number: "04",
    title: "Data coverage",
    description: "Understand timeline coverage and where activity evidence is available.",
    href: "/reports/builder?groupBy=source&metric=leads&metric=timelineCovered&metric=observedOutbound&metric=responded",
  },
];

function humanize(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function ReportsHome({ reports }: { reports: SavedReport[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reports
      .filter((report) => !query || [
        report.name,
        report.definition.groupBy,
        ...report.definition.metrics,
      ].some((value) => value.toLowerCase().includes(query)))
      .sort((a, b) => sort === "name"
        ? a.name.localeCompare(b.name)
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [reports, search, sort]);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-9 sm:py-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-10 h-52 w-52 rounded-full border border-white/10" />
        <div className="relative max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
            Management intelligence
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Turn lead activity into clearer decisions.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Build reusable reports from your existing analytics, review the results,
            and prepare management-ready exports.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/reports/builder" className="inline-flex items-center rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-50">
              Create a report <span className="ml-2" aria-hidden="true">↗</span>
            </Link>
            <Link href="/reports/view" className="inline-flex items-center rounded-lg border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Browse report library
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-800">Start with a question</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">What do you need to understand?</h2>
          <p className="mt-1 text-sm text-slate-500">Use a starting point, then customize the report in the builder.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {starters.map((item) => (
            <Link key={item.number} href={item.href} className="group flex min-h-48 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600 transition group-hover:bg-slate-950 group-hover:text-white">
                {item.number}
              </span>
              <h3 className="mt-4 font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-5 text-slate-500">{item.description}</p>
              <span className="mt-auto pt-4 text-sm font-semibold text-sky-800">Customize report <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Your workspace</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Saved reports</h2>
            <p className="mt-1 text-sm text-slate-500">Reopen a configuration or review its latest results.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {reports.length} {reports.length === 1 ? "report" : "reports"}
          </span>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:px-6">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Search saved reports</span>
            <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports, groups, or measures…" className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200" />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <span>Sort by</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-slate-200">
              <option value="recent">Recently updated</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>

        {filtered.length ? (
          <div className="divide-y divide-slate-100">
            {filtered.map((report) => (
              <article key={report.id} className="flex flex-col gap-4 px-5 py-5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="min-w-0">
                  <h3 className="break-words font-semibold text-slate-950">{report.name}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span>Updated {formatDate(report.updatedAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span>Grouped by {humanize(report.definition.groupBy)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{report.definition.metrics.length} measures</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {report.definition.metrics.slice(0, 4).map((metric) => (
                      <span key={metric} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">{humanize(metric)}</span>
                    ))}
                    {report.definition.metrics.length > 4 && <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">+{report.definition.metrics.length - 4} more</span>}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link href={`/reports/view?reportId=${encodeURIComponent(report.id)}`} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100">Review</Link>
                  <Link href={`/reports/builder?reportId=${encodeURIComponent(report.id)}`} className="rounded-lg bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">Edit report</Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <div aria-hidden="true" className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-500">▤</div>
            <h3 className="mt-4 font-semibold text-slate-950">{reports.length ? "No matching reports" : "Your report library starts here"}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {reports.length ? "Try another search or change the sort order." : "Create and save a report configuration to make it reusable. Saved reports will appear here."}
            </p>
            {!reports.length && <Link href="/reports/builder" className="mt-5 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Create your first report</Link>}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Specialized analysis</h2>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500">Explore template-coded outbound actions and their observed inbound responses.</p>
        </div>
        <Link href="/reports/template-responses" className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
          Template response analysis <span className="ml-2" aria-hidden="true">→</span>
        </Link>
      </section>
    </div>
  );
}
