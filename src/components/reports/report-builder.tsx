"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  REPORT_DATE_BASES,
  REPORT_DIMENSIONS,
  REPORT_MEASURES,
} from "@/reports/report-catalog";
import {
  MANAGEMENT_REPORT_PRESETS,
  type ManagementReportPreset,
} from "@/reports/report-presets";
import { saveReportAction } from "@/reports/actions";
import { DEFAULT_REPORT_DEFINITION } from "@/reports/report-definition";
import type {
  ReportDefinition,
  ReportMetricKey,
  ReportResult,
  SavedReport,
} from "@/reports/report-types";

type ReportBuilderProps = {
  definition: ReportDefinition;
  savedReport: SavedReport | null;
  options: {
    sources: string[];
    sourceGroups: string[];
    stages: string[];
    statuses: string[];
    templates: string[];
  };
};

type FilterKey = Exclude<
  keyof ReportDefinition["filters"],
  "evidence"
>;

type EvidenceFilterKey =
  keyof ReportDefinition["filters"]["evidence"];

export function ReportBuilder({
  definition,
  savedReport,
  options,
}: ReportBuilderProps) {
  const [draft, setDraft] =
    useState<ReportDefinition>(definition);
  const [presetSearch, setPresetSearch] = useState("");
  const [presetCategory, setPresetCategory] = useState("All questions");
  const [measureSearch, setMeasureSearch] = useState("");
  const [preview, setPreview] = useState<ReportResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setPreviewLoading(true);
      setPreviewError(null);
      try {
        const response = await fetch("/api/reports/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(typeof payload.error === "string" ? payload.error : "Preview could not be calculated.");
        }
        setPreview(payload as ReportResult);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setPreviewError(error instanceof Error ? error.message : "Preview could not be calculated.");
      } finally {
        if (!controller.signal.aborted) setPreviewLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [draft]);

  const presetCategories = [
    "All questions",
    "Lead performance",
    "Response & follow-up",
    "Appointments & sales",
    "Email & templates",
  ];

  const filteredPresets = MANAGEMENT_REPORT_PRESETS.filter((preset) => {
    const matchesCategory =
      presetCategory === "All questions" ||
      preset.category === presetCategory;
    const query = presetSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [preset.label, preset.description, preset.category, preset.name]
        .some((value) => value.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  const selectedBasis =
    REPORT_DATE_BASES.find(
      (basis) =>
        basis.key === draft.dateRange.basis,
    );

  function updateFilter(
    key: FilterKey,
    value: string,
    checked: boolean,
  ) {
    setDraft((current) => {
      const existing =
        current.filters[key];

      const next = checked
        ? [...existing, value]
        : existing.filter(
            (item) => item !== value,
          );

      return {
        ...current,
        filters: {
          ...current.filters,
          [key]: next,
        },
      };
    });
  }

  function updateEvidenceFilter(
    key: EvidenceFilterKey,
    value:
      | "any"
      | "observed"
      | "not_observed"
      | "yes"
      | "no",
  ) {
    setDraft((current) => ({
      ...current,
      filters: {
        ...current.filters,
        evidence: {
          ...current.filters.evidence,
          [key]: value,
        },
      },
    }));
  }

  function applyPreset(
    preset: ManagementReportPreset,
  ) {
    setDraft((current) => ({
      ...current,
      name: preset.name,
      dateRange: {
        basis: "lead_created",
        start: null,
        end: null,
      },
      groupBy: preset.groupBy,
      filters: {
        sources: [],
        sourceGroups: [],
        stages: [],
        statuses: [],
        templates: [],
        evidence: {
          outbound: "any",
          response: "any",
          appointment: "any",
          outcome: "any",
          responseWithin24h: "any",
          ...preset.evidence,
        },
      },
      metrics: [...preset.metrics],
    }));
  }

  function toggleMetric(
    value: ReportDefinition["metrics"][number],
    checked: boolean,
  ) {
    setDraft((current) => {
      const metrics = checked
        ? [...current.metrics, value]
        : current.metrics.filter(
            (metric) => metric !== value,
          );

      return {
        ...current,
        metrics:
          metrics.length > 0
            ? metrics
            : current.metrics,
      };
    });
  }

  function selectAllMetrics() {
    setDraft((current) => ({
      ...current,
      metrics: REPORT_MEASURES.map((metric) => metric.key),
    }));
  }

  function resetMetrics() {
    setDraft((current) => ({
      ...current,
      metrics: [...DEFAULT_REPORT_DEFINITION.metrics],
    }));
  }

  function moveMetric(
    metric: ReportMetricKey,
    direction: -1 | 1,
  ) {
    setDraft((current) => {
      const index = current.metrics.indexOf(metric);
      const nextIndex = index + direction;

      if (
        index < 0 ||
        nextIndex < 0 ||
        nextIndex >= current.metrics.length
      ) {
        return current;
      }

      const metrics = [...current.metrics];
      [metrics[index], metrics[nextIndex]] = [
        metrics[nextIndex],
        metrics[index],
      ];

      return { ...current, metrics };
    });
  }

  function applyPdfPreset(preset: "executive" | "detailed" | "data") {
    setDraft((current) => {
      const common = current.pdfOptions;
      if (preset === "executive") {
        return {
          ...current,
          pdfOptions: {
            ...common,
            layoutPreset: preset,
            orientation: "portrait",
            density: "comfortable",
            maxRows: "25",
            includeExecutiveSummary: true,
            includeDetailedResults: true,
            includeMetricDefinitions: false,
            includeTemplateUsage: false,
            includeEmailEngagement: false,
          },
        };
      }

      if (preset === "data") {
        return {
          ...current,
          pdfOptions: {
            ...common,
            layoutPreset: preset,
            orientation: "landscape",
            density: "compact",
            maxRows: "all",
            includeExecutiveSummary: false,
            includeDetailedResults: true,
            includeMetricDefinitions: false,
            includeTemplateUsage: true,
            includeEmailEngagement: true,
          },
        };
      }

      return {
        ...current,
        pdfOptions: {
          ...common,
          layoutPreset: preset,
          orientation: "landscape",
          density: "comfortable",
          maxRows: "all",
          includeExecutiveSummary: true,
          includeDetailedResults: true,
          includeMetricDefinitions: true,
          includeTemplateUsage: true,
          includeEmailEngagement: true,
        },
      };
    });
  }

  function updatePdfOptions(
    patch: Partial<ReportDefinition["pdfOptions"]>,
  ) {
    setDraft((current) => ({
      ...current,
      pdfOptions: { ...current.pdfOptions, ...patch },
    }));
  }

  function updateSectionTitle(
    key: keyof ReportDefinition["pdfOptions"]["sectionTitles"],
    value: string,
  ) {
    setDraft((current) => ({
      ...current,
      pdfOptions: {
        ...current.pdfOptions,
        sectionTitles: {
          ...current.pdfOptions.sectionTitles,
          [key]: value,
        },
      },
    }));
  }

  return (
    <div className="space-y-6">
      <details className="group rounded-xl border border-slate-200 bg-white">
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <span>
            <span className="block text-sm font-semibold text-slate-900">Start from a management question</span>
            <span className="mt-1 block text-xs text-slate-500">Optional shortcuts to prefill your custom report.</span>
          </span>
          <span className="text-xs font-medium text-slate-500">
            {MANAGEMENT_REPORT_PRESETS.length} starting points <span className="ml-1 inline-block transition group-open:rotate-180">↓</span>
          </span>
        </summary>
        <div className="space-y-3 border-t border-slate-200 p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
            <input
              type="search"
              aria-label="Search management questions"
              placeholder="Search questions or topics…"
              value={presetSearch}
              onChange={(event) => setPresetSearch(event.target.value)}
              className={inputClass}
            />
            <select
              aria-label="Filter management questions by category"
              value={presetCategory}
              onChange={(event) => setPresetCategory(event.target.value)}
              className={inputClass}
            >
              {presetCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
          {filteredPresets.length ? (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                >
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">{preset.category}</span>
                  <span className="mt-1 block text-sm font-semibold text-slate-900">{preset.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">{preset.description}</span>
                  <span className="mt-2 block text-xs font-medium text-slate-700">Use this setup →</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No matching questions. Try another search or category.</p>
          )}
        </div>
      </details>

      <form
        method="get"
        className="space-y-6"
      >
        <input
          type="hidden"
          name="pdfOptions"
          value={JSON.stringify(draft.pdfOptions)}
        />
        <div className="grid gap-5 lg:grid-cols-3">
          <Field
            label="Report name"
            description="Used when the report is saved."
          >
            <input
              name="name"
              value={draft.name}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  name: event.target.value,
                })
              }
              maxLength={120}
              className={inputClass}
            />
          </Field>

          <Field
            label="Population date"
            description="Controls which leads are included in the report."
          >
            <select
              name="dateBasis"
              value={draft.dateRange.basis}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  dateRange: {
                    ...draft.dateRange,
                    basis:
                      event.target
                        .value as ReportDefinition["dateRange"]["basis"],
                  },
                })
              }
              className={inputClass}
            >
              {REPORT_DATE_BASES.map(
                (basis) => (
                  <option
                    key={basis.key}
                    value={basis.key}
                  >
                    {basis.label}
                  </option>
                ),
              )}
            </select>

            {selectedBasis ? (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {selectedBasis.description}
              </p>
            ) : null}
          </Field>

          <Field
            label="Group rows by"
            description="Choose how the report is broken into comparable rows."
          >
            <select
              name="groupBy"
              value={draft.groupBy}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  groupBy:
                    event.target
                      .value as ReportDefinition["groupBy"],
                })
              }
              className={inputClass}
            >
              {REPORT_DIMENSIONS.map(
                (dimension) => (
                  <option
                    key={dimension.key}
                    value={dimension.key}
                  >
                    {dimension.label}
                  </option>
                ),
              )}
            </select>
          </Field>
        </div>

        <details className="group rounded-xl border border-slate-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5">
            <span>
              <span className="block text-sm font-semibold text-slate-900">Advanced filters</span>
              <span className="mt-1 block text-xs text-slate-500">Date range, sources, stages, templates, and evidence rules.</span>
            </span>
            <span className="text-xs font-medium text-slate-500">Optional <span className="ml-1 inline-block transition group-open:rotate-180">↓</span></span>
          </summary>
          <div className="space-y-5 border-t border-slate-200 p-4">
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Start date"
            description="Inclusive. Leave blank for the earliest available date."
          >
            <input
              type="date"
              name="start"
              value={
                draft.dateRange.start ?? ""
              }
              onChange={(event) =>
                setDraft({
                  ...draft,
                  dateRange: {
                    ...draft.dateRange,
                    start:
                      event.target.value ||
                      null,
                  },
                })
              }
              className={inputClass}
            />
          </Field>

          <Field
            label="End date"
            description="Inclusive. Leave blank for the latest available date."
          >
            <input
              type="date"
              name="end"
              value={
                draft.dateRange.end ?? ""
              }
              onChange={(event) =>
                setDraft({
                  ...draft,
                  dateRange: {
                    ...draft.dateRange,
                    end:
                      event.target.value ||
                      null,
                  },
                })
              }
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FilterSelect
            name="source"
            label="Lead sources"
            options={options.sources}
            selected={
              draft.filters.sources
            }
            onToggle={(value, checked) =>
              updateFilter(
                "sources",
                value,
                checked,
              )
            }
          />

          <FilterSelect
            name="sourceGroup"
            label="Source groups"
            options={options.sourceGroups}
            selected={
              draft.filters.sourceGroups
            }
            onToggle={(value, checked) =>
              updateFilter(
                "sourceGroups",
                value,
                checked,
              )
            }
          />

          <FilterSelect
            name="stage"
            label="Stages"
            options={options.stages}
            selected={
              draft.filters.stages
            }
            onToggle={(value, checked) =>
              updateFilter(
                "stages",
                value,
                checked,
              )
            }
          />

          <FilterSelect
            name="status"
            label="Statuses"
            options={options.statuses}
            selected={
              draft.filters.statuses
            }
            onToggle={(value, checked) =>
              updateFilter(
                "statuses",
                value,
                checked,
              )
            }
          />

          <FilterSelect
            name="template"
            label="Matched templates"
            options={options.templates}
            selected={
              draft.filters.templates
            }
            onToggle={(value, checked) =>
              updateFilter(
                "templates",
                value,
                checked,
              )
            }
          />
        </div>

        <div>
          <div className="mb-3">
            <p className="text-sm font-semibold">
              Evidence filters
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Filter the population using observed evidence rather than
              assuming missing evidence means the event did not happen.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <EvidenceSelect
              name="evidenceOutbound"
              label="Outbound"
              value={draft.filters.evidence.outbound}
              onChange={(value) =>
                updateEvidenceFilter("outbound", value)
              }
              options={[
                ["any", "Any"],
                ["observed", "Observed"],
                ["not_observed", "Not observed"],
              ]}
            />

            <EvidenceSelect
              name="evidenceResponse"
              label="Response"
              value={draft.filters.evidence.response}
              onChange={(value) =>
                updateEvidenceFilter("response", value)
              }
              options={[
                ["any", "Any"],
                ["observed", "Observed"],
                ["not_observed", "Not observed"],
              ]}
            />

            <EvidenceSelect
              name="evidenceAppointment"
              label="Appointment"
              value={draft.filters.evidence.appointment}
              onChange={(value) =>
                updateEvidenceFilter("appointment", value)
              }
              options={[
                ["any", "Any"],
                ["observed", "Observed"],
                ["not_observed", "Not observed"],
              ]}
            />

            <EvidenceSelect
              name="evidenceOutcome"
              label="Outcome"
              value={draft.filters.evidence.outcome}
              onChange={(value) =>
                updateEvidenceFilter("outcome", value)
              }
              options={[
                ["any", "Any"],
                ["observed", "Observed"],
                ["not_observed", "Not observed"],
              ]}
            />

            <EvidenceSelect
              name="evidenceResponseWithin24h"
              label="Response within 24h"
              value={draft.filters.evidence.responseWithin24h}
              onChange={(value) =>
                updateEvidenceFilter(
                  "responseWithin24h",
                  value,
                )
              }
              options={[
                ["any", "Any"],
                ["yes", "Yes"],
                ["no", "No"],
              ]}
            />
          </div>
        </div>

          </div>
        </details>

        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Measures</p>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Choose what to calculate. Each measure retains its population, evidence, and denominator rules.</p>
              <p className="mt-2 text-xs font-medium text-slate-700">
                {draft.metrics.length} of {REPORT_MEASURES.length} measures selected
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={selectAllMetrics}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={resetMetrics}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50"
                >
                  Reset to defaults
                </button>
              </div>
            </div>
            <input
              type="search"
              aria-label="Search report measures"
              placeholder="Search measures…"
              value={measureSearch}
              onChange={(event) => setMeasureSearch(event.target.value)}
              className={`${inputClass} sm:max-w-xs`}
            />
          </div>
          {draft.metrics.length > 0 ? (
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Selected measure order
              </p>
              <p className="mt-1 text-xs text-slate-500">
                This order controls the measure columns in your report and exports.
              </p>
              <ol className="mt-2 space-y-1.5">
                {draft.metrics.map((metric, index) => {
                  const measure = REPORT_MEASURES.find(
                    (item) => item.key === metric,
                  );
                  return (
                    <li
                      key={metric}
                      className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2"
                    >
                      <span className="w-5 shrink-0 text-xs tabular-nums text-slate-400">
                        {index + 1}.
                      </span>
                      <span className="min-w-0 flex-1 text-sm text-slate-800">
                        {measure?.label ?? metric}
                      </span>
                      <button
                        type="button"
                        onClick={() => moveMetric(metric, -1)}
                        disabled={index === 0}
                        aria-label={`Move ${measure?.label ?? metric} earlier`}
                        className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveMetric(metric, 1)}
                        disabled={index === draft.metrics.length - 1}
                        aria-label={`Move ${measure?.label ?? metric} later`}
                        className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : null}
          <div className="space-y-3">
            {(["Lead & outcomes", "Response & follow-up", "Email & templates", "Data coverage"] as const).map((group) => {
              const query = measureSearch.trim().toLowerCase();
              const groupMetrics = REPORT_MEASURES.filter((metric) =>
                getMeasureGroup(metric.key) === group &&
                (!query ||
                  metric.label.toLowerCase().includes(query) ||
                  metric.description.toLowerCase().includes(query) ||
                  metric.key.toLowerCase().includes(query)),
              );
              if (!groupMetrics.length) return null;
              const selectedCount = groupMetrics.filter((metric) => draft.metrics.includes(metric.key)).length;
              return (
                <details
                  key={group}
                  open={group === "Lead & outcomes" || group === "Response & follow-up"}
                  className="rounded-lg border border-slate-200"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3">
                    <span className="text-sm font-semibold text-slate-800">{group}</span>
                    <span className="text-xs text-slate-500">{selectedCount} of {groupMetrics.length} selected</span>
                  </summary>
                  <div className="grid gap-2 border-t border-slate-200 bg-slate-50/60 p-3 sm:grid-cols-2 xl:grid-cols-3">
                    {groupMetrics.map((metric) => {
                      const selected = draft.metrics.includes(metric.key);
                      return (
                        <label
                          key={metric.key}
                          className={[
                            "flex cursor-pointer gap-2.5 rounded-lg border p-3 transition",
                            selected ? "border-slate-800 bg-white" : "border-slate-200 bg-white hover:border-slate-400",
                          ].join(" ")}
                        >
                          <input
                            type="checkbox"
                            name="metric"
                            value={metric.key}
                            checked={selected}
                            onChange={(event) => toggleMetric(metric.key, event.target.checked)}
                            className="mt-0.5"
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-slate-900">{metric.label}</span>
                            <span className="mt-1 block text-xs leading-5 text-slate-500">{metric.description}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-3">
            <p className="text-sm font-semibold text-slate-900">Report output</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Choose which sections appear in the polished PDF. These choices are saved with this report.
              They do not change the underlying calculations or CSV export.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="PDF theme" description="Controls PDF colors and accents independently of layout.">
              <select
                value={draft.pdfOptions.theme}
                onChange={(event) => updatePdfOptions({ theme: event.target.value as ReportDefinition["pdfOptions"]["theme"] })}
                className={inputClass}
              >
                <option value="executive">Executive — navy</option>
                <option value="modern">Modern — teal</option>
                <option value="minimal">Minimal — monochrome</option>
                <option value="premium">Premium — charcoal & gold</option>
              </select>
            </Field>
            <Field label="Layout preset" description="Start with a presentation style, then customize it.">
              <select
                value={draft.pdfOptions.layoutPreset}
                onChange={(event) => applyPdfPreset(event.target.value as "executive" | "detailed" | "data")}
                className={inputClass}
              >
                <option value="executive">Executive summary</option>
                <option value="detailed">Detailed analysis</option>
                <option value="data">Data-heavy</option>
              </select>
            </Field>
            <Field label="Page orientation" description="Choose portrait or landscape pages.">
              <select
                value={draft.pdfOptions.orientation}
                onChange={(event) => updatePdfOptions({ orientation: event.target.value as "portrait" | "landscape" })}
                className={inputClass}
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </Field>
            <Field label="Table density" description="Compact rows fit more groups on each page.">
              <select
                value={draft.pdfOptions.density}
                onChange={(event) => updatePdfOptions({ density: event.target.value as "compact" | "comfortable" })}
                className={inputClass}
              >
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
              </select>
            </Field>
            <Field label="Maximum result rows" description="Limit the grouped results table; choose All to include every group.">
              <select
                value={draft.pdfOptions.maxRows}
                onChange={(event) => updatePdfOptions({ maxRows: event.target.value as "all" | "25" | "50" | "100" })}
                className={inputClass}
              >
                <option value="all">All groups</option>
                <option value="25">Top 25 groups</option>
                <option value="50">Top 50 groups</option>
                <option value="100">Top 100 groups</option>
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Report subtitle" description="Optional context shown under the report name on the PDF cover.">
                <input
                  value={draft.pdfOptions.subtitle}
                  onChange={(event) => updatePdfOptions({ subtitle: event.target.value })}
                  maxLength={240}
                  placeholder="e.g. Monthly internet lead performance review"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">Customize section headings</p>
            <p className="mt-1 mb-4 text-xs leading-5 text-slate-500">Leave a heading unchanged to keep its standard wording. Blank values use the default heading.</p>
            <div className="grid gap-4 md:grid-cols-2">
              {([
                ["executiveSummary", "Executive summary heading"],
                ["detailedResults", "Detailed results heading"],
                ["metricDefinitions", "Evidence and calculations heading"],
                ["templateUsage", "Template usage heading"],
                ["emailEngagement", "Email engagement heading"],
              ] as const).map(([key, label]) => (
                <label key={key} className="block">
                  <span className="text-sm font-medium text-slate-800">{label}</span>
                  <input
                    value={draft.pdfOptions.sectionTitles[key]}
                    onChange={(event) => updateSectionTitle(key, event.target.value)}
                    maxLength={100}
                    className={`${inputClass} mt-1`}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {([
              ["includeExecutiveSummary", "Executive summary", "Headline metrics and report context."],
              ["includeDetailedResults", "Detailed results", "Grouped results tables."],
              ["includeMetricDefinitions", "Metric definitions & evidence", "Calculations, denominators, and evidence limitations."],
              ["includeTemplateUsage", "Matched-template usage", "Action-level usage by matched template."],
              ["includeEmailEngagement", "Email engagement", "Tracked sends and lead-outcome cohorts."],
            ] as const).map(([key, label, description]) => (
              <label key={key} className="flex cursor-pointer gap-2.5 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={draft.pdfOptions[key]}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      pdfOptions: {
                        ...current.pdfOptions,
                        [key]: event.target.checked,
                      },
                    }))
                  }
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900">{label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-300 bg-slate-50 p-5" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Live report preview</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">{draft.name || "Untitled report"}</h2>
              <p className="mt-1 text-sm text-slate-600">Calculated using the current report configuration.</p>
            </div>
            <span className="text-sm text-slate-500">{previewLoading ? "Updating…" : preview ? "Preview up to date" : "Preparing preview"}</span>
          </div>
          {previewError ? (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{previewError}</p>
          ) : preview ? (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs text-slate-500">Matching leads</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{preview.populationCount.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs text-slate-500">Groups</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{preview.rows.length.toLocaleString()}</p>
                </div>
                {draft.metrics.slice(0, 2).map((metric) => (
                  <div key={metric} className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs text-slate-500">{metric}</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">
                      {preview.summary[metric] == null ? "—" : preview.summary[metric]!.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full min-w-[440px] text-sm">
                  <thead className="bg-slate-100 text-left"><tr>
                    <th className="px-3 py-2">Group</th>
                    {draft.metrics.slice(0, 3).map((metric) => <th key={metric} className="px-3 py-2 text-right">{metric}</th>)}
                  </tr></thead>
                  <tbody>
                    {preview.rows.slice(0, 5).map((row) => <tr key={row.key} className="border-t border-slate-100">
                      <td className="max-w-[220px] truncate px-3 py-2">{row.label}</td>
                      {draft.metrics.slice(0, 3).map((metric) => <td key={metric} className="px-3 py-2 text-right tabular-nums">{row.values[metric] == null ? "—" : row.values[metric]!.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>)}
                    </tr>)}
                    {preview.rows.length === 0 ? <tr><td colSpan={Math.min(draft.metrics.length, 3) + 1} className="px-3 py-5 text-center text-slate-500">No leads match these settings.</td></tr> : null}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-slate-500">Showing up to five groups. Generate the report to inspect all results and underlying leads.</p>
            </>
          ) : <p className="mt-4 text-sm text-slate-500">Calculating preview from current settings…</p>}
        </section>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
          <button
            type="submit"
            className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            Generate report
          </button>

          <Link
            href="/reports"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
          >
            Start over
          </Link>

          <span className="text-xs text-slate-400">
            Generation updates the URL so the report can
            be bookmarked or shared.
          </span>
        </div>
      </form>

      <form
        action={saveReportAction}
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
      >
        <div>
          <p className="text-sm font-semibold">
            {savedReport
              ? "Saved report"
              : "Save this report"}
          </p>
          <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
            Save the exact configuration currently shown
            above. You do not need to generate again first.
          </p>
        </div>

        <input
          type="hidden"
          name="definition"
          value={JSON.stringify(draft)}
        />

        {savedReport ? (
          <input
            type="hidden"
            name="reportId"
            value={savedReport.id}
          />
        ) : null}

        <button
          type="submit"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-slate-100"
        >
          {savedReport
            ? "Save changes"
            : "Save report"}
        </button>
      </form>
    </div>
  );
}



function getMeasureGroup(key: ReportMetricKey) {
  switch (key) {
    case "leads":
    case "contacted":
    case "observedOutbound":
    case "outboundAttempts":
    case "appointments":
    case "soldClosed":
      return "Lead & outcomes";

    case "responded":
    case "responseWithin24h":
    case "responseRate":
    case "responseWithin24hRate":
    case "medianResponseMinutes":
      return "Response & follow-up";

    case "templateUses":
    case "templateUsesPerLead":
    case "emailSends":
    case "trackedEmailSends":
    case "emailsOpened":
    case "emailOpens":
    case "emailOpenRate":
    case "emailTrackingCoverage":
      return "Email & templates";

    case "timelineCovered":
      return "Data coverage";
  }
}

function Field({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">
        {label}
      </span>
      <span className="mt-1 block text-xs leading-5 text-slate-500">
        {description}
      </span>
      <span className="mt-2 block">
        {children}
      </span>
    </label>
  );
}

function EvidenceSelect({
  name,
  label,
  value,
  onChange,
  options,
}: {
  name: string;
  label: string;
  value:
    | "any"
    | "observed"
    | "not_observed"
    | "yes"
    | "no";
  onChange: (
    value:
      | "any"
      | "observed"
      | "not_observed"
      | "yes"
      | "no",
  ) => void;
  options: Array<
    [
      "any" | "observed" | "not_observed" | "yes" | "no",
      string,
    ]
  >;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">
        {label}
      </span>

      <select
        name={name}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value as
              | "any"
              | "observed"
              | "not_observed"
              | "yes"
              | "no",
          )
        }
        className={inputClass}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option
            key={optionValue}
            value={optionValue}
          >
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterSelect({
  name,
  label,
  options,
  selected,
  onToggle,
}: {
  name: string;
  label: string;
  options: string[];
  selected: string[];
  onToggle: (
    value: string,
    checked: boolean,
  ) => void;
}) {
  return (
    <details className="group rounded-xl border border-slate-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3">
        <span>
          <span className="block text-sm font-semibold">
            {label}
          </span>
          <span className="mt-1 block text-xs text-slate-500">
            {selected.length === 0
              ? "All values"
              : `${selected.length} selected`}
          </span>
        </span>

        <span className="text-slate-400 transition group-open:rotate-180">
          ↓
        </span>
      </summary>

      <div className="border-t border-slate-200 p-4">
        {options.length > 0 ? (
          <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
            {options.map((option) => (
              <label
                key={option}
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  name={name}
                  value={option}
                  checked={selected.includes(
                    option,
                  )}
                  onChange={(event) =>
                    onToggle(
                      option,
                      event.target.checked,
                    )
                  }
                />

                <span className="min-w-0 truncate">
                  {option}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No values are available in the current
            dataset.
          </p>
        )}
      </div>
    </details>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200";
