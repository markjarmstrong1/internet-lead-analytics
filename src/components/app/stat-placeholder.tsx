type StatPlaceholderProps = {
  label: string;
  value?: string;
  detail?: string;
};

export function StatPlaceholder({
  label,
  value = "—",
  detail = "Data will populate here.",
}: StatPlaceholderProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>

      <p className="mt-3 text-3xl font-semibold tracking-tight">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-400">{detail}</p>
    </article>
  );
}
