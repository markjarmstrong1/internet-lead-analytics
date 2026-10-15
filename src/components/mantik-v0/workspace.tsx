"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DashboardMetrics } from "@/components/dashboard/dashboard-repository";

type Lead = {
  id: string;
  name: string;
  externalId: string;
  source: string;
  sourceGroup: string;
  status: string;
  stage: string;
  createdAt: string | null;
  lastContactedAt: string | null;
  lastEngagedAt: string | null;
  vehicle: string;
  dealStatus: string;
};

type Event = {
  id: string;
  occurredAt: string;
  type: string;
  category: string;
  actor: string;
  actorType: string;
  channel: string;
  direction: string;
  details: string;
  sourceFile: string;
  sourceEventId: string;
  templateCode: string;
  rawData: Record<string, unknown>;
  metadata: Record<string, unknown>;
};

type Detail = {
  lead: {
    id: string;
    name: string;
    externalId: string;
    source: string;
    sourceGroup: string;
    status: string;
    stage: string;
    createdAt: string | null;
    vehicle: string;
    dealStatus: string;
    soldDate: string | null;
  };
  events: Event[];
};

type Props = {
  view: string;
  leadId: string | null;
  leads: Lead[];
  metrics: DashboardMetrics;
  leadDetail: Detail | null;
  timelineLeadIds: string[];
};

const navigation = [
  {
    label: "Overview",
    href: "/app/v0",
    group: "WORKFLOWS",
    icon: "◫",
    description: "Understand performance and management priorities",
  },
  {
    label: "Analyze",
    href: "/app/v0/analytics",
    group: "WORKFLOWS",
    icon: "⌁",
    description: "Compare populations and investigate outcomes",
  },
  {
    label: "Investigate",
    href: "/app/v0/leads",
    group: "WORKFLOWS",
    icon: "◎",
    description: "Search leads and reconstruct what happened",
  },
  {
    label: "Findings & Reports",
    href: "/app/v0/reports",
    group: "WORKFLOWS",
    icon: "▤",
    description: "Review findings and communicate evidence",
  },
  {
    label: "Exceptions",
    href: "/app/v0/exceptions",
    group: "WORKFLOWS",
    icon: "△",
    description: "Prioritize evidence gaps and unusual outcomes",
  },
  {
    label: "Data & Sources",
    href: "/app/v0/sources",
    group: "DATA & OPERATIONS",
    icon: "⌖",
    description: "Inspect source populations and evidence coverage",
  },
  {
    label: "Methods",
    href: "/app/v0/methods",
    group: "DATA & OPERATIONS",
    icon: "⌘",
    description: "Review templates and analytical methods",
  },
  {
    label: "Imports",
    href: "/app/v0/imports",
    group: "DATA & OPERATIONS",
    icon: "⇧",
    description: "Manage incoming source evidence",
  },
];

const timelineFilters = [
  "All",
  "Communication",
  "Lifecycle",
  "Tasks",
  "Automation",
  "Assignments",
] as const;

type TimelineFilter = (typeof timelineFilters)[number];

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function displayName(value: string) {
  return value.trim() || "Unnamed lead";
}

function sourceName(lead: Lead) {
  return lead.source.trim() ||
    lead.sourceGroup.trim() ||
    "Unknown";
}

function isActivePath(view: string, href: string) {
  if (href === "/app/v0") return view === "dashboard";
  const slug = href.split("/").pop();
  return view === slug || (slug === "leads" && view === "leads");
}

function eventMatchesFilter(event: Event, filter: TimelineFilter) {
  if (filter === "All") return true;
  const value = [
    event.type,
    event.category,
    event.channel,
    event.direction,
    event.actorType,
  ]
    .join(" ")
    .toLowerCase();

  if (filter === "Communication") {
    return /email|text|sms|call|phone|voicemail|communicat|inbound|outbound|response/.test(value);
  }
  if (filter === "Lifecycle") {
    return /appointment|sold|sale|closed|status|stage|deal|vehicle|lead created/.test(value);
  }
  if (filter === "Tasks") return /task|follow.?up|reminder/.test(value);
  if (filter === "Automation") return /autom|workflow|system|bot/.test(value);
  return /assign|owner|salesperson|representative/.test(value);
}

function pageTitle(view: string) {
  const titles: Record<string, string> = {
    dashboard: "Overview",
    leads: "Investigate",
    analytics: "Analyze",
    reports: "Findings & Reports",
    sources: "Data & Sources",
    methods: "Methods",
    exceptions: "Exceptions",
    imports: "Imports",
  };
  return titles[view] || "Investigation";
}

