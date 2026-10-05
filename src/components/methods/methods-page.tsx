"use client";

import { useMemo, useState } from "react";

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
  initialRuns: MethodRun[];
  initialTemplates: Template[];
  initialMetrics: TemplateMetric[];
};

const METHODS = [
  {
    key: "sync-templates",
    title: "Sync Tekion Templates",
    description:
      "Reads the Tekion template catalog stored in the repository and synchronizes it into Supabase. Existing templates keep their permanent IDs.",
    endpoint:
      "/api/methods/sync-templates",
  },
  {
    key: "match-templates",
    title: "Match Timeline Events to Templates",
    description:
      "Compares outbound email and text communications against the known Tekion templates. Dynamic fields, HTML formatting, and personalization are ignored.",
    endpoint:
      "/api/methods/match-templates",
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

export function MethodsPage({
  initialRuns,
  initialTemplates,
  initialMetrics,
}: Props) {
  const [runs, setRuns] =
    useState(initialRuns);
  const [templates, setTemplates] =
    useState(initialTemplates);
  const [metrics, setMetrics] =
    useState(initialMetrics);
  const [selectedId, setSelectedId] =
    useState(
      initialTemplates[0]?.id ?? null,
    );
  const [search, setSearch] =
    useState("");
  const [typeFilter, setTypeFilter] =
    useState<"all" | "email" | "text">(
      "all",
    );
  const [running, setRunning] =
    useState<string | null>(null);
  const [saving, setSaving] =
    useState(false);
  const [message, setMessage] =
    useState<string | null>(null);

  const filteredTemplates =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return templates.filter(
        (template) => {
          if (
            typeFilter !== "all" &&
            template.source_kind !==
              typeFilter
          ) {
            return false;
          }

          if (!query) return true;

          return [
            template.template_code,
            template.name,
            template.subject ?? "",
          ].some((value) =>
            value
              .toLowerCase()
              .includes(query),
          );
        },
      );
    }, [
      templates,
      search,
      typeFilter,
    ]);

  const selectedTemplate =
    templates.find(
      (template) =>
        template.id === selectedId,
    ) ?? null;

  const selectedMetric =
    metrics.find(
      (metric) =>
        metric.templateId === selectedId,
    ) ?? null;

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

      const payload =
        (await response.json()) as {
          id?: string;
          result?: Record<
            string,
            number
          >;
          error?: string;
        };

      if (!response.ok) {
        throw new Error(
          payload.error ??
            "Method failed.",
        );
      }

      setMessage(
        `${method.title} completed successfully.`,
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
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedTemplate) return;

    setSaving(true);
    setMessage(null);

    const form =
      new FormData(event.currentTarget);

    try {
      const response = await fetch(
        `/api/templates/${selectedTemplate.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: form.get("name"),
            description:
              form.get("description"),
            subject:
              form.get("subject"),
            content:
              form.get("content"),
            isActive:
              form.get("isActive") ===
              "on",
          }),
        },
      );

      const payload =
        (await response.json()) as {
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
            template.id ===
            payload.template!.id
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
    <div className="space-y-8">
      {message && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          {message}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        {METHODS.map((method) => {
          const latest =
            runs.find(
              (run) =>
                run.method_key ===
                methodKey(method.key),
            );

          const isRunning =
            running === method.key;

          return (
            <section
              key={method.key}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {method.title}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {method.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    runMethod(method)
                  }
                  disabled={isRunning}
                  className="shrink-0 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isRunning
                    ? "Running..."
                    : "Run method"}
                </button>
              </div>

              {latest && (
                <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Status
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {latest.status}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Last run
                    </p>
                    <p className="mt-1 text-sm">
                      {formatDate(
                        latest.started_at,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Result
                    </p>
                    <p className="mt-1 text-sm">
                      {Object.entries(
                        latest.result ?? {},
                      )
                        .map(
                          ([key, value]) =>
                            `${key}: ${value}`,
                        )
                        .join(" · ") || "—"}
                    </p>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Template catalog
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a template to inspect its observed performance and edit its definition.
            </p>
          </div>

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
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search templates..."
              className="w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="max-h-[720px] overflow-y-auto rounded-2xl border border-slate-200 bg-white">
            {filteredTemplates.map(
              (template) => {
                const metric =
                  metrics.find(
                    (item) =>
                      item.templateId ===
                      template.id,
                  );

                const selected =
                  template.id ===
                  selectedId;

                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() =>
                      setSelectedId(
                        template.id,
                      )
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
              },
            )}

            {!filteredTemplates.length && (
              <p className="p-6 text-sm text-slate-500">
                No templates match the current filter.
              </p>
            )}
          </div>

          {selectedTemplate && (
            <div className="space-y-6">
              {selectedMetric && (
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric
                    label="Matched sends"
                    value={String(
                      selectedMetric.matchedUses,
                    )}
                  />
                  <Metric
                    label="Response rate"
                    value={pct(
                      selectedMetric.responseRate,
                    )}
                    detail={`${selectedMetric.responses} observed responses`}
                  />
                  <Metric
                    label="Median response"
                    value={minutes(
                      selectedMetric.medianResponseMinutes,
                    )}
                  />
                  <Metric
                    label="Unique leads"
                    value={String(
                      selectedMetric.uniqueLeads,
                    )}
                  />
                  <Metric
                    label="Appointment evidence"
                    value={String(
                      selectedMetric.appointmentEvidenceLeads,
                    )}
                    detail={pct(
                      selectedMetric.appointmentRate,
                    )}
                  />
                  <Metric
                    label="Sold / Closed"
                    value={String(
                      selectedMetric.soldClosedLeads,
                    )}
                    detail={pct(
                      selectedMetric.soldClosedRate,
                    )}
                  />
                  <Metric
                    label="Review matches"
                    value={String(
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
              )}

              <form
                onSubmit={saveTemplate}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-950 px-2 py-1 font-mono text-xs font-semibold text-white">
                        {
                          selectedTemplate.template_code
                        }
                      </span>
                      <span className="text-xs uppercase tracking-wide text-slate-400">
                        {selectedTemplate.source_kind}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-semibold">
                      Edit template
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
                  <label className="grid gap-2 text-sm font-medium">
                    Name
                    <input
                      name="name"
                      defaultValue={
                        selectedTemplate.name
                      }
                      key={`name-${selectedTemplate.id}-${selectedTemplate.updated_at}`}
                      className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium">
                    Description
                    <textarea
                      name="description"
                      defaultValue={
                        selectedTemplate.description
                      }
                      key={`description-${selectedTemplate.id}-${selectedTemplate.updated_at}`}
                      rows={3}
                      className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium">
                    Subject
                    <input
                      name="subject"
                      defaultValue={
                        selectedTemplate.subject ??
                        ""
                      }
                      key={`subject-${selectedTemplate.id}-${selectedTemplate.updated_at}`}
                      className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium">
                    Content
                    <textarea
                      name="content"
                      defaultValue={
                        selectedTemplate.content
                      }
                      key={`content-${selectedTemplate.id}-${selectedTemplate.updated_at}`}
                      rows={14}
                      className="rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs leading-5 outline-none focus:border-slate-500"
                    />
                  </label>

                  <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
                    <p className="text-xs leading-5 text-slate-400">
                      Template code and permanent database ID are managed by the system.
                    </p>

                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      {saving
                        ? "Saving..."
                        : "Save template"}
                    </button>
                  </div>
                </div>
              </form>

              <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="font-semibold">
                  What the metrics mean
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Response metrics are tied to the actual matched template send and the next observed inbound communication. Appointment and Sold / Closed figures are lead-level associations among leads that received a matched send; they do not establish that the template caused the outcome.
                </p>
              </section>
            </div>
          )}
        </div>
      </section>
    </div>
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
