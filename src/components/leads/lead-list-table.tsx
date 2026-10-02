// src/components/leads/lead-list-table.tsx

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { LeadListItem } from "@/integrations/tekion/lead/supabase-lead-repository";

type LeadListTableProps = {
  leads: LeadListItem[];
};

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function displayName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length <= 2) {
    return parts.join(" ");
  }

  return `${parts[0]} ${parts[parts.length - 1]}`;
}

export function LeadListTable({ leads }: LeadListTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [stage, setStage] = useState("all");
  const [sourceGroup, setSourceGroup] = useState("all");

  const statuses = useMemo(
    () =>
      [...new Set(leads.map((lead) => lead.status).filter(Boolean))].sort(),
    [leads],
  );

  const stages = useMemo(
    () =>
      [...new Set(leads.map((lead) => lead.stage).filter(Boolean))].sort(),
    [leads],
  );

  const sourceGroups = useMemo(
    () =>
      [
        ...new Set(
          leads.map((lead) => lead.lead_source_group).filter(Boolean),
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

      return (
        matchesSearch &&
        (status === "all" || lead.status === status) &&
        (stage === "all" || lead.stage === stage) &&
        (sourceGroup === "all" ||
          lead.lead_source_group === sourceGroup)
      );
    });
  }, [leads, search, status, stage, sourceGroup]);

  return (
    <div>
      <div className="border-b border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_180px_200px]">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or lead ID"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
          />

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
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
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
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
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All lead sources</option>

            {sourceGroups.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[minmax(260px,1.6fr)_140px_180px_190px_190px_70px] border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Lead</span>
            <span>Status</span>
            <span>Created</span>
            <span>Last engaged</span>
            <span>Last contacted</span>
            <span />
          </div>

          {filteredLeads.length === 0 ? (
            <div className="px-4 py-10 text-sm text-slate-500">
              No leads match the current filters.
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="grid grid-cols-[minmax(260px,1.6fr)_140px_180px_190px_190px_70px] items-center border-b border-slate-100 px-4 py-4 text-sm last:border-b-0 hover:bg-slate-50"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-900">
                    {displayName(lead.contact_name) || "Unnamed lead"}
                  </span>

                  <span className="mt-0.5 block truncate text-xs text-slate-400">
                    {lead.external_record_id}
                  </span>
                </span>

                <span className="text-slate-500">
                  {lead.status || "—"}
                </span>

                <span className="text-slate-500">
                  {formatDate(lead.creation_time)}
                </span>

                <span className="text-slate-500">
                  {formatDate(lead.last_engaged_at)}
                </span>

                <span className="text-slate-500">
                  {formatDate(lead.last_contacted_at)}
                </span>

                <span className="text-right font-medium">→</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}