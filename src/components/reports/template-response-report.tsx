"use client";

import type { AnalyticsTemplate } from "@/analytics/data/analytics-repository";
import type { TemplateResponseAnalysis } from "@/reports/template-response-analysis";

type Props = {
  analysis: TemplateResponseAnalysis;
  templates: AnalyticsTemplate[];
};

function percentage(value: number | null) {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

function minutes(value: number | null) {
  if (value === null) return "—";
  if (value < 60) return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} min`;
  const hours = value / 60;
  return `${hours.toLocaleString(undefined, { maximumFractionDigits: 1 })} hr`;
}

function count(value: number) {
  return value.toLocaleString();
}

export function TemplateResponseReport({ analysis, templates }: Props) {
  const names = new Map(templates.map((template) => [
    template.templateCode.trim(),
    template.name.trim(),
  ]));

  const distinctLeads = new Set(analysis.actions.map((action) => action.leadId)).size;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Matched template uses"
          value={count(analysis.totalMatchedTemplateActions)}
          detail={`${count(distinctLeads)} distinct leads`}
        />
        <SummaryCard
          label="Responded within 24 hours"
          value={count(analysis.totalRespondedActions)}
          detail="Template uses with an attributed inbound response"
        />
        <SummaryCard
          label="Observed response rate"
          value={percentage(analysis.overallResponseRate)}
          detail="Responses divided by matched template uses"
        />
        <SummaryCard
          label="Median response time"
          value={minutes(analysis.medianResponseMinutes)}
          detail="Among uses with an attributed response within 24 hours"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
        <p className="font-semibold text-slate-900">How to interpret these results</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>The response window is 24 hours after each matched template-coded outbound action.</li>
          <li>A later outbound communication ends the prior action’s attribution window.</li>
          <li>These results describe observed associations; they do not prove that a template caused a response.</li>
          <li>Only canonical, matched template codes are included. Missing or unmatched template coding can make coverage incomplete.</li>
        </ul>
      </div>

      {analysis.byTemplate.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
          <p className="font-semibold text-slate-900">No matched template actions found</p>
          <p className="mt-2 text-sm text-slate-500">
            This report needs outbound timeline events with canonical template codes. Check template coding and event ingestion before drawing conclusions.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[850px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold">Template</th>
                <th className="px-4 py-3 text-right font-semibold">Uses</th>
                <th className="px-4 py-3 text-right font-semibold">Distinct leads</th>
                <th className="px-4 py-3 text-right font-semibold">Responses ≤ 24h</th>
                <th className="px-4 py-3 text-right font-semibold">No response ≤ 24h</th>
                <th className="px-4 py-3 text-right font-semibold">Response rate</th>
                <th className="px-4 py-3 text-right font-semibold">Median response</th>
              </tr>
            </thead>
            <tbody>
              {analysis.byTemplate.map((row) => {
                const leadCount = new Set(
                  analysis.actions
                    .filter((action) => action.templateCode === row.templateCode)
                    .map((action) => action.leadId),
                ).size;
                const name = names.get(row.templateCode);
                return (
                  <tr key={row.templateCode} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="block font-medium text-slate-900">
                        {name || row.templateCode}
                      </span>
                      {name && name !== row.templateCode ? (
                        <span className="mt-0.5 block text-xs text-slate-500">{row.templateCode}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{count(row.actionCount)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{count(leadCount)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{count(row.respondedActions)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{count(row.actionsWithoutResponseWithinWindow)}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{percentage(row.responseRate)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{minutes(row.medianResponseMinutes)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs leading-5 text-slate-500">
        Coverage note: this report uses the currently loaded analytics dataset and matched template-coded actions. Response rates should be compared alongside use counts and distinct-lead counts; small samples can produce unstable rates.
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}
