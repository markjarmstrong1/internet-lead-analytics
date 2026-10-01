import type { TimelineImportExecutionResult } from "@/integrations/import/execute-timeline-import-sync";

type ImportCommitResultProps = {
  result: TimelineImportExecutionResult;
};

export function ImportCommitResult({
  result,
}: ImportCommitResultProps) {
  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">
          Import committed
        </p>

        <h2 className="mt-2 text-xl font-semibold text-emerald-950">
          Canonical timeline data is synchronized
        </h2>

        <p className="mt-2 text-sm leading-6 text-emerald-800">
          The import was reconciled against the existing canonical timeline
          data and the required record and event changes were persisted.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <CommitSummary
          label="Timeline records"
          summary={result.records}
        />

        <CommitSummary
          label="Timeline events"
          summary={result.events}
        />
      </div>
    </section>
  );
}

function CommitSummary({
  label,
  summary,
}: {
  label: string;
  summary: {
    total: number;
    newCount: number;
    updatedCount: number;
    unchangedCount: number;
    invalidCount: number;
  };
}) {
  return (
    <article className="rounded-lg border border-emerald-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-slate-950">
        {summary.total.toLocaleString()}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <SummaryValue
          label="New"
          value={summary.newCount}
        />

        <SummaryValue
          label="Updated"
          value={summary.updatedCount}
        />

        <SummaryValue
          label="Unchanged"
          value={summary.unchangedCount}
        />

        <SummaryValue
          label="Invalid"
          value={summary.invalidCount}
        />
      </dl>
    </article>
  );
}

function SummaryValue({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">
        {value.toLocaleString()}
      </dd>
    </div>
  );
}
