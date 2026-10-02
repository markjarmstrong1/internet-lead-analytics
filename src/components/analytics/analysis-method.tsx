type AnalysisMethodItem = {
  label: string;
  value: string;
};

type AnalysisMethodProps = {
  items: AnalysisMethodItem[];
};

export function AnalysisMethod({
  items,
}: AnalysisMethodProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          How this analysis is defined
        </p>
        <p className="mt-1 text-sm text-slate-500">
          The metric is calculated from these explicit evidence rules.
        </p>
      </div>

      <dl className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {item.label}
            </dt>
            <dd className="mt-1 text-sm font-medium leading-6 text-slate-700">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
