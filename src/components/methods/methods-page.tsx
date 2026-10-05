"use client";

import {
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import type { DashboardAnalysis } from "@/analytics/metrics/dashboard";

type MethodRun = {
  id: string;
  method_key: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  result: Record<string, number>;
  error_message: string | null;
};

export type Template = {
  id: string;
  template_code: string;
  name: string;
  description: string;
  subject: string | null;
  content: string;
  is_active: boolean;
  source_kind: "email" | "text";
  source_path: string | null;
  external_template_key: string | null;
  created_at: string;
  updated_at: string;
};

export type TemplateMetric = {
  templateId: string;
  templateCode: string;
  name: string;
  sourceKind: "email" | "text";
  isActive: boolean;
  matchedUses: number;
  reviewUses: number;
  uniqueLeads: number;
  responses: number;
  responseRate: number | null;
  averageResponseMinutes: number | null;
  medianResponseMinutes: number | null;
  appointmentEvidenceLeads: number;
  appointmentRate: number | null;
  soldClosedLeads: number;
  soldClosedRate: number | null;
};

type Props = {
  initialAnalysis: DashboardAnalysis;
  initialRuns: MethodRun[];
  initialTemplates: Template[];
  initialMetrics: TemplateMetric[];
};

const METHODS = [
  {
    key: "sync-templates",
    title: "Sync Tekion Templates",
    description:
      "Synchronize the known Tekion email and text catalog into the analytical model.",
    endpoint: "/api/methods/sync-templates",
  },
  {
    key: "match-templates",
    title: "Match Timeline Events",
    description:
      "Identify which outbound timeline messages correspond to known Tekion templates.",
    endpoint: "/api/methods/match-templates",
  },
];

function methodKey(key: string) {
  return key === "sync-templates"
    ? "sync_tekion_templates"
    : "match_timeline_events";
}

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

function pct(value: number | null) {
  return value === null
    ? "—"
    : `${(value * 100).toFixed(1)}%`;
}

function minutes(value: number | null) {
  if (value === null) return "—";

  return value < 60
    ? `${value.toFixed(1)} min`
    : `${(value / 60).toFixed(1)} hr`;
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function sourceLabel(value: string) {
  return value === "Unknown" ? "Unknown source" : value;
}

export function MethodsPage({
  initialAnalysis,
  initialRuns,
  initialTemplates,
  initialMetrics,
}: Props) {
  const [runs] = useState(initialRuns);
  const [templates, setTemplates] =
    useState(initialTemplates);
  const [metrics] = useState(initialMetrics);
  const [selectedId, setSelectedId] = useState(
    initialTemplates[0]?.id ?? null,
  );
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] =
    useState<"all" | "email" | "text">("all");
  const [running, setRunning] =
    useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] =
    useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();

    return templates.filter((template) => {
      if (
        typeFilter !== "all" &&
        template.source_kind !== typeFilter
      ) {
        return false;
      }

      if (!query) return true;

      return [
        template.template_code,
        template.name,
        template.subject ?? "",
      ].some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [templates, search, typeFilter]);

  const selectedTemplate =
    templates.find(
      (template) => template.id === selectedId,
    ) ?? null;

  const selectedMetric =
    metrics.find(
      (metric) => metric.templateId === selectedId,
    ) ?? null;

  const contacted =
    initialAnalysis.contact.contacted;
  const leads =
    initialAnalysis.acquisition.leads;
  const responded =
    initialAnalysis.engagement.responded;
  const timelineCovered =
    initialAnalysis.acquisition.timelineCovered;
  const timelineCoverageRate =
    initialAnalysis.acquisition.timelineCoverageRate;
  const notContacted =
    initialAnalysis.contact.notContacted;

  const contactSpeed =
    initialAnalysis.contact.contactSpeed.filter(
      (row) => row.contacted > 0,
    );

  const sourceRows =
    initialAnalysis.sources
      .filter((row) => row.leads >= 3)
      .slice()
      .sort((a, b) => {
        const responseDifference =
          (b.responseRate ?? -1) -
          (a.responseRate ?? -1);

        return (
          responseDifference ||
          b.leads - a.leads
        );
      })
      .slice(0, 8);

  const templateRows = metrics
    .filter((metric) => metric.matchedUses > 0)
    .slice()
    .sort((a, b) => {
      const responseDifference =
        (b.responseRate ?? -1) -
        (a.responseRate ?? -1);

      return (
        responseDifference ||
        b.matchedUses - a.matchedUses
      );
    })
    .slice(0, 6);

  const matchedSendCount = metrics.reduce(
    (sum, metric) => sum + metric.matchedUses,
    0,
  );

  const reviewCount = metrics.reduce(
    (sum, metric) => sum + metric.reviewUses,
    0,
  );

  async function runMethod(
    method: (typeof METHODS)[number],
  ) {
    setRunning(method.key);
    setMessage(null);

    try {
      const response = await fetch(
        method.endpoint,
        {
          method: "POST",
        },
      );

      const payload = (await response.json()) as {
        result?: Record<string, number>;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error ?? "Method failed.",
        );
      }

      setMessage(
        `${method.title} completed successfully. Refreshing the evidence view…`,
      );

      window.location.reload();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Method failed.",
      );
    } finally {
      setRunning(null);
    }
  }

  async function saveTemplate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedTemplate) return;

    setSaving(true);
    setMessage(null);

    const form = new FormData(
      event.currentTarget,
    );

    try {
      const response = await fetch(
        `/api/templates/${selectedTemplate.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.get("name"),
            description: form.get("description"),
            subject: form.get("subject"),
            content: form.get("content"),
            isActive:
              form.get("isActive") === "on",
          }),
        },
      );

      const payload = (await response.json()) as {
        template?: Template;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error ??
            "Template update failed.",
        );
      }

      if (payload.template) {
        setTemplates((current) =>
          current.map((template) =>
            template.id === payload.template!.id
              ? payload.template!
              : template,
          ),
        );
      }

      setMessage(
        `${selectedTemplate.template_code} saved.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Template update failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-10">
      {message ? (
        <div
          role="status"
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm"
        >
          {message}
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-slate-950 p-7 text-white shadow-sm lg:p-9">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Internet lead intelligence
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            What actually happens after an Internet lead arrives?
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            This workspace turns communication evidence into
            management answers about contact, response, speed,
            sources, and messaging.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <HeroStat
            label="Lead population"
            value={number(leads)}
            detail="Canonical Internet leads"
          />

          <HeroStat
            label="Timeline coverage"
            value={pct(timelineCoverageRate)}
            detail={`${number(timelineCovered)} leads with timeline evidence`}
          />

          <HeroStat
            label="Contact rate"
            value={pct(
              initialAnalysis.contact.contactRate,
            )}
            detail={`${number(notContacted)} leads without observed contact`}
          />

          <HeroStat
            label="Response rate"
            value={pct(
              initialAnalysis.engagement.responseRate,
            )}
            detail={`${number(responded)} observed responses`}
          />
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Management questions"
          title="Start with the answers"
          description="The page leads with questions a manager can act on, then shows exactly how each answer is established."
        />

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <QuestionCard
            eyebrow="01 · Speed"
            title="Are we getting to leads quickly?"
            value={minutes(
              initialAnalysis.contact
                .medianFirstContactMinutes,
            )}
            valueLabel="median speed-to-lead"
          >
            <p>
              {number(contacted)} leads have a
              qualifying employee outbound
              communication.
            </p>

            <EvidenceDetails
              population={`${number(leads)} canonical Internet leads`}
              numerator={`${number(contacted)} leads with qualifying employee outbound`}
              denominator={`${number(leads)} canonical leads`}
              evidence="Lead creation timestamp → first qualifying employee outbound"
              limitation={
                timelineCovered < leads
                  ? "Timeline coverage is incomplete, so this describes observed communication evidence."
                  : "All canonical leads have timeline coverage."
              }
            />
          </QuestionCard>

          <QuestionCard
            eyebrow="02 · Contact gap"
            title="Where are leads falling out?"
            value={number(notContacted)}
            valueLabel="leads without observed contact"
            tone="warning"
          >
            <p>
              These leads have no qualifying
              employee outbound communication
              in the observed timeline.
            </p>

            <EvidenceDetails
              population={`${number(leads)} canonical Internet leads`}
              numerator={`${number(notContacted)} leads with no qualifying outbound`}
              denominator={`${number(leads)} canonical leads`}
              evidence="Employee outbound communication records"
              limitation={
                timelineCovered < leads
                  ? "A lead without timeline coverage cannot be distinguished from a lead with no activity."
                  : "All canonical leads have timeline coverage."
              }
            />
          </QuestionCard>

          <QuestionCard
            eyebrow="03 · Response"
            title="Do customers respond after we contact them?"
            value={pct(
              initialAnalysis.engagement.responseRate,
            )}
            valueLabel={`${number(responded)} observed responses from ${number(contacted)} contacted leads`}
          >
            <p>
              Response means an observed inbound
              communication after the first qualifying
              outbound contact.
            </p>

            <EvidenceDetails
              population={`${number(contacted)} contacted leads`}
              numerator={`${number(responded)} contacted leads with observed inbound response`}
              denominator={`${number(contacted)} contacted leads`}
              evidence="Outbound contact → subsequent inbound communication"
              limitation="This is observed response behavior, not a modeled or assumed response."
            />
          </QuestionCard>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeading
            eyebrow="Behavior"
            title="Does speed appear associated with response?"
            description="Compare observed response rates by actual speed-to-lead bucket. Counts stay visible so small groups are not mistaken for strong evidence."
          />

          <div className="mt-6 space-y-4">
            {contactSpeed.map((row) => (
              <div
                key={row.key}
                className="grid grid-cols-[82px_1fr_100px] items-center gap-3"
              >
                <span className="text-xs font-medium text-slate-600">
                  {row.label}
                </span>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900"
                    style={{
                      width: `${Math.max(
                        2,
                        (row.rate ?? 0) * 100,
                      )}%`,
                    }}
                  />
                </div>

                <span className="text-right text-xs font-semibold tabular-nums text-slate-700">
                  {pct(row.rate)} · {number(row.contacted)}
                </span>
              </div>
            ))}
          </div>

          <EvidenceNote>
            Population: contacted leads. Numerator: contacted
            leads with observed inbound response. Denominator:
            contacted leads in each speed bucket. This shows
            association in the observed data; it does not prove
            that response speed caused the outcome.
          </EvidenceNote>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeading
            eyebrow="Evidence quality"
            title="Can we support the story?"
            description="Coverage is shown before interpretation so incomplete timeline evidence cannot quietly become a false conclusion."
          />

          <div className="mt-6 space-y-4">
            <EvidenceRow
              label="Lead population"
              value={number(leads)}
              detail="Canonical Internet leads"
            />

            <EvidenceRow
              label="Timeline-covered"
              value={`${number(timelineCovered)} / ${number(leads)}`}
              detail={`${pct(timelineCoverageRate)} coverage`}
            />

            <EvidenceRow
              label="Contact evidence"
              value={number(contacted)}
              detail="Qualifying employee outbound"
            />

            <EvidenceRow
              label="Response evidence"
              value={number(responded)}
              detail="Observed inbound after contact"
            />

            <EvidenceRow
              label="Appointment evidence"
              value={number(
                initialAnalysis.progression
                  .appointmentEvidence,
              )}
              detail="Observed appointment-created evidence"
            />

            <EvidenceRow
              label="Sold / Closed"
              value={number(
                initialAnalysis.progression.soldClosed,
              )}
              detail="Current observed lead state"
            />
          </div>

          <EvidenceNote>
            Timeline-based findings are evidence-backed only to
            the extent the lead has usable timeline coverage.
            Sold / Closed is the current observed lead state,
            not a reconstructed transaction history.
          </EvidenceNote>
        </section>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeading
          eyebrow="Source intelligence"
          title="Which sources produce workable leads?"
          description="Volume alone is not enough. Compare contact, response, speed, and appointment evidence while keeping small populations out of the ranking."
        />

        {sourceRows.length ? (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-3 font-semibold">
                    Source
                  </th>
                  <th className="pb-3 text-right font-semibold">
                    Leads
                  </th>
                  <th className="pb-3 text-right font-semibold">
                    Contact
                  </th>
                  <th className="pb-3 text-right font-semibold">
                    Response
                  </th>
                  <th className="pb-3 text-right font-semibold">
                    Median contact
                  </th>
                  <th className="pb-3 text-right font-semibold">
                    Appointment
                  </th>
                </tr>
              </thead>

              <tbody>
                {sourceRows.map((row) => (
                  <tr
                    key={row.source}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-4">
                      <div className="font-medium text-slate-900">
                        {sourceLabel(row.source)}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        {row.sourceGroup}
                      </div>
                    </td>

                    <td className="py-4 text-right tabular-nums">
                      {number(row.leads)}
                    </td>

                    <td className="py-4 text-right tabular-nums">
                      {pct(row.contactRate)}
                    </td>

                    <td className="py-4 text-right font-semibold tabular-nums">
                      {pct(row.responseRate)}
                    </td>

                    <td className="py-4 text-right tabular-nums text-slate-600">
                      {minutes(
                        row.medianFirstContactMinutes,
                      )}
                    </td>

                    <td className="py-4 text-right tabular-nums text-slate-600">
                      {pct(row.appointmentRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="Not enough source volume to show a stable comparison yet." />
        )}

        <EvidenceNote>
          Sources with fewer than three leads are excluded from
          this management comparison. Differences are
          associations, not causal findings.
        </EvidenceNote>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Communication intelligence"
            title="Which messages are associated with better responses?"
            description="Matched timeline messages become an analytical dimension instead of remaining hidden in raw activity."
          />

          <div className="flex gap-2">
            <Pill label={`${number(matchedSendCount)} matched sends`} />
            <Pill
              label={`${number(reviewCount)} review matches`}
            />
          </div>
        </div>

        {templateRows.length ? (
          <div className="mt-6 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {templateRows.map((row) => (
              <div
                key={row.templateId}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-[11px] font-semibold text-slate-500">
                      {row.templateCode}
                    </span>

                    <h3 className="mt-1 font-semibold text-slate-900">
                      {row.name}
                    </h3>
                  </div>

                  <Pill label={row.sourceKind} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MiniMetric
                    label="Matched"
                    value={number(row.matchedUses)}
                  />

                  <MiniMetric
                    label="Response"
                    value={pct(row.responseRate)}
                  />

                  <MiniMetric
                    label="Median response"
                    value={minutes(
                      row.medianResponseMinutes,
                    )}
                  />

                  <MiniMetric
                    label="Appointment"
                    value={pct(row.appointmentRate)}
                  />
                </div>

                <details className="mt-4 border-t border-slate-100 pt-3">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-600">
                    Show evidence definition
                  </summary>

                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    Response is tied to the matched send and
                    observed inbound communication. Appointment
                    and Sold / Closed values are lead-level
                    associations among matched leads. They do
                    not establish that the message caused the
                    outcome.
                  </p>
                </details>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="Run template matching to begin communication analysis." />
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <SectionHeading
          eyebrow="Reproducibility"
          title="Keep the evidence reproducible"
          description="These operations maintain the derived communication evidence. They are controls for the analytical system, not the primary management story."
        />

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {METHODS.map((method) => {
            const latest = runs.find(
              (run) =>
                run.method_key ===
                methodKey(method.key),
            );

            const isRunning =
              running === method.key;

            return (
              <div
                key={method.key}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {method.title}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {method.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => runMethod(method)}
                    disabled={isRunning}
                    className="shrink-0 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {isRunning
                      ? "Running…"
                      : "Run method"}
                  </button>
                </div>

                {latest ? (
                  <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
                    <RunFact
                      label="Status"
                      value={latest.status}
                    />

                    <RunFact
                      label="Last run"
                      value={formatDate(
                        latest.started_at,
                      )}
                    />

                    <RunFact
                      label="Result"
                      value={
                        Object.entries(
                          latest.result ?? {},
                        )
                          .map(
                            ([key, value]) =>
                              `${key}: ${value}`,
                          )
                          .join(" · ") || "—"
                      }
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Template library"
            title="Inspect the actual communication"
            description="Search the catalog, inspect the definition, and compare it with observed performance."
          />

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["email", "Email"],
                ["text", "Text"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setTypeFilter(value)
                }
                className={[
                  "rounded-lg px-3 py-2 text-xs font-semibold",
                  typeFilter === value
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 bg-white text-slate-600",
                ].join(" ")}
              >
                {label}
              </button>
            ))}

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search templates…"
              className="w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="max-h-[680px] overflow-y-auto rounded-xl border border-slate-200">
            {filteredTemplates.map((template) => {
              const metric = metrics.find(
                (item) =>
                  item.templateId ===
                  template.id,
              );

              const selected =
                template.id === selectedId;

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() =>
                    setSelectedId(template.id)
                  }
                  className={[
                    "w-full border-b border-slate-100 px-4 py-4 text-left last:border-b-0",
                    selected
                      ? "bg-slate-100"
                      : "hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-950 px-1.5 py-0.5 font-mono text-xs font-semibold text-white">
                          {template.template_code}
                        </span>

                        <span className="text-[10px] uppercase tracking-wide text-slate-400">
                          {template.source_kind}
                        </span>
                      </div>

                      <p className="mt-2 truncate text-sm font-medium">
                        {template.name}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs tabular-nums text-slate-500">
                      {metric?.matchedUses ?? 0}
                    </span>
                  </div>
                </button>
              );
            })}

            {!filteredTemplates.length ? (
              <EmptyState text="No templates match the current filter." />
            ) : null}
          </div>

          {selectedTemplate ? (
            <div className="space-y-5">
              {selectedMetric ? (
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric
                    label="Matched sends"
                    value={number(
                      selectedMetric.matchedUses,
                    )}
                  />

                  <Metric
                    label="Response rate"
                    value={pct(
                      selectedMetric.responseRate,
                    )}
                    detail={`${number(
                      selectedMetric.responses,
                    )} observed responses`}
                  />

                  <Metric
                    label="Median response"
                    value={minutes(
                      selectedMetric.medianResponseMinutes,
                    )}
                  />

                  <Metric
                    label="Unique leads"
                    value={number(
                      selectedMetric.uniqueLeads,
                    )}
                  />

                  <Metric
                    label="Appointment evidence"
                    value={number(
                      selectedMetric.appointmentEvidenceLeads,
                    )}
                    detail={pct(
                      selectedMetric.appointmentRate,
                    )}
                  />

                  <Metric
                    label="Sold / Closed"
                    value={number(
                      selectedMetric.soldClosedLeads,
                    )}
                    detail={pct(
                      selectedMetric.soldClosedRate,
                    )}
                  />

                  <Metric
                    label="Review matches"
                    value={number(
                      selectedMetric.reviewUses,
                    )}
                  />

                  <Metric
                    label="Average response"
                    value={minutes(
                      selectedMetric.averageResponseMinutes,
                    )}
                  />
                </section>
              ) : null}

              <form
                onSubmit={saveTemplate}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-950 px-2 py-1 font-mono text-xs font-semibold text-white">
                        {selectedTemplate.template_code}
                      </span>

                      <span className="text-xs uppercase tracking-wide text-slate-400">
                        {selectedTemplate.source_kind}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-semibold">
                      Template definition
                    </h3>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={
                        selectedTemplate.is_active
                      }
                    />
                    Active
                  </label>
                </div>

                <div className="mt-6 grid gap-5">
                  <Field label="Name">
                    <input
                      name="name"
                      defaultValue={
                        selectedTemplate.name
                      }
                      key={`name-${selectedTemplate.id}-${selectedTemplate.updated_at}`}
                      className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                    />
                  </Field>

                  <Field label="Description">
                    <textarea
                      name="description"
                      defaultValue={
                        selectedTemplate.description
                      }
                      key={`description-${selectedTemplate.id}-${selectedTemplate.updated_at}`}
                      rows={3}
                      className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                    />
                  </Field>

                  <Field label="Subject">
                    <input
                      name="subject"
                      defaultValue={
                        selectedTemplate.subject ?? ""
                      }
                      key={`subject-${selectedTemplate.id}-${selectedTemplate.updated_at}`}
                      className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                    />
                  </Field>

                  <Field label="Content">
                    <textarea
                      name="content"
                      defaultValue={
                        selectedTemplate.content
                      }
                      key={`content-${selectedTemplate.id}-${selectedTemplate.updated_at}`}
                      rows={12}
                      className="rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs leading-5 outline-none focus:border-slate-500"
                    />
                  </Field>

                  <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
                    <p className="text-xs leading-5 text-slate-400">
                      Template code and permanent database ID are system-managed.
                    </p>

                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      {saving
                        ? "Saving…"
                        : "Save template"}
                    </button>
                  </div>
                </div>
              </form>

              <EvidenceNote>
                Template response metrics are based on
                matched sends and observed inbound
                communication. Appointment and Sold /
                Closed figures are lead-level associations,
                not causal attribution.
              </EvidenceNote>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {eyebrow}
      </p>

      <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900">
        {title}
      </h2>

      <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function QuestionCard({
  eyebrow,
  title,
  value,
  valueLabel,
  tone = "neutral",
  children,
}: {
  eyebrow: string;
  title: string;
  value: string;
  valueLabel: string;
  tone?: "neutral" | "warning";
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {eyebrow}
      </p>

      <h3 className="mt-2 text-lg font-semibold text-slate-900">
        {title}
      </h3>

      <p
        className={[
          "mt-5 text-3xl font-semibold tracking-tight tabular-nums",
          tone === "warning"
            ? "text-amber-700"
            : "text-slate-950",
        ].join(" ")}
      >
        {value}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-400">
        {valueLabel}
      </p>

      <div className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
        {children}
      </div>
    </section>
  );
}

function EvidenceDetails({
  population,
  numerator,
  denominator,
  evidence,
  limitation,
}: {
  population: string;
  numerator: string;
  denominator: string;
  evidence: string;
  limitation: string;
}) {
  return (
    <details className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <summary className="cursor-pointer text-xs font-semibold text-slate-700">
        Prove this number
      </summary>

      <div className="mt-3 space-y-2 text-xs leading-5 text-slate-500">
        <EvidenceLine
          label="Population"
          value={population}
        />

        <EvidenceLine
          label="Numerator"
          value={numerator}
        />

        <EvidenceLine
          label="Denominator"
          value={denominator}
        />

        <EvidenceLine
          label="Evidence"
          value={evidence}
        />

        <EvidenceLine
          label="Limitation"
          value={limitation}
        />
      </div>
    </details>
  );
}

function EvidenceLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <p>
      <span className="font-semibold text-slate-700">
        {label}:
      </span>{" "}
      {value}
    </p>
  );
}

function HeroStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tabular-nums">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {detail}
      </p>
    </div>
  );
}

function EvidenceNote({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
      <span className="font-semibold text-slate-700">
        Evidence standard:
      </span>{" "}
      {children}
    </div>
  );
}

function EvidenceRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <div>
        <p className="text-sm font-medium text-slate-800">
          {label}
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          {detail}
        </p>
      </div>

      <p className="text-sm font-semibold tabular-nums text-slate-900">
        {value}
      </p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
        {value}
      </p>
    </div>
  );
}

function RunFact({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </span>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-800">
      {label}
      {children}
    </label>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <p className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
      {text}
    </p>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>

      {detail ? (
        <p className="mt-1 text-xs text-slate-500">
          {detail}
        </p>
      ) : null}
    </div>
  );
}
