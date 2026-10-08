import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";
import { LeadsNavigation } from "@/components/leads/leads-navigation";
import { listLeads } from "@/integrations/tekion/lead/supabase-lead-repository";

type CountItem = {
  value: string;
  count: number;
};

function countBy(
  values: string[],
): CountItem[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    const normalized = value.trim() || "Unknown";
    counts.set(
      normalized,
      (counts.get(normalized) ?? 0) + 1,
    );
  }

  return [...counts.entries()]
    .map(([value, count]) => ({
      value,
      count,
    }))
    .sort(
      (left, right) =>
        right.count - left.count ||
        left.value.localeCompare(right.value),
    );
}

function filterUrl(
  field: "status" | "stage",
  value: string,
): string {
  return `/leads/list?${field}=${encodeURIComponent(value)}`;
}

function statusTone(value: string): string {
  const normalized = value.toLowerCase();

  if (
    normalized.includes("sold") ||
    normalized.includes("closed") ||
    normalized.includes("active")
  ) {
    return "border-[var(--success)]/25 bg-[var(--success-soft)] text-[var(--success)]";
  }

  if (
    normalized.includes("lost") ||
    normalized.includes("dead") ||
    normalized.includes("inactive")
  ) {
    return "border-[var(--danger)]/25 bg-[var(--danger-soft)] text-[var(--danger)]";
  }

  return "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted-strong)]";
}

export async function LeadStatusPage() {
  const leads = await listLeads();

  const statuses = countBy(
    leads.map((lead) => lead.status),
  );

  const stages = countBy(
    leads.map((lead) => lead.stage),
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-8 lg:px-8">
      <PageHeader
        eyebrow="Lead management"
        title="Lead status"
        description="See where the current lead population sits by CRM status and stage."
      />

      <LeadsNavigation active="status" />

      <SectionPanel
        title="Current status"
        description={`${leads.length} canonical lead${
          leads.length === 1 ? "" : "s"
        } grouped by their current CRM status.`}
      >
        {statuses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center">
            <p className="text-sm font-medium">
              No lead status data available
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {statuses.map((item) => (
              <Link
                key={item.value}
                href={filterUrl("status", item.value)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow"
              >
                <span
                  className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusTone(
                    item.value,
                  )}`}
                >
                  {item.value}
                </span>

                <p className="mt-5 text-3xl font-semibold tabular-nums">
                  {item.count}
                </p>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  {item.count === 1 ? "lead" : "leads"}
                </p>

                <p className="mt-4 text-xs font-medium text-[var(--muted-strong)]">
                  View these leads →
                </p>
              </Link>
            ))}
          </div>
        )}
      </SectionPanel>

      <SectionPanel
        title="Current stage"
        description="The current CRM stage distribution. Stage is separate from CRM status and should not be treated as an inferred journey."
      >
        {stages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center">
            <p className="text-sm font-medium">
              No lead stage data available
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--border)]">
            <div className="grid grid-cols-[minmax(220px,1fr)_120px_140px] border-b bg-[var(--surface-muted)] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              <span>Stage</span>
              <span>Leads</span>
              <span>Share</span>
            </div>

            {stages.map((item) => {
              const share =
                leads.length === 0
                  ? 0
                  : (item.count / leads.length) * 100;

              return (
                <Link
                  key={item.value}
                  href={filterUrl("stage", item.value)}
                  className="grid grid-cols-[minmax(220px,1fr)_120px_140px] items-center border-b px-5 py-4 text-sm last:border-b-0 hover:bg-[var(--accent-soft)]"
                >
                  <span className="font-medium">
                    {item.value}
                  </span>

                  <span className="tabular-nums text-[var(--muted-strong)]">
                    {item.count}
                  </span>

                  <span className="text-xs tabular-nums text-[var(--muted)]">
                    {share.toFixed(1)}%
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </SectionPanel>

      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--muted)]">
        Status and stage are displayed as recorded by the CRM. We are
        intentionally not reconstructing a lead journey from assumptions
        about what one status or stage means.
      </div>
    </div>
  );
}
