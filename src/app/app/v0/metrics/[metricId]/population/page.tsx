import Link from "next/link";
import { notFound } from "next/navigation";
import { getMetricDefinition } from "@/features/analytics/metrics/metric-definition";
import {
  getMetricPopulation,
  type MetricBreakdownDimension,
} from "@/features/analytics/metrics/get-metric-population";

export const dynamic = "force-dynamic";

export default async function MetricPopulationPage({
  params,
  searchParams,
}: {
  params: Promise<{ metricId: string }>;
  searchParams: Promise<{
    page?: string;
    search?: string;
    dimension?: string;
    group?: string;
  }>;
}) {
  const { metricId } = await params;
  const query = await searchParams;
  const definition = getMetricDefinition(metricId);
  if (!definition) notFound();

  const page = Math.max(1, Number(query.page) || 1);
  const search = query.search?.trim() || "";
  const dimension = query.dimension || "";
  const group = query.group || "";

  const validDimensions: MetricBreakdownDimension[] = [
    "source",
    "channel",
    "template",
  ];
  const breakdownDimension = validDimensions.includes(
    dimension as MetricBreakdownDimension,
  )
    ? (dimension as MetricBreakdownDimension)
    : undefined;

  // Do not silently show the full population for an invalid or incomplete
  // breakdown URL.
  if ((dimension || group) && (!breakdownDimension || !group.trim())) {
    notFound();
  }

  const result = await getMetricPopulation(metricId, {
    page,
    pageSize: 25,
    search,
    breakdown:
      breakdownDimension && group
        ? { dimension: breakdownDimension, value: group }
        : undefined,
  });
  if (!result) notFound();

  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const pageUrl = (nextPage: number) => {
    const q = new URLSearchParams();
    q.set("page", String(nextPage));
    if (search) q.set("search", search);
    if (breakdownDimension && group) {
      q.set("dimension", breakdownDimension);
      q.set("group", group);
    }
    return `/app/v0/metrics/${metricId}/population?${q.toString()}`;
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <nav className="text-sm text-[var(--muted)]">
        <Link href={`/app/v0/metrics/${metricId}`} className="underline">
          {definition.label}
        </Link>
        {" / Qualifying population"}
      </nav>
      <header className="border-b border-[var(--border)] pb-5">
        <h1 className="text-2xl font-semibold">Qualifying lead population</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {result.total} matching leads · Page {result.page} of {pages}
        </p>
      </header>

      <form className="flex flex-wrap gap-2" method="get">
        {breakdownDimension && group && (
          <>
            <input type="hidden" name="dimension" value={breakdownDimension} />
            <input type="hidden" name="group" value={group} />
          </>
        )}
        <input
          name="search"
          defaultValue={search}
          placeholder="Search name, source, stage, status…"
          className="min-w-64 border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
        />
        <button className="border border-[var(--border)] px-4 py-2 text-sm" type="submit">
          Search
        </button>
      </form>

      {!result.rows.length ? (
        <p className="border border-[var(--border)] p-5 text-sm text-[var(--muted)]">
          No qualifying leads match this search. This does not mean the leads had no activity.
        </p>
      ) : (
        <div className="overflow-x-auto border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead className="text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Outcome evidence</th>
                <th className="px-4 py-3 font-medium">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.leadId} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/app/v0/leads/${encodeURIComponent(row.leadId)}?metric=${encodeURIComponent(metricId)}`}
                      className="underline"
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.source}</td>
                  <td className="px-4 py-3">{row.stage}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">{row.outcome}</td>
                  <td className="px-4 py-3">
                    {row.lastActivity ? new Date(row.lastActivity).toLocaleString() : "Unknown"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <footer className="flex items-center justify-between text-sm">
        <span className="text-[var(--muted)]">
          Showing {result.rows.length} of {result.total} matching leads
        </span>
        <div className="flex gap-3">
          {page > 1 && <Link className="underline" href={pageUrl(page - 1)}>← Previous</Link>}
          {page < pages && <Link className="underline" href={pageUrl(page + 1)}>Next →</Link>}
        </div>
      </footer>
    </main>
  );
}
