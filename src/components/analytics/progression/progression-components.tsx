import type { ProgressionStage, StageTransition } from "@/analytics/progression/progression-types";
import type { ProgressionDashboardData } from "@/analytics/progression/progression-dashboard-types";

const stageLabels: Record<ProgressionStage, string> = {
  new_lead: "New lead", engaged: "Engaged", conversation: "Conversation",
  appointment: "Appointment", show: "Show", sold: "Sold",
};
function percent(value: number | null) { return value === null ? "—" : `${(value * 100).toFixed(1)}%`; }
function duration(value: number | null) { if (value === null) return "Insufficient timestamp evidence"; if (value < 60) return `${Math.round(value)} min`; if (value < 1440) return `${(value / 60).toFixed(1)} hr`; return `${(value / 1440).toFixed(1)} days`; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-base font-semibold text-slate-950">{title}</h2><div className="mt-4">{children}</div></section>;
}

export function ProgressionOverview({ data }: { data: ProgressionDashboardData }) {
  const sales = data.funnel.find((item) => item.stage === "sold");
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {[["Eligible leads", data.leadCount.toLocaleString()], ["Engaged", data.funnel.find((item) => item.stage === "engaged")?.count.toLocaleString() ?? "0"], ["Appointments", data.funnel.find((item) => item.stage === "appointment")?.count.toLocaleString() ?? "0"], ["Sales", sales?.count.toLocaleString() ?? "0"]].map(([label, value]) =>
      <div key={label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p></div>)}
  </div>;
}

export function ProgressionFunnel({ data }: { data: ProgressionDashboardData }) {
  return <Panel title="Lead funnel"><div className="space-y-4">
    {data.funnel.map((stage, index) => <div key={stage.stage}>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm"><span className="font-medium text-slate-800">{stageLabels[stage.stage]}</span><span className="tabular-nums text-slate-700">{stage.count.toLocaleString()} <span className="text-slate-400">{index ? `· ${stage.progressedFromPreviousCount === null ? "—" : `${stage.progressedFromPreviousCount}/${stage.eligibleCount} eligible`} · ${percent(stage.rateFromPrevious)} transition rate` : "· cohort baseline"}</span></span></div>
      <div className="h-2 overflow-hidden rounded bg-slate-100"><div className="h-full rounded bg-slate-700" style={{ width: `${data.leadCount ? Math.min(100, stage.count / data.leadCount * 100) : 0}%` }} /></div>
    </div>)}
  </div></Panel>;
}

export function TransitionAnalysisCard({ transition }: { transition: StageTransition }) {
  return <Panel title={`${stageLabels[transition.fromStage]} → ${stageLabels[transition.toStage]}`}>
    <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
      <Metric label="Eligible" value={transition.eligibleLeadCount.toLocaleString()} />
      <Metric label="Progressed" value={transition.progressedLeadCount.toLocaleString()} />
      <Metric label="Transition rate" value={percent(transition.rate)} />
      <Metric label="Median time" value={duration(transition.medianMinutes)} />
    </div>
    <p className="mt-4 text-sm text-slate-600">Drop-off: {transition.dropoffCount.toLocaleString()} ({percent(transition.dropoffRate)}). Unresolved next-stage evidence: {transition.unresolvedLeadCount}. Timestamp coverage: {transition.timedLeadCount} of {transition.progressedLeadCount} progressed leads.</p>
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <MetricList title="Common paths" items={transition.commonPaths.map((item) => ({ label: item.path.join(" → "), count: item.occurrences }))} />
      <MetricList title="Observed channels" items={transition.channels.map((item) => ({ label: item.channel, count: item.occurrences }))} />
      <MetricList title="Observed actions" items={transition.actions.map((item) => ({ label: item.action, count: item.occurrences }))} />
      <MetricList title="Observed templates" items={transition.templates.map((item) => ({ label: item.templateCode, count: item.occurrences }))} />
    </div>
  </Panel>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-900">{value}</p></div>; }
function MetricList({ title, items }: { title: string; items: Array<{ label: string; count: number }> }) {
  return <div><h3 className="text-sm font-semibold text-slate-800">{title}</h3>{items.length ? <ul className="mt-2 space-y-1">{items.slice(0, 5).map((item) => <li key={item.label} className="flex justify-between gap-3 text-sm text-slate-600"><span>{item.label}</span><span className="tabular-nums">{item.count}</span></li>)}</ul> : <p className="mt-2 text-sm text-slate-400">No qualifying evidence in this cohort.</p>}</div>;
}

export function DropoffAnalysisCard({ transitions }: { transitions: StageTransition[] }) {
  const largest = [...transitions].filter((item) => item.eligibleLeadCount > 0).sort((a, b) => b.dropoffCount - a.dropoffCount)[0];
  return <Panel title="Largest observed drop-off">{largest ? <><p className="text-lg font-semibold">{stageLabels[largest.fromStage]} → {stageLabels[largest.toStage]}</p><p className="mt-1 text-sm text-slate-600">{largest.dropoffCount} of {largest.eligibleLeadCount} eligible leads did not have a recorded qualifying next-stage event ({percent(largest.dropoffRate)}).</p><p className="mt-3 text-xs text-slate-500">This identifies missing recorded progression, not necessarily a confirmed lost lead. Inspect lead-level evidence and source coverage before assigning a reason.</p></> : <p className="text-sm text-slate-500">No eligible transitions to analyze.</p>}</Panel>;
}

export function ObservedAssociations({ data }: { data: ProgressionDashboardData }) {
  const factors = data.associations.strongest.slice(0, 6);
  return <Panel title="Observed associations"><p className="text-sm text-slate-600">Comparison of eligible leads with versus without an observed factor. Differences are descriptive, unadjusted associations—not causal effects.</p>
    {factors.length ? <div className="mt-3 space-y-3">{factors.map((item) => <div key={`${item.kind}-${item.factor}`} className="rounded-lg border border-slate-100 p-3"><div className="flex flex-wrap items-baseline justify-between gap-2"><p className="text-sm font-medium text-slate-800">{item.factor} <span className="text-xs font-normal text-slate-400">({item.kind})</span></p><p className="text-sm font-semibold tabular-nums text-slate-900">{item.rateDifference === null ? "—" : `${item.rateDifference > 0 ? "+" : ""}${(item.rateDifference * 100).toFixed(1)} pp`}</p></div><p className="mt-1 text-xs text-slate-500">With factor: {item.progressedWithFactor}/{item.exposedLeadCount} · Without: {item.progressedWithoutFactor}/{item.unexposedLeadCount}</p></div>)}</div> : <p className="mt-3 text-sm text-slate-500">No factors have at least three eligible leads in both comparison groups.</p>}
    <h3 className="mt-5 text-sm font-semibold text-slate-800">Lowest observed rate differences</h3>
    {data.associations.weakest.length ? <ul className="mt-2 space-y-1">{data.associations.weakest.slice(0, 4).map((item) => <li key={`${item.kind}-${item.factor}`} className="flex justify-between gap-3 text-sm text-slate-600"><span>{item.factor}</span><span className="tabular-nums">{item.rateDifference === null ? "—" : `${(item.rateDifference * 100).toFixed(1)} pp`}</span></li>)}</ul> : <p className="mt-2 text-sm text-slate-500">No qualifying comparisons.</p>}
  </Panel>;
}
export function JourneyPaths({ data }: { data: ProgressionDashboardData }) {
  const paths = data.transitions.flatMap((transition) => transition.commonPaths.map((item) => ({ ...item, from: transition.fromStage, to: transition.toStage }))).sort((a, b) => b.occurrences - a.occurrences).slice(0, 8);
  return <Panel title="Observed journey paths">{paths.length ? <ul className="space-y-3">{paths.map((item, index) => <li key={`${item.from}-${item.to}-${index}`} className="border-b border-slate-100 pb-3 last:border-0"><p className="text-sm text-slate-800">{item.path.join(" → ")}</p><p className="mt-1 text-xs text-slate-500">{item.occurrences} occurrences · transition window {stageLabels[item.from]} → {stageLabels[item.to]}</p></li>)}</ul> : <p className="text-sm text-slate-500">No ordered event paths meet the current qualification rules.</p>}</Panel>;
}

export function EvidenceCoveragePanel({ data }: { data: ProgressionDashboardData }) {
  const c = data.evidenceCoverage;
  return <Panel title="Evidence coverage"><div className="grid grid-cols-2 gap-3"><Metric label="Complete" value={String(c.completeLeadCount)} /><Metric label="Partial" value={String(c.partialLeadCount)} /><Metric label="Missing timeline" value={String(c.missingLeadCount)} /><Metric label="Unknown" value={String(c.unknownLeadCount)} /></div><p className="mt-3 text-sm text-slate-600">Coverage does not imply that every stage was reached. It describes whether usable timeline evidence is available to assess progression.</p></Panel>;
}

export function UnresolvedQuestionsPanel({ data }: { data: ProgressionDashboardData }) {
  return <Panel title="Unresolved questions"><ul className="space-y-3">{data.unresolvedQuestions.map((item) => <li key={item.code} className="flex items-start justify-between gap-4"><span className="text-sm text-slate-700">{item.label}</span><span className="text-sm font-semibold tabular-nums text-slate-900">{item.leadCount}</span></li>)}</ul><p className="mt-3 text-xs text-slate-500">Absence of evidence is not classified as a zero outcome.</p></Panel>;
}
