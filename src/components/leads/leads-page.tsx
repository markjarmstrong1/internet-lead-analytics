"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";

const tabs = ["List", "Status"] as const;

const placeholderLeads = [
  "Lead placeholder 01",
  "Lead placeholder 02",
  "Lead placeholder 03",
  "Lead placeholder 04",
  "Lead placeholder 05",
];

const statusGroups = [
  "New",
  "Attempted contact",
  "In conversation",
  "Appointment scheduled",
  "Shown",
  "Sale",
];

export function LeadsPage() {
  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number]>("List");

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-8 lg:px-8">
      <PageHeader
        eyebrow="Lead management"
        title="Leads"
        description="Find, filter, group, and open individual internet leads."
      />

      <SectionPanel
        title="Lead discovery"
        description="Search and filtering controls will live here."
      >
        <div className="grid gap-3 md:grid-cols-4">
          <input
            placeholder="Search leads..."
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-left text-sm text-slate-600"
          >
            Status
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-left text-sm text-slate-600"
          >
            Source
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-left text-sm text-slate-600"
          >
            More filters
          </button>
        </div>
      </SectionPanel>

      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={[
              "px-4 py-3 text-sm font-medium",
              activeTab === tab
                ? "border-b-2 border-slate-950 text-slate-950"
                : "text-slate-500",
            ].join(" ")}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "List" ? (
        <SectionPanel
          title="All leads"
          description="The complete lead population will appear here."
        >
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Lead</span>
              <span>Status</span>
              <span>Source</span>
              <span>Last activity</span>
              <span>Vehicle</span>
              <span />
            </div>

            {placeholderLeads.map((lead, index) => (
              <Link
                key={lead}
                href={`/leads/placeholder-${index + 1}`}
                className="grid grid-cols-6 border-b border-slate-100 px-4 py-4 text-sm last:border-b-0 hover:bg-slate-50"
              >
                <span>{lead}</span>
                <span className="text-slate-500">Placeholder</span>
                <span className="text-slate-500">Source</span>
                <span className="text-slate-500">—</span>
                <span className="text-slate-500">—</span>
                <span className="text-right font-medium">Open →</span>
              </Link>
            ))}
          </div>
        </SectionPanel>
      ) : (
        <SectionPanel
          title="Lead status"
          description="A visual map of the lead population by current process phase."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {statusGroups.map((status) => (
              <button
                key={status}
                type="button"
                className="rounded-xl border border-slate-200 p-5 text-left hover:border-slate-400"
              >
                <p className="text-sm font-medium text-slate-500">
                  {status}
                </p>
                <p className="mt-3 text-3xl font-semibold">—</p>
                <p className="mt-2 text-xs text-slate-400">
                  Select to expand this group.
                </p>
              </button>
            ))}
          </div>
        </SectionPanel>
      )}
    </div>
  );
}
