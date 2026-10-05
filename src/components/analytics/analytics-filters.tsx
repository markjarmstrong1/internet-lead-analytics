import type { ReactNode } from "react";

import {
  ANALYTICS_DATE_BASES,
  type AnalyticsFilters,
} from "@/analytics/filters/analytics-filters";

type Props = {
  filters: AnalyticsFilters;
  options: {
    sources: string[];
    sourceGroups: string[];
    stages: string[];
    statuses: string[];
  };
};

export function AnalyticsFilters({ filters, options }: Props) {
  const activeCount =
    filters.sources.length +
    filters.sourceGroups.length +
    filters.stages.length +
    filters.statuses.length;

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <form method="get" className="flex flex-wrap items-end gap-3 p-3">
        <Field label="Date basis">
          <select
            name="dateBasis"
            defaultValue={filters.dateBasis}
            className={`${controlClass} min-w-[150px]`}
          >
            {ANALYTICS_DATE_BASES.map((basis) => (
              <option key={basis.key} value={basis.key}>
                {basis.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="From">
          <input
            type="date"
            name="start"
            defaultValue={filters.start ?? ""}
            className={controlClass}
          />
        </Field>

        <Field label="To">
          <input
            type="date"
            name="end"
            defaultValue={filters.end ?? ""}
            className={controlClass}
          />
        </Field>

        <FilterMenu
          name="source"
          label="Source"
          values={options.sources}
          selected={filters.sources}
        />

        <FilterMenu
          name="sourceGroup"
          label="Source group"
          values={options.sourceGroups}
          selected={filters.sourceGroups}
        />

        <FilterMenu
          name="stage"
          label="Stage"
          values={options.stages}
          selected={filters.stages}
        />

        <FilterMenu
          name="status"
          label="Status"
          values={options.statuses}
          selected={filters.statuses}
        />

        <button
          type="submit"
          className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Apply
        </button>

        <a
          href="/analytics"
          className="h-10 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Reset
        </a>

        <div className="ml-auto flex h-10 items-center text-xs text-slate-500">
          {activeCount > 0
            ? `${activeCount} filters active`
            : "All leads"}
        </div>
      </form>

      <div className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-400">
        {
          ANALYTICS_DATE_BASES.find(
            (basis) => basis.key === filters.dateBasis,
          )?.description
        }
      </div>
    </section>
  );
}

function FilterMenu({
  name,
  label,
  values,
  selected,
}: {
  name: string;
  label: string;
  values: string[];
  selected: string[];
}) {
  return (
    <details className="relative">
      <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-600">
        {label}

        {selected.length > 0 ? (
          <span className="rounded-full bg-slate-950 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {selected.length}
          </span>
        ) : null}

        <span className="text-slate-400">⌄</span>
      </summary>

      <div className="absolute left-0 top-11 z-30 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
        <div className="max-h-64 overflow-y-auto">
          {values.map((value) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
            >
              <input
                type="checkbox"
                name={name}
                value={value}
                defaultChecked={selected.includes(value)}
              />
              <span className="truncate">{value}</span>
            </label>
          ))}
        </div>
      </div>
    </details>
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
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

const controlClass =
  "h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500";
