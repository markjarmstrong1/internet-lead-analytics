// src/components/leads/lead-list-table.tsx

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { LeadListItem } from "@/integrations/tekion/lead/supabase-lead-repository";

type LeadEvidenceState =
  | "observed"
  | "not_observed"
  | "unknown"
  | "insufficient_evidence"
  | "unresolved";

type LeadPopulationEvidence = {
  outbound: LeadEvidenceState;
  response: LeadEvidenceState;
  appointment: LeadEvidenceState;
  outcome: LeadEvidenceState;
};

type LeadListTableProps = {
  leads: LeadListItem[];
  populationEvidence?: Record<
    string,
    LeadPopulationEvidence
  >;
  initialStatus?: string;
  initialStage?: string;
  initialSourceGroup?: string;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function displayName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length <= 2) {
    return parts.join(" ");
  }

  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function evidenceLabel(
  state: LeadEvidenceState | undefined,
): string {
  switch (state) {
    case "observed":
      return "Observed";
    case "not_observed":
      return "Not observed";
    case "insufficient_evidence":
    case "unknown":
    case "unresolved":
      return "Insufficient evidence";
    default:
      return "Unknown";
  }
}

function evidenceTone(
  state: LeadEvidenceState | undefined,
): string {
  switch (state) {
    case "observed":
      return "border-[var(--success)]/25 bg-[var(--success-soft)] text-[var(--success)]";
    case "not_observed":
      return "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted-strong)]";
    default:
      return "border-[var(--border)] bg-white text-[var(--muted)]";
  }
}

function EvidenceBadge({
  label,
  state,
}: {
  label: string;
  state: LeadEvidenceState | undefined;
}) {
  return (
    <span
      title={`${label}: ${evidenceLabel(state)}`}
      className={`inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${evidenceTone(
        state,
      )}`}
    >
      {label}
    </span>
  );
}

function statusTone(value: string | null) {
  const normalized = value?.toLowerCase() ?? "";

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

export function LeadListTable({
  leads,
  populationEvidence = {},
  initialStatus = "all",
  initialStage = "all",
  initialSourceGroup = "all",
}: LeadListTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [stage, setStage] = useState(initialStage);
  const [sourceGroup, setSourceGroup] = useState(initialSourceGroup);

  const statuses = useMemo(
    () =>
      [...new Set(
        leads.map((lead) => lead.status?.trim() || "Unknown"),
      )].sort(),
    [leads],
  );

  const stages = useMemo(
    () =>
      [...new Set(
        leads.map((lead) => lead.stage?.trim() || "Unknown"),
      )].sort(),
    [leads],
  );

  const sourceGroups = useMemo(
    () =>
      [
        ...new Set(
          leads.map(
            (lead) =>
              lead.lead_source_group?.trim() || "Unknown",
          ),
        ),
      ].sort(),
    [leads],
  );

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesSearch =
        !query ||
        displayName(lead.contact_name).toLowerCase().includes(query) ||
        lead.contact_name.toLowerCase().includes(query) ||
        lead.external_record_id.toLowerCase().includes(query);

      const leadStatus = lead.status?.trim() || "Unknown";
      const leadStage = lead.stage?.trim() || "Unknown";
      const leadSourceGroup =
        lead.lead_source_group?.trim() || "Unknown";

      return (
        matchesSearch &&
        (status === "all" || leadStatus === status) &&
        (stage === "all" || leadStage === stage) &&
        (sourceGroup === "all" ||
          leadSourceGroup === sourceGroup)
      );
    });
  }, [leads, search, status, stage, sourceGroup]);

  const hasFilters =
    search.trim().length > 0 ||
    status !== "all" ||
    stage !== "all" ||
    sourceGroup !== "all";

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setStage("all");
    setSourceGroup("all");
  }

  return (
    <div>
      <div className="border-b bg-[var(--surface-muted)] p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_170px_170px_190px_auto]">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or lead ID"
            className="rounded-[8px] border bg-white px-3 py-2 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          />

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-[8px] border bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          >
            <option value="all">All statuses</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            value={stage}
            onChange={(event) => setStage(event.target.value)}
            className="rounded-[8px] border bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          >
            <option value="all">All stages</option>
            {stages.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            value={sourceGroup}
            onChange={(event) => setSourceGroup(event.target.value)}
            className="rounded-[8px] border bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          >
            <option value="all">All lead sources</option>
            {sourceGroups.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-[8px] border bg-white px-3 py-2 text-sm font-medium text-[var(--muted-strong)] hover:border-[var(--accent)] hover:text-[var(--foreground)]"
            >
              Clear
            </button>
          ) : (
            <div />
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-4 text-xs text-[var(--muted)]">
          <span>
            Showing{" "}
            <span className="font-semibold text-[var(--foreground)]">
              {filteredLeads.length}
            </span>{" "}
            of {leads.length} leads
          </span>

          {hasFilters ? (
            <span>Filters active</span>
          ) : (
            <span>All leads</span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[880px]">
          <div className="grid grid-cols-[minmax(280px,1.55fr)_120px_120px_135px_135px_minmax(300px,1.5fr)] border-b bg-white px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            <span>Lead</span>
            <span>Status</span>
            <span>Stage</span>
            <span>Created</span>
            <span>Last activity</span>
            <span>Evidence</span>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm font-medium">No leads found</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Try changing the search or filters.
              </p>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="grid grid-cols-[minmax(280px,1.55fr)_120px_120px_135px_135px_minmax(300px,1.5fr)] items-center border-b px-5 py-3.5 text-sm transition last:border-b-0 hover:bg-[var(--accent-soft)]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-[var(--foreground)]">
                    {displayName(lead.contact_name) || "Unnamed lead"}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">
                    {lead.external_record_id}
                    {lead.lead_source_group
                      ? ` · ${lead.lead_source_group}`
                      : ""}
                  </span>
                </span>

                <span>
                  <span
                    className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusTone(
                      lead.status,
                    )}`}
                  >
                    {lead.status || "Unknown"}
                  </span>
                </span>

                <span className="text-xs text-[var(--muted-strong)]">
                  {lead.stage || "—"}
                </span>

                <span className="text-xs tabular-nums text-[var(--muted)]">
                  {formatDate(lead.creation_time)}
                </span>

                <span className="text-xs tabular-nums text-[var(--muted)]">
                  {formatDateTime(
                    lead.last_engaged_at ?? lead.last_contacted_at,
                  )}
                </span>

                <span className="flex flex-wrap gap-1.5">
                  <EvidenceBadge
                    label="Outbound"
                    state={
                      populationEvidence[lead.id]?.outbound
                    }
                  />
                  <EvidenceBadge
                    label="Response"
                    state={
                      populationEvidence[lead.id]?.response
                    }
                  />
                  <EvidenceBadge
                    label="Appt"
                    state={
                      populationEvidence[lead.id]?.appointment
                    }
                  />
                  <EvidenceBadge
                    label="Outcome"
                    state={
                      populationEvidence[lead.id]?.outcome
                    }
                  />
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
