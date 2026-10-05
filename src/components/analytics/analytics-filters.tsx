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

export function AnalyticsFilters({
  filters,
  options,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-slate-950">
          Analysis population
        </h2>
        <p className="text-xs leading-5 text-slate-500">
          Every metric below is calculated from this population. Change
          the population before interpreting differences.
        </p>
      </div>

      <form method="get" className="mt-5 space-y-5">
        <div className="grid gap-4 lg:grid-cols-3">
          <Field label="Date basis">
            <select
              name="dateBasis"
              defaultValue={filters.dateBasis}
              className={inputClass}
            >
              {ANALYTICS_DATE_BASES.map((basis) => (
                <option key={basis.key} value={basis.key}>
                  {basis.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Start date">
            <input
              type="date"
              name="start"
              defaultValue={filters.start ?? ""}
              className={inputClass}
            />
          </Field>

          <Field label="End date">
            <input
              type="date"
              name="end"
              defaultValue={filters.end ?? ""}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FilterGroup
            name="source"
            label="Source"
            values={options.sources}
            selected={filters.sources}
          />
          <FilterGroup
            name="sourceGroup"
            label="Source group"
            values={options.sourceGroups}
            selected={filters.sourceGroups}
          />
          <FilterGroup
            name="stage"
            label="Stage"
            values={options.stages}
            selected={filters.stages}
          />
          <FilterGroup
            name="status"
            label="Status"
            values={options.statuses}
            selected={filters.statuses}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <button
            type="submit"
            className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Apply population
          </button>
          <a
            href="/analytics"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Reset
          </a>
        </div>
      </form>
    </section>
  );
}

function FilterGroup({
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
    <details className="group rounded-xl border border-slate-200">
      <summary className="cursor-pointer list-none px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">{label}</span>
          <span className="text-xs text-slate-400">
            {selected.length ? `${selected.length} selected` : "All"}
          </span>
        </div>
      </summary>

      <div className="max-h-56 overflow-y-auto border-t border-slate-100 p-3">
        {values.map((value) => (
          <label
            key={value}
            className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
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
    </details>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200";
