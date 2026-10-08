"use client";

import Link from "next/link";
import { useState } from "react";

import {
  REPORT_DATE_BASES,
  REPORT_DIMENSIONS,
  REPORT_MEASURES,
} from "@/reports/report-catalog";
import { saveReportAction } from "@/reports/actions";
import type {
  ReportDefinition,
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

  return (
    <div className="space-y-6">
      <form
        method="get"
        className="space-y-6"
      >
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

        <div>
          <div className="mb-3">
            <p className="text-sm font-semibold">
              Measures
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Select the measures that should appear in the generated
              report. Each measure carries an explicit population,
              evidence requirement, and denominator definition.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {REPORT_MEASURES.map(
              (metric) => {
                const selected =
                  draft.metrics.includes(
                    metric.key,
                  );

                return (
                  <label
                    key={metric.key}
                    className={[
                      "flex cursor-pointer gap-3 rounded-xl border p-4 transition",
                      selected
                        ? "border-slate-950 bg-slate-50"
                        : "border-slate-200 bg-white hover:border-slate-400",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      name="metric"
                      value={metric.key}
                      checked={selected}
                      onChange={(event) =>
                        toggleMetric(
                          metric.key,
                          event.target.checked,
                        )
                      }
                      className="mt-1"
                    />

                    <span>
                      <span className="block text-sm font-medium">
                        {metric.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        {metric.description}
                      </span>
                    </span>
                  </label>
                );
              },
            )}
          </div>
        </div>

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
