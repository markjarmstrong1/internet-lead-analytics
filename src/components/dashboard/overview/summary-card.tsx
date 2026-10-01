type SummaryCardProps = {
  label: string;
  value: string;
  detail?: string;
};

export function SummaryCard({
  label,
  value,
  detail,
}: SummaryCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>

      {detail ? (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {detail}
        </p>
      ) : null}
    </article>
  );
}
