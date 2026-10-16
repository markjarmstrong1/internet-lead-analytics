"use client";

import { useProgressionAnalysis } from "./use-progression-analysis";
import { DropoffAnalysisCard, EvidenceCoveragePanel, JourneyPaths, ObservedAssociations, ProgressionFunnel, ProgressionOverview, TransitionAnalysisCard, UnresolvedQuestionsPanel } from "./progression-components";

export function ProgressionIntelligenceDashboard() {
  const { data, loading, error } = useProgressionAnalysis();
  if (loading) return <main className="mx-auto max-w-7xl space-y-4 p-6"><div className="h-8 w-72 animate-pulse rounded bg-slate-100" /><div className="h-36 animate-pulse rounded-xl bg-slate-100" /><div className="h-64 animate-pulse rounded-xl bg-slate-100" /></main>;
  if (error || !data) return <main className="mx-auto max-w-7xl p-6"><section className="rounded-xl border border-red-200 bg-red-50 p-5"><h1 className="font-semibold text-red-900">Progression analysis unavailable</h1><p className="mt-2 text-sm text-red-800">{error ?? "No progression data returned."}</p></section></main>;
  return <main className="mx-auto max-w-7xl space-y-6 p-6">
    <header><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Analytics / Progression Intelligence</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Lead Progression Intelligence</h1><p className="mt-2 max-w-3xl text-sm text-slate-600">Evidence-backed analysis of how leads progress, where recorded progression stops, and which observed actions appear along successful journeys.</p><p className="mt-2 text-xs text-slate-400">Generated {new Date(data.generatedAt).toLocaleString()} · {data.leadCount} canonical leads · rule versions recorded below</p><div className="mt-4 flex flex-wrap gap-2"><a href="/reports/progression" className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">Open management report</a><a href="/api/reports/progression/pdf" className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Export PDF</a></div></header>
    <ProgressionOverview data={data} />
    <div className="grid gap-5 xl:grid-cols-2"><ProgressionFunnel data={data} /><DropoffAnalysisCard transitions={data.transitions} /></div>
    <section><h2 className="mb-3 text-xl font-semibold text-slate-950">Stage transition analysis</h2><div className="grid gap-4">{data.transitions.map((transition) => <TransitionAnalysisCard key={`${transition.fromStage}-${transition.toStage}`} transition={transition} />)}</div></section>
    <div className="grid gap-5 xl:grid-cols-2"><ObservedAssociations data={data} /><JourneyPaths data={data} /></div>
    <div className="grid gap-5 xl:grid-cols-2"><EvidenceCoveragePanel data={data} /><UnresolvedQuestionsPanel data={data} /></div>
    <details className="rounded-xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-800">Qualification rules used ({data.ruleVersions.length})</summary>{data.ruleVersions.length ? <ul className="mt-3 space-y-3">{data.ruleVersions.map((rule) => <li key={rule.ruleKey} className="border-b border-slate-100 pb-3 last:border-0"><p className="text-sm font-medium text-slate-800">{rule.label} <span className="font-normal text-slate-500">· v{rule.version}</span></p><p className="mt-1 text-xs text-slate-500">{rule.description}</p><p className="mt-1 font-mono text-xs text-slate-400">{rule.ruleKey}</p></li>)}</ul> : <p className="mt-3 text-sm text-amber-700">No valid qualification rules were returned. Do not interpret stage rates until the rule configuration is restored.</p>}</details>
  </main>;
}
