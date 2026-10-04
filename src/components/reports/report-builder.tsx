import Link from "next/link";

import {
  REPORT_DATE_BASES,
  REPORT_DIMENSIONS,
  REPORT_METRICS,
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

export function ReportBuilder({
  definition,
  savedReport,
  options,
}: ReportBuilderProps) {
  return (
    <div className="space-y-6">
      <form
        method="get"
        className="space-y-6"
      >
        <div className="grid gap-5 lg:grid-cols-3">
          <Field
            label="Report name"
            description="The name used when this report is saved."
          >
            <input
              name="name"
              defaultValue={definition.name}
              maxLength={120}
              className={inputClass}
            />
          </Field>

          <Field
            label="Date basis"
            description="Determines which date controls the report population."
          >
            <select
              name="dateBasis"
              defaultValue={
                definition.dateRange.basis
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
          </Field>

          <Field
            label="Group rows by"
            description="Choose how the generated report is broken into rows."
          >
            <select
              name="groupBy"
              defaultValue={
                definition.groupBy
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
            description="Leave blank to include the beginning of the available population."
          >
            <input
              type="date"
              name="start"
              defaultValue={
                definition.dateRange.start ??
                ""
              }
              className={inputClass}
            />
          </Field>

          <Field
            label="End date"
            description="The selected end date is inclusive."
          >
            <input
              type="date"
              name="end"
              defaultValue={
                definition.dateRange.end ??
                ""
              }
              className={inputClass}
            />
          </Field>
        </div>

        <FilterSelect
          name="source"
          label="Lead sources"
          options={options.sources}
          selected={
            definition.filters.sources
          }
        />

        <div className="grid gap-5 md:grid-cols-3">
          <FilterSelect
            name="sourceGroup"
            label="Source groups"
            options={options.sourceGroups}
            selected={
              definition.filters
                .sourceGroups
            }
          />

          <FilterSelect
            name="stage"
            label="Stages"
            options={options.stages}
            selected={
              definition.filters.stages
            }
          />

          <FilterSelect
            name="status"
            label="Statuses"
            options={options.statuses}
            selected={
              definition.filters.statuses
            }
          />
        </div>

        <div>
          <div className="mb-3">
            <p className="text-sm font-semibold">
              Metrics
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Select the measures that should appear
              in the generated report.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {REPORT_METRICS.map(
              (metric) => {
                const selected =
                  definition.metrics.includes(
                    metric.key,
                  );

                return (
                  <label
                    key={metric.key}
                    className={[
                      "flex cursor-pointer gap-3 rounded-lg border p-3",
                      selected
                        ? "border-slate-950 bg-slate-50"
                        : "border-slate-200 bg-white",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      name="metric"
                      value={metric.key}
                      defaultChecked={
                        selected
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
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Generate report
          </button>

          <Link
            href="/reports"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Start over
          </Link>
        </div>
      </form>

      <form
        action={saveReportAction}
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
      >
        <div>
          <p className="text-sm font-semibold">
            {savedReport
              ? "Saved report"
              : "Save this report"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Save the current configuration so it can
            be reopened later.
          </p>
        </div>

        <input
          type="hidden"
          name="definition"
          value={JSON.stringify(
            definition,
          )}
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
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100"
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

function FilterSelect({
  name,
  label,
  options,
  selected,
}: {
  name: string;
  label: string;
  options: string[];
  selected: string[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">
        {label}
      </span>
      <span className="mt-1 block text-xs text-slate-500">
        Leave empty to include every value.
      </span>

      <select
        name={name}
        multiple
        defaultValue={selected}
        className="mt-2 min-h-32 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500";
