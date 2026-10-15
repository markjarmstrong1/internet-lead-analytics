import Link from "next/link";
import { notFound } from "next/navigation";
import { getMetricDefinition } from "@/features/analytics/metrics/metric-definition";
import { getMetricResult } from "@/features/analytics/metrics/get-metric-result";
import { getMetricBreakdown } from "@/features/analytics/metrics/get-metric-breakdown";

export const dynamic = "force-dynamic";

function percent(value: number | null) {
  return value === null ? "Insufficient evidence" : `${(value * 100).toFixed(1)}%`;
}

export default async function MetricDetailPage({
  params,
}: {
  params: Promise<{ metricId: string }>;
}) {
  const { metricId } = await params;
  const definition = getMetricDefinition(metricId);
  if (!definition) notFound();

  const [result, channelRows, sourceRows, templateRows] = await Promise.all([
    getMetricResult(metricId),
    getMetricBreakdown(metricId, "channel"),
    getMetricBreakdown(metricId, "source"),
    getMetricBreakdown(metricId, "template"),
  ]);

  if (!result) notFound();

  const groups = [
    { title: "By channel", dimension: "channel", rows: channelRows },
    { title: "By lead source", dimension: "source", rows: sourceRows },
    { title: "By template", dimension: "template", rows: templateRows },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-6 py-8 text-[var(--foreground)]">
      <nav className="text-sm text-[var(--muted)]">
        <Link href="/app/v0/analytics" className="underline">Analyze</Link>
        {" / "}<span>{definition.label}</span>
      </nav>

      <header className="border-b border-[var(--border)] pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          Metric definition · {definition.evidenceLevel}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{definition.label}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          {definition.description}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="border border-[var(--border)] p-5">
          <p className="text-sm text-[var(--muted)]">Observed response rate</p>
          <p className="mt-2 text-3xl font-semibold">{percent(result.value)}</p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            {result.evidenceState === "available"
              ? "Calculated from the current qualifying population"
              : "No qualifying denominator is available"}
          </p>
        </div>
        <div className="border border-[var(--border)] p-5">
          <p className="text-sm text-[var(--muted)]">{definition.numeratorLabel}</p>
          <p className="mt-2 text-3xl font-semibold">{result.numerator}</p>
        </div>
        <div className="border border-[var(--border)] p-5">
          <p className="text-sm text-[var(--muted)]">{definition.denominatorLabel}</p>
          <p className="mt-2 text-3xl font-semibold">{result.denominator}</p>
        </div>
      </section>

      <section className="border border-[var(--border)] p-5">
        <h2 className="font-semibold">Calculation and population</h2>
        <p className="mt-3 text-sm leading-6">{definition.calculationDefinition}</p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Population: {definition.populationDefinition}
        </p>
        <Link
          href={`/app/v0/metrics/${metricId}/population`}
          className="mt-4 inline-flex border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--surface-muted)]"
        >
          Inspect qualifying leads ({result.denominator}) →
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Breakdown</h2>
        <p className="text-sm text-[var(--muted)]">
          Select a row to inspect its qualifying lead population. Rates describe observed association, not causation.
        </p>

        {groups.map((group) => (
          <div key={group.dimension} className="border border-[var(--border)]">
            <h3 className="border-b border-[var(--border)] px-4 py-3 font-semibold">
              {group.title}
            </h3>
            {!group.rows?.length ? (
              <p className="p-4 text-sm text-[var(--muted)]">
                No breakdown is available from the current evidence.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Group</th>
                      <th className="px-4 py-3 font-medium">Responses</th>
                      <th className="px-4 py-3 font-medium">Qualifying leads</th>
                      <th className="px-4 py-3 font-medium">Rate</th>
                      <th className="px-4 py-3 font-medium">Inspect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row) => (
                      <tr key={row.id} className="border-t border-[var(--border)]">
                        <td className="px-4 py-3 font-medium">{row.label}</td>
                        <td className="px-4 py-3 tabular-nums">{row.numerator}</td>
                        <td className="px-4 py-3 tabular-nums">{row.denominator}</td>
                        <td className="px-4 py-3 tabular-nums">{percent(row.rate)}</td>
                        <td className="px-4 py-3">
                          <Link
                            className="underline"
                            href={`/app/v0/metrics/${metricId}/population?dimension=${group.dimension}&group=${encodeURIComponent(row.label)}`}
                          >
                            View leads →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="border border-[var(--border)] p-5">
        <h2 className="font-semibold">Limitations</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
          {definition.limitations.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>
    </main>
  );
}