export function MantikV0Workspace({
  view,
  leadId,
  leads,
  metrics,
  leadDetail,
  timelineLeadIds,
}: Props) {
  const [search, setSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [timelineFilter, setTimelineFilter] =
    useState<TimelineFilter>("All");
  const [selectedStage, setSelectedStage] = useState("all");

  const query = search.trim().toLowerCase();
  const searchedLeads = useMemo(
    () =>
      leads.filter((lead) => {
        const matchesSearch =
          !query ||
          [
            lead.name,
            lead.externalId,
            lead.source,
            lead.sourceGroup,
            lead.status,
            lead.stage,
            lead.vehicle,
          ].some((value) => value.toLowerCase().includes(query));
        const matchesStage =
          selectedStage === "all" || lead.stage === selectedStage;
        return matchesSearch && matchesStage;
      }),
    [leads, query, selectedStage],
  );

  const stageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const lead of leads) {
      const stage = lead.stage.trim() || "Unknown stage";
      counts.set(stage, (counts.get(stage) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [leads]);

  const sourceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const lead of leads) {
      const source = sourceName(lead);
      counts.set(source, (counts.get(source) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [leads]);

  const linkedLeadIds = useMemo(
    () => new Set(timelineLeadIds),
    [timelineLeadIds],
  );

  const exceptions = useMemo(
    () => leads.filter((lead) => !linkedLeadIds.has(lead.id)),
    [leads, linkedLeadIds],
  );

  const currentTitle =
    leadDetail && view === "leads"
      ? displayName(leadDetail.lead.name)
      : pageTitle(view);

  const matchingGlobalLeads = useMemo(() => {
    const value = globalSearch.trim().toLowerCase();
    if (value.length < 2) return [];
    return leads
      .filter((lead) =>
        [
          lead.name,
          lead.externalId,
          lead.source,
          lead.sourceGroup,
          lead.vehicle,
          lead.status,
        ].some((field) => field.toLowerCase().includes(value)),
      )
      .slice(0, 6);
  }, [globalSearch, leads]);

  return (
    <div className="mantik-v0" data-mantik-v0="true">
      <aside className="mv0-sidebar">
        <Link href="/app/v0" className="mv0-brand">
          <span className="mv0-brand-mark">M</span>
          <span>
            <strong>MANTIK</strong>
            <small>EVIDENCE INTELLIGENCE</small>
          </span>
        </Link>

        <div className="mv0-workspace-label">WORKSPACE</div>
        <nav aria-label="MANTIK navigation" className="mv0-nav">
          {["WORKFLOWS", "DATA & OPERATIONS"].map((group) => (
            <div key={group}>
              <p className="mv0-nav-group">{group}</p>
              {navigation
                .filter((item) => item.group === group)
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={
                      isActivePath(view, item.href) ? "page" : undefined
                    }
                    className={
                      "mv0-nav-link" +
                      (isActivePath(view, item.href) ? " is-active" : "")
                    }
                  >
                    <span className="mv0-nav-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                ))}
            </div>
          ))}
        </nav>

        <div className="mv0-sidebar-footer">
          <span className="mv0-status-dot" />
          <span>
            <strong>Evidence first</strong>
            <small>Unknown is not zero.</small>
          </span>
        </div>
        <Link href="/" className="mv0-back-link">
          ← Existing application
        </Link>
      </aside>

      <div className="mv0-main">
        <header className="mv0-topbar">
          <div className="mv0-breadcrumb">
            <span>Workspace</span>
            <span aria-hidden="true">/</span>
            <strong>{currentTitle}</strong>
          </div>
          <div className="mv0-global-search">
            <span aria-hidden="true">⌕</span>
            <input
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
              placeholder="Search leads, sources, methods…"
              aria-label="Search leads, sources, and workspace sections"
            />
            <kbd>SEARCH</kbd>
            {globalSearch.trim().length >= 2 && (
              <div className="mv0-search-results">
                <p className="mv0-search-heading">LEADS</p>
                {matchingGlobalLeads.length ? (
                  matchingGlobalLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/app/v0/leads/${lead.id}`}
                      onClick={() => setGlobalSearch("")}
                      className="mv0-search-result"
                    >
                      <span>
                        <strong>{displayName(lead.name)}</strong>
                        <small>{lead.externalId} · {sourceName(lead)}</small>
                      </span>
                      <span aria-hidden="true">↗</span>
                    </Link>
                  ))
                ) : (
                  <p className="mv0-empty-search">
                    No matching lead records.
                  </p>
                )}
                <p className="mv0-search-heading">WORKSPACE</p>
                {navigation
                  .filter((item) =>
                    `${item.label} ${item.description}`
                      .toLowerCase()
                      .includes(globalSearch.trim().toLowerCase()),
                  )
                  .map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="mv0-search-result"
                      onClick={() => setGlobalSearch("")}
                    >
                      <span>
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </span>
                      <span aria-hidden="true">↗</span>
                    </Link>
                  ))}
                {/(response|appointment|sales|engagement|metric)/i.test(globalSearch) && (
                  <Link
                    href="/app/v0/analytics"
                    className="mv0-search-result"
                    onClick={() => setGlobalSearch("")}
                  >
                    <span>
                      <strong>Analytics</strong>
                      <small>Explore observed activity and outcomes</small>
                    </span>
                    <span aria-hidden="true">↗</span>
                  </Link>
                )}
              </div>
            )}
          </div>
          <span className="mv0-version">V0.0 FOUNDATION</span>
        </header>

        <main className="mv0-content">
          {view === "dashboard" && (
            <DashboardView
              metrics={metrics}
              leads={leads}
              sourceCounts={sourceCounts}
              exceptionsCount={exceptions.length}
            />
          )}

          {view === "leads" && !leadId && (
            <LeadsView
              leads={searchedLeads}
              total={leads.length}
              search={search}
              setSearch={setSearch}
              stages={stageCounts}
              selectedStage={selectedStage}
              setSelectedStage={setSelectedStage}
            />
          )}

          {view === "leads" && leadId && (
            <LeadInvestigation
              detail={leadDetail}
              timelineFilter={timelineFilter}
              setTimelineFilter={setTimelineFilter}
            />
          )}

          {view === "analytics" && (
            <AnalyticsView
              metrics={metrics}
              leads={leads}
              timelineLeadIds={timelineLeadIds}
            />
          )}

          {view === "sources" && (
            <SourcesView
              leads={leads}
              sourceCounts={sourceCounts}
              timelineLeadIds={linkedLeadIds}
            />
          )}

          {view === "reports" && <ReportsView metrics={metrics} />}

          {view === "imports" && <ImportsView />}

          {view === "methods" && <MethodsView />}

          {view === "exceptions" && (
            <ExceptionsView
              leads={exceptions}
              totalLeads={leads.length}
              linkedCount={linkedLeadIds.size}
            />
          )}

          {![
            "dashboard",
            "leads",
            "analytics",
            "sources",
            "reports",
            "imports",
            "methods",
            "exceptions",
          ].includes(view) && (
            <section className="mv0-panel">
              <p className="mv0-eyebrow">WORKSPACE</p>
              <h1>Section not found</h1>
              <p className="mv0-muted">
                This MANTIK v0 route is not available.
              </p>
              <Link href="/app/v0" className="mv0-button">
                Return to dashboard
              </Link>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mv0-page-heading">
      <div>
        <p className="mv0-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="mv0-page-description">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  state = "CALCULATED",
}: {
  label: string;
  value: string | number;
  detail: string;
  state?: string;
}) {
  return (
    <article className="mv0-metric">
      <div className="mv0-metric-label">{label}</div>
      <div className="mv0-metric-value">{value}</div>
      <p>{detail}</p>
      <span className="mv0-metric-state">{state}</span>
    </article>
  );
}

function Panel({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="mv0-panel">
      <div className="mv0-panel-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EvidencePill({ children }: { children: React.ReactNode }) {
  return <span className="mv0-evidence-pill">{children}</span>;
}

function DashboardView({
  metrics,
  leads,
  sourceCounts,
  exceptionsCount,
}: {
  metrics: DashboardMetrics;
  leads: Lead[];
  sourceCounts: [string, number][];
  exceptionsCount: number;
}) {
  const coverage =
    metrics.totalLeads === 0
      ? null
      : Math.round(
          (metrics.timelineLeads / metrics.totalLeads) * 100,
        );

  return (
    <>
      <PageHeading
        eyebrow="MANAGEMENT INTELLIGENCE / OVERVIEW"
        title="What is happening today?"
        description="A decision-focused view of lead activity, customer engagement, and observed outcomes."
        action={
          <Link href="/app/v0/analytics" className="mv0-button">
            Open analysis ↗
          </Link>
        }
      />

      <div className="mv0-metrics-grid">
        <Metric
          label="Total leads"
          value={metrics.totalLeads}
          detail="Canonical lead records"
        />
        <Metric
          label="Active leads"
          value={metrics.activeLeads}
          detail={`Of ${metrics.totalLeads} total records`}
        />
        <Metric
          label="Observed responses"
          value={metrics.inboundResponseLeads}
          detail="Leads with inbound response evidence"
        />
        <Metric
          label="Appointments"
          value={metrics.totalAppointmentsBooked}
          detail={`${metrics.totalAppointmentsShown} shown in available evidence`}
        />
        <Metric
          label="Observed sales"
          value={metrics.sales}
          detail="Based on existing outcome rules"
        />
      </div>

      <div className="mv0-dashboard-grid">
        <Panel
          title="Important findings"
          description="Evidence-backed signals, not causal claims."
        >
          <div className="mv0-finding-list">
            <div className="mv0-finding">
              <span className="mv0-finding-mark">01</span>
              <div>
                <strong>How much of the lead population can we investigate?</strong>
                <p>
                  {coverage === null
                    ? "Timeline coverage cannot be calculated because the lead population is empty."
                    : `${metrics.timelineLeads} of ${metrics.totalLeads} leads (${coverage}%) have linked timeline records.`}
                  {" "}Unlinked leads remain unknown, not proof of no activity.
                </p>
                <Link href="/app/v0/exceptions">Review evidence gaps →</Link>
              </div>
            </div>
            <div className="mv0-finding">
              <span className="mv0-finding-mark">02</span>
              <div>
                <strong>What response evidence is available?</strong>
                <p>
                  {metrics.inboundResponseLeads} leads have observed inbound
                  response evidence. Response comparisons must use the
                  eligible population and available observation window.
                </p>
                <Link href="/app/v0/analytics">Explore engagement →</Link>
              </div>
            </div>
            <div className="mv0-finding">
              <span className="mv0-finding-mark">03</span>
              <div>
                <strong>Where should investigation begin?</strong>
                <p>
                  {exceptionsCount} lead records do not currently appear
                  among leads linked to a timeline record. This is a data
                  coverage exception, not proof that follow-up was missed.
                </p>
                <Link href="/app/v0/exceptions">Inspect exceptions →</Link>
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title="Evidence coverage"
          description="How much of the known lead population has usable linked evidence?"
        >
          <div className="mv0-coverage-number">
            {coverage === null ? "—" : `${coverage}%`}
          </div>
          <div className="mv0-progress-track">
            <div
              className="mv0-progress-fill"
              style={{ width: `${coverage ?? 0}%` }}
            />
          </div>
          <div className="mv0-coverage-row">
            <span>Leads with timeline records</span>
            <strong>{metrics.timelineLeads} / {metrics.totalLeads}</strong>
          </div>
          <div className="mv0-coverage-row">
            <span>Communication evidence</span>
            <strong>{metrics.communicationLeads} / {metrics.timelineLeads}</strong>
          </div>
          <div className="mv0-coverage-row">
            <span>Inbound response evidence</span>
            <strong>{metrics.inboundResponseLeads} / {metrics.communicationLeads}</strong>
          </div>
          <p className="mv0-footnote">
            Coverage measures available imported evidence. It does not
            establish that unobserved actions did not happen.
          </p>
        </Panel>
      </div>

      <div className="mv0-dashboard-grid">
        <Panel
          title="Source distribution"
          description="Lead counts grouped by recorded source label. This is not a value or ROI ranking."
          action={<Link href="/app/v0/sources" className="mv0-text-link">View sources →</Link>}
        >
          {sourceCounts.length === 0 ? (
            <EmptyState text="No lead source records are available." />
          ) : (
            <div className="mv0-bar-list">
              {sourceCounts.slice(0, 7).map(([source, count]) => (
                <div className="mv0-bar-row" key={source}>
                  <span title={source}>{source}</span>
                  <div className="mv0-bar-track">
                    <div
                      className="mv0-bar-fill"
                      style={{
                        width: `${Math.max(
                          3,
                          (count / Math.max(sourceCounts[0][1], 1)) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Continue your investigation"
          description="Move from the summary to the records behind it."
        >
          <div className="mv0-link-list">
            <WorkspaceLink href="/app/v0/leads" title="Find a lead" detail="Search records and inspect individual timelines." />
            <WorkspaceLink href="/app/v0/analytics" title="Understand outcomes" detail="Review populations, sources, and evidence coverage." />
            <WorkspaceLink href="/app/v0/reports" title="Prepare a report" detail="Build a management-ready summary." />
            <WorkspaceLink href="/app/v0/imports" title="Review source intake" detail="Open the existing import workflow." />
          </div>
        </Panel>
      </div>

      <Panel
        title="Recently created leads"
        description="A sample of the latest records in the current lead population."
        action={<Link href="/app/v0/leads" className="mv0-text-link">All leads →</Link>}
      >
        <LeadTable leads={[...leads].sort((a, b) =>
          (b.createdAt || "").localeCompare(a.createdAt || ""),
        ).slice(0, 6)} />
      </Panel>
    </>
  );
}

function LeadsView({
  leads,
  total,
  search,
  setSearch,
  stages,
  selectedStage,
  setSelectedStage,
}: {
  leads: Lead[];
  total: number;
  search: string;
  setSearch: (value: string) => void;
  stages: [string, number][];
  selectedStage: string;
  setSelectedStage: (value: string) => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="RECORD INVESTIGATION"
        title="Find a lead. Understand what happened."
        description="Search the canonical lead population, then trace the available timeline evidence."
      />

      <Panel
        title="Recorded stage map"
        description="Counts reflect the stage values currently stored on lead records. They are not assumed funnel transitions."
      >
        <div className="mv0-stage-grid">
          <button
            type="button"
            onClick={() => setSelectedStage("all")}
            className={"mv0-stage-card" + (selectedStage === "all" ? " is-selected" : "")}
          >
            <span>ALL RECORDS</span>
            <strong>{total}</strong>
            <small>Leads</small>
          </button>
          {stages.slice(0, 7).map(([stage, count]) => (
            <button
              type="button"
              key={stage}
              onClick={() =>
                setSelectedStage(selectedStage === stage ? "all" : stage)
              }
              className={"mv0-stage-card" + (selectedStage === stage ? " is-selected" : "")}
            >
              <span>RECORDED STAGE</span>
              <strong>{count}</strong>
              <small>{stage}</small>
            </button>
          ))}
        </div>
      </Panel>

      <Panel
        title="Lead population"
        description={`${leads.length} matching records`}
      >
        <div className="mv0-table-toolbar">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer, lead ID, source, or vehicle…"
            aria-label="Search leads"
          />
          <button
            type="button"
            className="mv0-button mv0-button-secondary"
            onClick={() => {
              setSearch("");
              setSelectedStage("all");
            }}
          >
            Clear filters
          </button>
        </div>
        <LeadTable leads={leads} />
      </Panel>
    </>
  );
}

function LeadTable({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) {
    return <EmptyState text="No lead records match the current search." />;
  }

  return (
    <div className="mv0-table-scroll">
      <table className="mv0-table">
        <thead>
          <tr>
            <th>Lead</th>
            <th>Status</th>
            <th>Recorded stage</th>
            <th>Source</th>
            <th>Created</th>
            <th>Last observed activity</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td>
                <Link href={`/app/v0/leads/${lead.id}`} className="mv0-lead-name">
                  {displayName(lead.name)}
                </Link>
                <small className="mv0-table-subtext">{lead.externalId}</small>
                {lead.vehicle && <small className="mv0-table-subtext">{lead.vehicle}</small>}
              </td>
              <td><StatusPill value={lead.status} /></td>
              <td>{lead.stage || "Unknown"}</td>
              <td>{sourceName(lead)}</td>
              <td>{formatDate(lead.createdAt)}</td>
              <td>{formatDateTime(lead.lastEngagedAt || lead.lastContactedAt)}</td>
              <td><Link href={`/app/v0/leads/${lead.id}`} className="mv0-row-open">Open ↗</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeadInvestigation({
  detail,
  timelineFilter,
  setTimelineFilter,
}: {
  detail: Detail | null;
  timelineFilter: TimelineFilter;
  setTimelineFilter: (value: TimelineFilter) => void;
}) {
  const [showRaw, setShowRaw] = useState<string | null>(null);

  if (!detail) {
    return (
      <Panel title="Lead not found" description="No canonical lead record exists for this identifier.">
        <EvidencePill>UNKNOWN IDENTITY</EvidencePill>
        <p className="mv0-muted">
          The requested identifier did not resolve to a lead. No identity has been inferred.
        </p>
        <Link href="/app/v0/leads" className="mv0-button">Return to leads</Link>
      </Panel>
    );
  }

  const { lead, events } = detail;
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );
  const filteredEvents = sortedEvents.filter((event) =>
    eventMatchesFilter(event, timelineFilter),
  );
  const outbound = events.filter((event) => event.direction.toLowerCase() === "outbound");
  const inbound = events.filter((event) => event.direction.toLowerCase() === "inbound");
  const firstOutbound = [...outbound].sort((a, b) =>
    a.occurredAt.localeCompare(b.occurredAt),
  )[0];
  const firstInbound = [...inbound].sort((a, b) =>
    a.occurredAt.localeCompare(b.occurredAt),
  )[0];

  const responseInterval =
    firstOutbound && firstInbound &&
    new Date(firstInbound.occurredAt).getTime() >= new Date(firstOutbound.occurredAt).getTime()
      ? Math.round(
          (new Date(firstInbound.occurredAt).getTime() -
            new Date(firstOutbound.occurredAt).getTime()) / 60000,
        )
      : null;

  return (
    <>
      <Link href="/app/v0/leads" className="mv0-back-inline">← Back to leads</Link>
      <PageHeading
        eyebrow="ONE LEAD. ONE EVIDENCE TRAIL."
        title={displayName(lead.name)}
        description={`${lead.externalId || "No external ID"} · ${sourceName({
          ...lead,
          lastContactedAt: null,
          lastEngagedAt: null,
        })}`}
        action={<EvidencePill>{events.length ? "TIMELINE AVAILABLE" : "NO LINKED EVENTS"}</EvidencePill>}
      />

      <div className="mv0-lead-hero">
        <div>
          <span className="mv0-detail-label">VEHICLE INTEREST</span>
          <strong>{lead.vehicle || "Not recorded"}</strong>
        </div>
        <div>
          <span className="mv0-detail-label">STATUS / STAGE</span>
          <strong>{lead.status || "Unknown"} / {lead.stage || "Unknown"}</strong>
        </div>
        <div>
          <span className="mv0-detail-label">SOURCE</span>
          <strong>{lead.source || lead.sourceGroup || "Unknown"}</strong>
        </div>
        <div>
          <span className="mv0-detail-label">DEAL STATUS</span>
          <strong>{lead.dealStatus || "Not recorded"}</strong>
        </div>
      </div>

      <div className="mv0-metrics-grid mv0-detail-metrics">
        <Metric label="Timeline events" value={events.length} detail="Events currently linked to this lead" />
        <Metric label="Outbound events" value={outbound.length} detail="Events classified as outbound" state="OBSERVED" />
        <Metric label="Inbound events" value={inbound.length} detail="Events classified as inbound" state="OBSERVED" />
        <Metric label="First outbound" value={firstOutbound ? formatDateTime(firstOutbound.occurredAt) : "—"} detail="Earliest available outbound event" />
        <Metric
          label="First observed interval"
          value={responseInterval === null ? "—" : responseInterval < 60 ? `${responseInterval} min` : `${(responseInterval / 60).toFixed(1)} hr`}
          detail={responseInterval === null ? "Cannot calculate from the available ordered events" : "First inbound event after first outbound event"}
        />
      </div>

      <div className="mv0-investigation-grid">
        <Panel
          title="Timeline"
          description="Chronological activity. Open an event to inspect its source evidence."
          action={<span className="mv0-count">{filteredEvents.length} events</span>}
        >
          <div className="mv0-filter-strip">
            {timelineFilters.map((filter) => (
              <button
                type="button"
                key={filter}
                onClick={() => setTimelineFilter(filter)}
                className={timelineFilter === filter ? "is-selected" : ""}
              >
                {filter}
              </button>
            ))}
          </div>

          {filteredEvents.length === 0 ? (
            <EmptyState text={events.length ? "No events match this filter." : "No timeline events are currently linked to this lead. This does not prove that no activity occurred."} />
          ) : (
            <div className="mv0-timeline">
              {filteredEvents.map((event) => (
                <article className="mv0-timeline-event" key={event.id}>
                  <span className="mv0-timeline-marker" />
                  <div className="mv0-event-body">
                    <div className="mv0-event-top">
                      <strong>{event.type}</strong>
                      <time>{formatDateTime(event.occurredAt)}</time>
                    </div>
                    <div className="mv0-event-meta">
                      {[event.actor, event.actorType, event.direction, event.channel]
                        .filter(Boolean)
                        .join(" · ") || "Event metadata not recorded"}
                    </div>
                    {event.details && <p className="mv0-event-details">{event.details}</p>}
                    <div className="mv0-event-footer">
                      <EvidencePill>OBSERVED EVENT</EvidencePill>
                      {event.templateCode && <span>Template: {event.templateCode}</span>}
                      <button
                        type="button"
                        onClick={() => setShowRaw(showRaw === event.id ? null : event.id)}
                      >
                        {showRaw === event.id ? "Hide evidence −" : "Inspect evidence +"}
                      </button>
                    </div>
                    {showRaw === event.id && (
                      <div className="mv0-raw-evidence">
                        <div><span>Source file</span><strong>{event.sourceFile || "Not recorded"}</strong></div>
                        <div><span>Source event ID</span><strong>{event.sourceEventId || "Not recorded"}</strong></div>
                        <div><span>Category</span><strong>{event.category || "Not recorded"}</strong></div>
                        <details>
                          <summary>Raw source data</summary>
                          <pre>{JSON.stringify(event.rawData, null, 2)}</pre>
                        </details>
                        <details>
                          <summary>Event metadata</summary>
                          <pre>{JSON.stringify(event.metadata, null, 2)}</pre>
                        </details>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>

        <div className="mv0-side-stack">
          <Panel title="What we know" description="Facts available from this record.">
            <div className="mv0-fact-list">
              <Fact label="Created" value={formatDateTime(lead.createdAt)} />
              <Fact label="First outbound event" value={formatDateTime(firstOutbound?.occurredAt)} />
              <Fact label="First inbound event" value={formatDateTime(firstInbound?.occurredAt)} />
              <Fact label="Sold date" value={formatDate(lead.soldDate)} />
              <Fact label="Deal status" value={lead.dealStatus || "Not recorded"} />
            </div>
          </Panel>
          <Panel title="Evidence limitations" description="Interpret the timeline within its coverage.">
            <div className="mv0-callout">
              <strong>Missing evidence is not proof of inactivity.</strong>
              <p>
                This view only reflects events currently linked to this lead.
                A task, status, or inferred event must not be treated as proof
                of a customer action.
              </p>
            </div>
            <Link href="/app/v0/exceptions" className="mv0-text-link">Review data exceptions →</Link>
          </Panel>
        </div>
      </div>
    </>
  );
}

function AnalyticsView({
  metrics,
  leads,
  timelineLeadIds,
}: {
  metrics: DashboardMetrics;
  leads: Lead[];
  timelineLeadIds: string[];
}) {
  type SortKey = "leads" | "engaged" | "contacted" | "coverage" | "source";
  type CoverageFilter = "all" | "covered" | "missing";

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("leads");
  const [sortDescending, setSortDescending] = useState(true);
  const [coverageFilter, setCoverageFilter] = useState<CoverageFilter>("all");
  const [selectedSource, setSelectedSource] = useState("");

  const linkedIds = useMemo(() => new Set(timelineLeadIds), [timelineLeadIds]);

  const sourceRows = useMemo(() => {
    const grouped = new Map<string, Lead[]>();

    for (const lead of leads) {
      const source = sourceName(lead);
      const group = grouped.get(source) ?? [];
      group.push(lead);
      grouped.set(source, group);
    }

    return [...grouped.entries()].map(([source, sourceLeads]) => {
      const linked = sourceLeads.filter((lead) => linkedIds.has(lead.id)).length;
      const engaged = sourceLeads.filter((lead) => Boolean(lead.lastEngagedAt)).length;
      const contacted = sourceLeads.filter((lead) => Boolean(lead.lastContactedAt)).length;

      return {
        source,
        leads: sourceLeads.length,
        engaged,
        contacted,
        linked,
        missing: sourceLeads.length - linked,
        coverage: sourceLeads.length ? linked / sourceLeads.length : 0,
        engagementRate: sourceLeads.length ? engaged / sourceLeads.length : 0,
        records: sourceLeads,
      };
    });
  }, [leads, linkedIds]);

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = sourceRows.filter((row) => {
      const matchesQuery = !needle || row.source.toLowerCase().includes(needle);
      const matchesCoverage =
        coverageFilter === "all" ||
        (coverageFilter === "covered" && row.missing === 0) ||
        (coverageFilter === "missing" && row.missing > 0);

      return matchesQuery && matchesCoverage;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;

      if (sortKey === "source") {
        comparison = a.source.localeCompare(b.source);
      } else if (sortKey === "coverage") {
        comparison = a.coverage - b.coverage;
      } else if (sortKey === "engaged") {
        comparison = a.engagementRate - b.engagementRate;
      } else {
        comparison = a[sortKey] - b[sortKey];
      }

      return sortDescending ? -comparison : comparison;
    });
  }, [sourceRows, query, coverageFilter, sortKey, sortDescending]);

  const activeSource =
    filteredRows.find((row) => row.source === selectedSource) ??
    filteredRows[0] ??
    null;

  function changeSort(key: SortKey) {
    if (sortKey === key) {
      setSortDescending((current) => !current);
    } else {
      setSortKey(key);
      setSortDescending(key !== "source");
    }
  }

  function sortLabel(key: SortKey, label: string) {
    return (
      <button
        type="button"
        className="mv0-analytics-sort"
        onClick={() => changeSort(key)}
        aria-label={`Sort by ${label}`}
      >
        {label}
        <span aria-hidden="true">
          {sortKey === key ? (sortDescending ? " ↓" : " ↑") : " ↕"}
        </span>
      </button>
    );
  }

  const percent = (value: number) => `${Math.round(value * 100)}%`;

  return (
    <section className="mv0-analytics">
      <div className="mv0-analytics-heading">
        <div>
          <div className="mv0-eyebrow">ANALYTICS / INVESTIGATION WORKSPACE</div>
          <h1>Source and population analysis</h1>
          <p>
            Compare recorded populations, inspect evidence coverage, and open
            individual lead records. Observed fields are not causal explanations.
          </p>
        </div>
        <div className="mv0-analytics-scope">
          <span>LEAD POPULATION</span>
          <strong>{leads.length.toLocaleString("en-US")}</strong>
          <small>records in current dataset</small>
        </div>
      </div>

      <div className="mv0-analytics-summary" aria-label="Dataset summary">
        <div>
          <span>LEADS</span>
          <strong>{metrics.totalLeads.toLocaleString("en-US")}</strong>
        </div>
        <div>
          <span>TIMELINE-LINKED</span>
          <strong>{metrics.timelineLeads.toLocaleString("en-US")}</strong>
        </div>
        <div>
          <span>OUTBOUND EVIDENCE</span>
          <strong>{metrics.observedOutboundLeads.toLocaleString("en-US")}</strong>
        </div>
        <div>
          <span>INBOUND RESPONSE</span>
          <strong>{metrics.inboundResponseLeads.toLocaleString("en-US")}</strong>
        </div>
        <div>
          <span>OBSERVED SALES</span>
          <strong>{metrics.sales.toLocaleString("en-US")}</strong>
        </div>
      </div>

      <div className="mv0-analytics-controls">
        <label className="mv0-analytics-search">
          <span>FILTER POPULATIONS</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search source label…"
            aria-label="Filter source populations"
          />
        </label>
        <div className="mv0-analytics-filter-group" aria-label="Timeline coverage filter">
          <span>COVERAGE</span>
          {([
            ["all", "All sources"],
            ["covered", "Fully linked"],
            ["missing", "Evidence gaps"],
          ] as [CoverageFilter, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={coverageFilter === value ? "is-selected" : ""}
              onClick={() => setCoverageFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mv0-analytics-result-count">
          {filteredRows.length} / {sourceRows.length} populations
        </div>
      </div>

      <div className="mv0-analytics-layout">
        <section className="mv0-analytics-table-panel" aria-label="Source comparison table">
          <div className="mv0-analytics-panel-heading">
            <div>
              <strong>Population comparison</strong>
              <span>Recorded lead fields and timeline linkage</span>
            </div>
            <span className="mv0-analytics-table-hint">Select a row to inspect records →</span>
          </div>
          <div className="mv0-table-scroll mv0-analytics-table-scroll">
            <table className="mv0-table mv0-analytics-table">
              <thead>
                <tr>
                  <th>{sortLabel("source", "Source")}</th>
                  <th className="mv0-numeric">{sortLabel("leads", "Leads")}</th>
                  <th className="mv0-numeric">{sortLabel("engaged", "Engaged*")}</th>
                  <th className="mv0-numeric">{sortLabel("contacted", "Contacted")}</th>
                  <th className="mv0-numeric">Timeline linked</th>
                  <th className="mv0-numeric">{sortLabel("coverage", "Coverage")}</th>
                  <th className="mv0-numeric">Evidence gaps</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr
                    key={row.source}
                    className={activeSource?.source === row.source ? "is-selected" : ""}
                    aria-selected={activeSource?.source === row.source}
                  >
                    <td>
                      <button
                        type="button"
                        className="mv0-analytics-source"
                        onClick={() => setSelectedSource(row.source)}
                        title={`Inspect ${row.source}`}
                      >
                        <strong>{row.source}</strong>
                        <span>{row.records.length} lead records</span>
                      </button>
                    </td>
                    <td className="mv0-numeric">
                      <button type="button" className="mv0-analytics-number" onClick={() => setSelectedSource(row.source)}>
                        {row.leads}
                      </button>
                    </td>
                    <td className="mv0-numeric">
                      <button type="button" className="mv0-analytics-number" onClick={() => setSelectedSource(row.source)}>
                        {row.engaged} <small>{percent(row.engagementRate)}</small>
                      </button>
                    </td>
                    <td className="mv0-numeric">
                      <button type="button" className="mv0-analytics-number" onClick={() => setSelectedSource(row.source)}>
                        {row.contacted}
                      </button>
                    </td>
                    <td className="mv0-numeric">
                      <button type="button" className="mv0-analytics-number" onClick={() => setSelectedSource(row.source)}>
                        {row.linked} / {row.leads}
                      </button>
                    </td>
                    <td className="mv0-numeric">
                      <button type="button" className="mv0-analytics-number" onClick={() => setSelectedSource(row.source)}>
                        {percent(row.coverage)}
                      </button>
                    </td>
                    <td className="mv0-numeric">
                      <button
                        type="button"
                        className={`mv0-analytics-number ${row.missing ? "has-gap" : ""}`}
                        onClick={() => {
                          setSelectedSource(row.source);
                          if (row.missing) setCoverageFilter("all");
                        }}
                      >
                        {row.missing}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState text="No source populations match these filters." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mv0-analytics-footnote">
            * Engaged = a lead record has a stored last-engaged timestamp.
            Contacted = a stored last-contacted timestamp. These are field-based
            counts, not verified communication-event counts. Appointment and sale
            conversion rates are not calculated at source level in this view.
          </div>
        </section>

        <aside className="mv0-analytics-evidence" aria-label="Selected source evidence">
          <div className="mv0-analytics-panel-heading">
            <div>
              <strong>Evidence inspector</strong>
              <span>Population → lead record</span>
            </div>
            <span className="mv0-analytics-live-dot">LIVE DATA</span>
          </div>

          {activeSource ? (
            <>
              <div className="mv0-analytics-selected-source">
                <span>SELECTED POPULATION</span>
                <h2>{activeSource.source}</h2>
                <div className="mv0-analytics-selected-stats">
                  <div><span>Leads</span><strong>{activeSource.leads}</strong></div>
                  <div><span>Engaged*</span><strong>{activeSource.engaged}</strong></div>
                  <div><span>Timeline gaps</span><strong>{activeSource.missing}</strong></div>
                </div>
              </div>

              <div className="mv0-analytics-evidence-heading">
                <strong>Lead records</strong>
                <span>{activeSource.records.length} records</span>
              </div>
              <div className="mv0-analytics-lead-list">
                {[...activeSource.records]
                  .sort((a, b) => {
                    const dateA = a.lastEngagedAt || a.lastContactedAt || a.createdAt || "";
                    const dateB = b.lastEngagedAt || b.lastContactedAt || b.createdAt || "";
                    return dateB.localeCompare(dateA);
                  })
                  .map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/app/v0/leads/${lead.id}`}
                      className="mv0-analytics-lead"
                    >
                      <span className="mv0-analytics-lead-main">
                        <strong>{displayName(lead.name)}</strong>
                        <small>{lead.externalId || "No external ID"} · {lead.stage || lead.status || "Stage unknown"}</small>
                        <small>Last engaged: {formatDate(lead.lastEngagedAt)} · Last contacted: {formatDate(lead.lastContactedAt)}</small>
                      </span>
                      <span className={`mv0-analytics-link-state ${linkedIds.has(lead.id) ? "is-linked" : "is-missing"}`}>
                        {linkedIds.has(lead.id) ? "TIMELINE ↗" : "NO TIMELINE ↗"}
                      </span>
                    </Link>
                  ))}
              </div>
              <div className="mv0-analytics-limitation">
                <strong>Interpretation boundary</strong>
                <p>
                  Timeline coverage indicates whether linked evidence is available
                  for these records. It does not establish profitability, lead quality,
                  causation, or the absence of activity when evidence is missing.
                </p>
              </div>
            </>
          ) : (
            <EmptyState text="Select a source population to inspect its lead records." />
          )}
        </aside>
      </div>
    </section>
  );
}

function SourcesView({
  leads,
  sourceCounts,
  timelineLeadIds,
}: {
  leads: Lead[];
  sourceCounts: [string, number][];
  timelineLeadIds: Set<string>;
}) {
  const [query, setQuery] = useState("");
  const rows = sourceCounts.filter(([source]) =>
    source.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <>
      <PageHeading
        eyebrow="SOURCE INTELLIGENCE"
        title="What do we know about each source?"
        description="Separate lead volume and evidence coverage from the harder question of source value."
      />
      <Panel title="Source coverage" description="Counts are calculated from current lead records and linked timeline IDs.">
        <div className="mv0-table-toolbar">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter source labels…" aria-label="Filter sources" />
        </div>
        <div className="mv0-table-scroll">
          <table className="mv0-table">
            <thead><tr><th>Source label</th><th>Leads</th><th>Linked timelines</th><th>Coverage</th><th>Interpretation</th></tr></thead>
            <tbody>
              {rows.map(([source, count]) => {
                const matching = leads.filter((lead) => sourceName(lead) === source);
                const linked = matching.filter((lead) => timelineLeadIds.has(lead.id)).length;
                const rate = count ? Math.round(linked / count * 100) : null;
                return (
                  <tr key={source}>
                    <td><strong>{source}</strong></td>
                    <td>{count}</td>
                    <td>{linked} / {count}</td>
                    <td>{rate === null ? "—" : `${rate}%`}</td>
                    <td><EvidencePill>{linked === count ? "COVERED" : "PARTIAL COVERAGE"}</EvidencePill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <EmptyState text="No source labels match the filter." />}
      </Panel>
      <div className="mv0-callout">
        <strong>Coverage is not ROI.</strong>
        <p>
          A source&apos;s lead count or timeline coverage does not establish cost,
          profitability, or incremental sales. Those conclusions require
          reliable spend and outcome data.
        </p>
      </div>
    </>
  );
}

function ReportsView({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <>
      <PageHeading
        eyebrow="MANAGEMENT REPORTING"
        title="Turn evidence into a decision."
        description="Reports should explain what happened, what supports the finding, and what remains uncertain."
        action={<Link href="/reports/builder" className="mv0-button">Create report ↗</Link>}
      />
      <div className="mv0-topic-grid">
        <ReportCard number="01" title="Lead source performance" description="Compare lead populations, evidence coverage, and observed outcomes by source." href="/reports/builder?groupBy=source&metric=leads&metric=timelineCovered&metric=responded&metric=soldClosed" />
        <ReportCard number="02" title="Response and follow-up" description="Review observed outbound activity and inbound response evidence." href="/reports/builder?groupBy=source&metric=observedOutbound&metric=responded&metric=responseRate" />
        <ReportCard number="03" title="Appointments and sales" description="Inspect appointment evidence alongside recorded outcomes." href="/reports/builder?groupBy=stage&metric=leads&metric=appointments&metric=soldClosed" />
        <ReportCard number="04" title="Data coverage" description="Find where the current evidence model limits analysis." href="/reports/builder?groupBy=source&metric=leads&metric=timelineCovered" />
      </div>
      <Panel title="Current population" description="Current values from the existing dashboard analytics repository.">
        <div className="mv0-metrics-grid mv0-metrics-grid-small">
          <Metric label="Leads" value={metrics.totalLeads} detail="Canonical population" />
          <Metric label="Timeline coverage" value={metrics.timelineLeads} detail="Leads with linked timeline records" />
          <Metric label="Responses" value={metrics.inboundResponseLeads} detail="Observed inbound response evidence" />
          <Metric label="Sales" value={metrics.sales} detail="Observed outcomes under current rules" />
        </div>
        <div className="mv0-action-row">
          <Link href="/reports" className="mv0-button mv0-button-secondary">Open report library ↗</Link>
          <Link href="/reports/template-responses" className="mv0-button mv0-button-secondary">Template response analysis ↗</Link>
        </div>
      </Panel>
    </>
  );
}

function ImportsView() {
  return (
    <>
      <PageHeading
        eyebrow="SOURCE EVIDENCE INTAKE"
        title="Bring source data into the evidence model."
        description="Import, validate, reconcile, and review source records while preserving provenance."
      />
      <div className="mv0-topic-grid">
        <ImportStep number="01" title="Upload" description="Select Tekion timeline files and CSV exports using the existing import workflow." />
        <ImportStep number="02" title="Validate" description="Inspect parsing results and invalid or unsupported source rows before committing." />
        <ImportStep number="03" title="Reconcile" description="Review identity linkage and duplicate-event handling; do not silently invent a match." />
        <ImportStep number="04" title="Import" description="Use the existing commit flow to write normalized records to the canonical model." />
      </div>
      <Panel title="Open import workspace" description="This new experience links to the established import implementation rather than duplicating ingestion logic.">
        <div className="mv0-callout">
          <strong>Provenance is part of the data.</strong>
          <p>
            Keep source identifiers and source files available for review.
            Missing evidence should remain visible rather than being converted
            into a zero or a claim that an action did not happen.
          </p>
        </div>
        <Link href="/import" className="mv0-button">Open import workspace ↗</Link>
      </Panel>
    </>
  );
}

function MethodsView() {
  return (
    <>
      <PageHeading
        eyebrow="ANALYTICAL METHODS"
        title="How is evidence normalized and interpreted?"
        description="Review templates and matching methods without confusing a classification rule with a directly observed customer action."
      />
      <div className="mv0-topic-grid">
        <ReportCard number="01" title="Template catalog" description="Review known email and text templates and their recorded usage." href="/methods" />
        <ReportCard number="02" title="Template matching" description="Inspect which timeline events are matched to known templates." href="/methods" />
        <ReportCard number="03" title="Response analysis" description="Explore observed inbound responses after template-coded messages." href="/reports/template-responses" />
        <ReportCard number="04" title="Method history" description="Review existing method runs and their reported results." href="/methods" />
      </div>
      <Panel title="Methodology rules" description="These principles govern how MANTIK should present conclusions.">
        <div className="mv0-rule-list">
          <Fact label="Observed" value="Direct source evidence exists." />
          <Fact label="Calculated" value="A value is derived from a documented numerator and denominator." />
          <Fact label="Inferred" value="A documented rule derives a conclusion from other evidence." />
          <Fact label="Unknown" value="The available evidence is insufficient to conclude." />
        </div>
        <Link href="/methods" className="mv0-button mv0-button-secondary">Open existing methods workspace ↗</Link>
      </Panel>
    </>
  );
}

function ExceptionsView({
  leads,
  totalLeads,
  linkedCount,
}: {
  leads: Lead[];
  totalLeads: number;
  linkedCount: number;
}) {
  return (
    <>
      <PageHeading
        eyebrow="INVESTIGATION QUEUE"
        title="What deserves attention?"
        description="Exceptions identify evidence gaps and data-quality issues. They are not automatically proof of missed work."
      />
      <div className="mv0-metrics-grid mv0-metrics-grid-small">
        <Metric label="Lead population" value={totalLeads} detail="Canonical lead records" />
        <Metric label="Linked lead IDs" value={linkedCount} detail="Distinct lead IDs present on timeline records" />
        <Metric label="Without linked timeline" value={leads.length} detail="Data coverage exception" state="MISSING EVIDENCE" />
      </div>
      <Panel
        title="Leads without a linked timeline"
        description="These records need coverage investigation. No conclusion about actual contact or follow-up is implied."
      >
        {leads.length === 0 ? (
          <EmptyState text="No unlinked lead records were identified by this check." />
        ) : (
          <LeadTable leads={leads} />
        )}
      </Panel>
      <Panel title="Additional exception types" description="These require explicit rules and supporting evidence before being promoted into actionable signals.">
        <div className="mv0-rule-list">
          <Fact label="No follow-up" value="Requires a reliable activity source and a defined time window." />
          <Fact label="No response" value="Requires an eligible outbound population and sufficient observation time." />
          <Fact label="Identity conflict" value="Requires explicit matching evidence; ambiguous matches must remain unresolved." />
          <Fact label="Stalled lead" value="Requires a documented lifecycle rule and a known observation window." />
          <Fact label="Failed workflow" value="Requires a source workflow failure record, not an inferred absence." />
        </div>
      </Panel>
    </>
  );
}

function AnalyticsTopic({
  number,
  title,
  question,
  detail,
  href,
}: {
  number: string;
  title: string;
  question: string;
  detail: string;
  href: string;
}) {
  return (
    <article className="mv0-topic-card">
      <span className="mv0-topic-number">{number}</span>
      <h2>{title}</h2>
      <strong>{question}</strong>
      <p>{detail}</p>
      <Link href={href}>Investigate →</Link>
    </article>
  );
}

function ReportCard({
  number,
  title,
  description,
  href,
}: {
  number: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <article className="mv0-topic-card">
      <span className="mv0-topic-number">{number}</span>
      <h2>{title}</h2>
      <p>{description}</p>
      <Link href={href}>Open workspace →</Link>
    </article>
  );
}

function ImportStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <article className="mv0-topic-card">
      <span className="mv0-topic-number">{number}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </article>
  );
}

function WorkspaceLink({
  href,
  title,
  detail,
}: {
  href: string;
  title: string;
  detail: string;
}) {
  return (
    <Link href={href} className="mv0-workspace-link">
      <span><strong>{title}</strong><small>{detail}</small></span>
      <span aria-hidden="true">↗</span>
    </Link>
  );
}

function StatusPill({ value }: { value: string }) {
  return (
    <span className="mv0-status-pill">
      {value.trim() || "Unknown"}
    </span>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="mv0-fact">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="mv0-empty-state">{text}</div>;
}
