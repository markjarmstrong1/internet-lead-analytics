import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";
import { LeadsNavigation } from "@/components/leads/leads-navigation";

const placeholderLeads = [
  "Lead placeholder 01",
  "Lead placeholder 02",
  "Lead placeholder 03",
  "Lead placeholder 04",
  "Lead placeholder 05",
];

export function LeadListPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-8 lg:px-8">
      <PageHeader
        eyebrow="Lead management"
        title="Leads"
        description="Find, filter, group, and open individual internet leads."
      />

      <LeadsNavigation active="list" />

      <SectionPanel
        title="Filters"
        description="Filters apply to the lead list only."
      >
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
          <input
            placeholder="Search leads..."
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />

          {[
            "Status",
            "Lead age",
            "Last activity",
            "Lead source",
            "Salesperson",
            "Date range",
            "More filters",
          ].map((filter) => (
            <button
              key={filter}
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-left text-sm text-slate-600 hover:border-slate-400"
            >
              {filter}
            </button>
          ))}
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
  );
}
