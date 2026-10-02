"use client";

import { useState } from "react";
import Link from "next/link";
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

const statusFlow = [
  "New",
  "Attempted contact",
  "Engaged",
  "In conversation",
  "Constraint",
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
        <div className="space-y-6">
          <SectionPanel
            title="Filters"
            description="Filter the lead population by any supported lead, activity, status, or date dimension."
          >
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
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
                Lead age
              </button>

              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-left text-sm text-slate-600"
              >
                Last activity
              </button>

              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-left text-sm text-slate-600"
              >
                Lead source
              </button>

              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-left text-sm text-slate-600"
              >
                Salesperson
              </button>

              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-left text-sm text-slate-600"
              >
                Date range
              </button>

              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-left text-sm text-slate-600"
              >
                More filters
              </button>
            </div>
          </SectionPanel>

          <SectionPanel
            title="All leads"
            description="The complete lead population will appear here."
          >
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="grid grid-cols-5 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Lead</span>
                <span>Status</span>
                <span>Lead age</span>
                <span>Last activity</span>
                <span />
              </div>

              {placeholderLeads.map((lead, index) => (
                <Link
                  key={lead}
                  href={`/leads/placeholder-${index + 1}`}
                  className="grid grid-cols-5 border-b border-slate-100 px-4 py-4 text-sm last:border-b-0 hover:bg-slate-50"
                >
                  <span>{lead}</span>
                  <span className="text-slate-500">Placeholder</span>
                  <span className="text-slate-500">—</span>
                  <span className="text-slate-500">—</span>
                  <span className="text-right font-medium">Open →</span>
                </Link>
              ))}
            </div>
          </SectionPanel>
        </div>
      ) : (
        <SectionPanel
          title="Lead status flow"
          description="A journey view of where leads are currently sitting in the process."
        >
          <div className="overflow-x-auto pb-4">
            <div className="flex min-w-[1100px] items-center">
              {statusFlow.map((status, index) => (
                <div key={status} className="flex items-center">
                  <button
                    type="button"
                    className="group w-32 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Stage {index + 1}
                    </p>

                    <p className="mt-2 text-sm font-semibold">
                      {status}
                    </p>

                    <p className="mt-4 text-2xl font-semibold">
                      —
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Leads
                    </p>
                  </button>

                  {index < statusFlow.length - 1 ? (
                    <div className="flex w-12 items-center justify-center">
                      <span className="text-xl text-slate-300">→</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            Constraint and appointment states are intentionally represented
            as separate branches in the eventual flow model. The actual
            transitions will be driven by available evidence rather than
            assumed from placeholder data.
          </div>
        </SectionPanel>
      )}
    </div>
  );
}
