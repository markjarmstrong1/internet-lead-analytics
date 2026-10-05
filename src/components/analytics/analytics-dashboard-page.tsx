import Link from "next/link";

import { AppShell } from "@/components/app/app-shell";
import { EvidenceLegend } from "@/components/app/evidence-legend";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";

import type {
  DashboardAnalysis,
  SourceRow,
} from "@/analytics/metrics/dashboard";

function percent(
  value: number | null,
): string {
  return value === null
    ? "—"
    : `${(value * 100).toFixed(1)}%`;
}

function minutes(
  value: number | null,
): string {
  if (value === null) {
    return "—";
  }

  if (value < 60) {
    return `${value.toFixed(1)} min`;
  }

  if (value < 1440) {
    return `${(value / 60).toFixed(1)} hr`;
  }

  return `${(value / 1440).toFixed(1)} days`;
}

function numberWithRate(
  count: number,
  denominator: number,
  rate: number | null,
): string {
  return `${count} / ${denominator} (${percent(rate)})`;
}

function rateBar(
  value: number | null,
): React.ReactNode {
  if (value === null) {
    return (
      <span className="text-slate-400">
        —
      </span>
    );
  }

  return (
    <div className="flex min-w-[120px] items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-800"
          style={{
            width: `${Math.max(
              0,
              Math.min(100, value * 100),
            )}%`,
          }}
        />
      </div>
      <span className="w-12 text-right text-xs tabular-nums">
        {percent(value)}
      </span>
    </div>
  );
}

function sourceHighlight(
  rows: SourceRow[],
): {
  strongest: SourceRow | null;
  weakest: SourceRow | null;
} {
  const meaningful = rows.filter(
    (row) => row.contacted >= 5,
  );

  if (meaningful.length === 0) {
    return {
      strongest: null,
      weakest: null,
    };
  }

  return {
    strongest: [...meaningful].sort(
      (left, right) =>
        (right.responseRate ?? -1) -
        (left.responseRate ?? -1),
    )[0] ?? null,
    weakest: [...meaningful].sort(
      (left, right) =>
        (left.responseRate ?? Infinity) -
        (right.responseRate ?? Infinity),
    )[0] ?? null,
  };
}

export function AnalyticsDashboardPage({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  const highlights = sourceHighlight(
    analysis.sources,
  );

  const maxTrendLeads = Math.max(
    ...analysis.trends.map(
      (row) => row.leads,
    ),
    1,
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-8 lg:px-8">
        <PageHeader
          eyebrow="Analytics"
          title="Internet Lead Performance"
          description="A management view of what we are buying, whether we reach it, whether customers engage, whether leads progress, and where the evidence is strongest or weakest."
        />

        <EvidenceLegend />

        <nav
          aria-label="Analytics sections"
          className="sticky top-0 z-10 -mx-6 overflow-x-auto border-y border-slate-200 bg-white/95 px-6 backdrop-blur lg:-mx-8 lg:px-8"
        >
          <div className="flex min-w-max gap-1">
            {[
              ["Acquisition", "acquisition"],
              ["Contact", "contact"],
              ["Engagement", "engagement"],
              ["Progression", "progression"],
              ["Sources", "sources"],
              ["Trends", "trends"],
              ["Investigation", "investigation"],
            ].map(([label, id]) => (
              <a
                key={id}
                href={`#${id}`}
                className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-950"
              >
                {label}
              </a>
            ))}
          </div>
        </nav>

        <section className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white lg:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-slate-400">
            Management summary
          </p>

          <h2 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight">
            Are we getting value from the Internet leads we pay for?
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <SummaryItem
              label="Leads"
              value={String(
                analysis.acquisition.leads,
              )}
              detail="Canonical lead records"
            />
            <SummaryItem
              label="Contacted"
              value={percent(
                analysis.contact.contactRate,
              )}
              detail={`${analysis.contact.contacted} of ${analysis.acquisition.leads}`}
            />
            <SummaryItem
              label="Responded"
              value={percent(
                analysis.engagement.responseRate,
              )}
              detail={`${analysis.engagement.responded} of ${analysis.engagement.contacted} contacted`}
            />
            <SummaryItem
              label="Appointment evidence"
              value={percent(
                analysis.progression
                  .appointmentRateOfContacted,
              )}
              detail={`${analysis.progression.appointmentEvidence} of ${analysis.contact.contacted} contacted`}
            />
            <SummaryItem
              label="Sold / Closed"
              value={percent(
                analysis.progression
                  .soldClosedRateOfAll,
              )}
              detail={`${analysis.progression.soldClosed} of ${analysis.acquisition.leads} leads`}
            />
          </div>

          <p className="mt-6 max-w-4xl text-sm leading-6 text-slate-400">
            These are observed and calculated populations, not a
            guaranteed sequential conversion funnel. Timeline coverage
            and outcome evidence determine what can actually be concluded.
          </p>
        </section>

        <section
          id="acquisition"
          className="scroll-mt-20 space-y-4"
        >
          <SectionPanel
            title="1. Acquisition — what are we actually buying?"
            description="Lead volume and attribution establish the population for every downstream calculation."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Internet leads"
                value={String(
                  analysis.acquisition.leads,
                )}
                detail="Denominator for acquisition-wide rates"
              />
              <MetricCard
                label="Timeline covered"
                value={String(
                  analysis.acquisition
                    .timelineCovered,
                )}
                detail={percent(
                  analysis.acquisition
                    .timelineCoverageRate,
                )}
              />
              <MetricCard
                label="Unknown source"
                value={String(
                  analysis.acquisition
                    .unknownSource,
                )}
                detail="Leads without source attribution"
              />
              <MetricCard
                label="Source groups"
                value={String(
                  analysis.acquisition
                    .sourceGroups,
                )}
                detail="Distinct attributed source groups"
              />
            </div>

            <Formula>
              Timeline coverage = leads with ≥1 linked timeline record ÷
              total leads
            </Formula>
          </SectionPanel>
        </section>

        <section
          id="contact"
          className="scroll-mt-20 space-y-4"
        >
          <SectionPanel
            title="2. Contact — are we reaching them?"
            description="Contact means at least one qualifying employee outbound communication in the observed timeline."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Contacted"
                value={String(
                  analysis.contact.contacted,
                )}
                detail={`${percent(analysis.contact.contactRate)} of all leads`}
              />
              <MetricCard
                label="Not contacted"
                value={String(
                  analysis.contact.notContacted,
                )}
                detail={`${percent(
                  analysis.acquisition.leads === 0
                    ? null
                    : analysis.contact.notContacted /
                        analysis.acquisition.leads,
                )} of all leads`}
              />
              <MetricCard
                label="Median first contact"
                value={minutes(
                  analysis.contact
                    .medianFirstContactMinutes,
                )}
                detail={`${analysis.contact.validFirstContactTimes} valid lead/contact timestamps`}
              />
              <MetricCard
                label="Contact rate"
                value={percent(
                  analysis.contact.contactRate,
                )}
                detail="Contacted ÷ total leads"
              />
            </div>

            <Formula>
              Contact rate = contacted leads ÷ total leads
            </Formula>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">
                      Time to first contact
                    </th>
                    <th className="px-4 py-3 text-right">
                      Leads
                    </th>
                    <th className="px-4 py-3 text-right">
                      Share of timed contacts
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analysis.contact.contactSpeed.map(
                    (row) => (
                      <tr key={row.key}>
                        <td className="px-4 py-3 font-medium">
                          {row.label}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {row.contacted}
                        </td>
                        <td className="px-4 py-3">
                          {rateBar(row.rate)}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-400">
              First-contact speed is calculated from lead creation time
              to first qualifying employee outbound. Contacts with an
              unusable creation timestamp remain in the contact population
              but are excluded from the timed-contact denominator.
            </p>
          </SectionPanel>
        </section>

        <section
          id="engagement"
          className="scroll-mt-20 space-y-4"
        >
          <SectionPanel
            title="3. Engagement — when we reach them, do they engage?"
            description="Response is the first observed inbound communication at or after the first qualifying employee outbound communication."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                label="Responded"
                value={String(
                  analysis.engagement
                    .responded,
                )}
                detail={`${percent(
                  analysis.engagement
                    .responseRate,
                )} of contacted`}
              />
              <MetricCard
                label="Response rate"
                value={percent(
                  analysis.engagement
                    .responseRate,
                )}
                detail="Responded ÷ contacted"
              />
              <MetricCard
                label="Within 24 hours"
                value={percent(
                  analysis.engagement
                    .responseWithin24hRate,
                )}
                detail={`${analysis.engagement.respondedWithin24h} contacted leads`}
              />
              <MetricCard
                label="Median response"
                value={minutes(
                  analysis.engagement
                    .medianResponseMinutes,
                )}
                detail="Among observed responses"
              />
              <MetricCard
                label="No observed response"
                value={String(
                  analysis.engagement
                    .contacted -
                    analysis.engagement
                      .responded,
                )}
                detail="Contacted but no inbound response"
              />
            </div>

            <Formula>
              Response rate = contacted leads with an observed response ÷
              contacted leads
            </Formula>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-semibold">
                  Response-speed distribution
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">
                          Response speed
                        </th>
                        <th className="px-4 py-3 text-right">
                          Contacted
                        </th>
                        <th className="px-4 py-3 text-right">
                          Share
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analysis.engagement.speed.map(
                        (row) => (
                          <tr key={row.key}>
                            <td className="px-4 py-3 font-medium">
                              {row.label}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">
                              {row.contacted}
                            </td>
                            <td className="px-4 py-3">
                              {rateBar(
                                ratioForRow(
                                  row.contacted,
                                  analysis.engagement
                                    .contacted,
                                ),
                              )}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold">
                  First-touch channel
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">
                          Channel
                        </th>
                        <th className="px-4 py-3 text-right">
                          Contacted
                        </th>
                        <th className="px-4 py-3 text-right">
                          Responded
                        </th>
                        <th className="px-4 py-3 text-right">
                          Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analysis.engagement.channels.map(
                        (row) => (
                          <tr key={row.channel}>
                            <td className="px-4 py-3 font-medium capitalize">
                              {row.channel}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">
                              {row.contacted}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">
                              {row.responded}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {percent(
                                row.responseRate,
                              )}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </SectionPanel>
        </section>

        <section
          id="progression"
          className="scroll-mt-20 space-y-4"
        >
          <SectionPanel
            title="4. Progression — are leads moving forward?"
            description="Appointment and sales measures are evidence populations. They are not presented as a proven sequential funnel."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                label="Appointment evidence"
                value={String(
                  analysis.progression
                    .appointmentEvidence,
                )}
                detail={`${percent(
                  analysis.progression
                    .appointmentRateOfContacted,
                )} of contacted`}
              />
              <MetricCard
                label="Appt. rate of contacted"
                value={percent(
                  analysis.progression
                    .appointmentRateOfContacted,
                )}
                detail="Appointment evidence ÷ contacted"
              />
              <MetricCard
                label="Appt. rate of responders"
                value={percent(
                  analysis.progression
                    .appointmentRateOfResponded,
                )}
                detail="Appointment evidence ÷ responded"
              />
              <MetricCard
                label="Sold / Closed"
                value={String(
                  analysis.progression
                    .soldClosed,
                )}
                detail={`${percent(
                  analysis.progression
                    .soldClosedRateOfAll,
                )} of all leads`}
              />
              <MetricCard
                label="Outcome without timeline"
                value={String(
                  analysis.progression
                    .soldClosedWithoutTimeline,
                )}
                detail="Known state, missing behavioral evidence"
              />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <EvidenceBox
                title="Appointment evidence"
                value={numberWithRate(
                  analysis.progression
                    .appointmentEvidence,
                  analysis.contact.contacted,
                  analysis.progression
                    .appointmentRateOfContacted,
                )}
                description="Primary rate uses contacted leads as the denominator."
              />
              <EvidenceBox
                title="Sold / Closed"
                value={numberWithRate(
                  analysis.progression
                    .soldClosed,
                  analysis.acquisition.leads,
                  analysis.progression
                    .soldClosedRateOfAll,
                )}
                description="Primary rate uses all canonical leads."
              />
              <EvidenceBox
                title="Sales evidence coverage"
                value={`${analysis.progression.soldClosedWithTimeline} with timeline / ${analysis.progression.soldClosed} Sold or Closed`}
                description="A known outcome does not imply that contact behavior is observable."
              />
            </div>

            <Formula>
              Appointment rate among contacted = leads with appointment
              evidence ÷ contacted leads
            </Formula>
            <Formula>
              Sold/Closed rate = current Sold or Closed leads ÷ total leads
            </Formula>
          </SectionPanel>
        </section>

        <section
          id="sources"
          className="scroll-mt-20 space-y-4"
        >
          <SectionPanel
            title="5. Sources — which lead sources appear different?"
            description="Counts and rates are shown together. Source comparisons are descriptive/associational and should not be interpreted as causal rankings, especially for small populations."
          >
            {highlights.strongest ? (
              <div className="mb-6 grid gap-4 lg:grid-cols-2">
                <InsightBox
                  title="Highest observed response rate"
                  source={highlights.strongest.source}
                  detail={`${percent(
                    highlights.strongest
                      .responseRate,
                  )} response rate among ${highlights.strongest.contacted} contacted leads`}
                />
                <InsightBox
                  title="Lowest observed response rate"
                  source={highlights.weakest?.source ?? "—"}
                  detail={
                    highlights.weakest
                      ? `${percent(
                          highlights.weakest
                            .responseRate,
                        )} response rate among ${highlights.weakest.contacted} contacted leads`
                      : "No meaningful source population"
                  }
                />
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1450px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">
                      Source
                    </th>
                    <th className="px-4 py-3">
                      Group
                    </th>
                    <th className="px-4 py-3 text-right">
                      Leads
                    </th>
                    <th className="px-4 py-3 text-right">
                      Mix
                    </th>
                    <th className="px-4 py-3 text-right">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-right">
                      First contact
                    </th>
                    <th className="px-4 py-3 text-right">
                      Response
                    </th>
                    <th className="px-4 py-3 text-right">
                      24h
                    </th>
                    <th className="px-4 py-3 text-right">
                      Appointment
                    </th>
                    <th className="px-4 py-3 text-right">
                      Sold / Closed
                    </th>
                    <th className="px-4 py-3 text-right">
                      Timeline
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {analysis.sources.map(
                    (row) => (
                      <tr key={row.source}>
                        <td className="px-4 py-3 font-medium">
                          {row.source}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {row.sourceGroup}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {row.leads}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {percent(
                            row.mixRate,
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {percent(
                            row.contactRate,
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {minutes(
                            row.medianFirstContactMinutes,
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {percent(
                            row.responseRate,
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {percent(
                            row.responseWithin24hRate,
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {percent(
                            row.appointmentRate,
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {percent(
                            row.soldClosedRate,
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {percent(
                            row.timelineCoverageRate,
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-400">
              Response rate uses contacted leads as its denominator.
              Appointment rate uses contacted leads. Sold/Closed rate uses
              all leads. Timeline coverage uses all leads.
            </p>
          </SectionPanel>
        </section>

        <section
          id="trends"
          className="scroll-mt-20 space-y-4"
        >
          <SectionPanel
            title="6. Trends — is performance changing?"
            description="Monthly cohorts are based on lead creation month. Rates use the same denominators as the corresponding management metrics."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">
                      Month
                    </th>
                    <th className="px-4 py-3 text-right">
                      Leads
                    </th>
                    <th className="px-4 py-3 text-right">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-right">
                      Response
                    </th>
                    <th className="px-4 py-3 text-right">
                      Appointment
                    </th>
                    <th className="px-4 py-3 text-right">
                      Sold / Closed
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {analysis.trends.map(
                    (row) => (
                      <tr key={row.month}>
                        <td className="px-4 py-3 font-medium">
                          {row.label}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {row.leads}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {percent(
                            row.contactRate,
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {percent(
                            row.responseRate,
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {percent(
                            row.appointmentRate,
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {percent(
                            row.soldClosedRate,
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 space-y-3">
              {analysis.trends.map(
                (row) => (
                  <div
                    key={`${row.month}-bar`}
                    className="grid grid-cols-[80px_1fr_60px] items-center gap-3 text-xs"
                  >
                    <span className="text-slate-500">
                      {row.label}
                    </span>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-800"
                        style={{
                          width: `${
                            (row.leads /
                              maxTrendLeads) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-right tabular-nums">
                      {row.leads}
                    </span>
                  </div>
                ),
              )}
            </div>
          </SectionPanel>
        </section>

        <section
          id="investigation"
          className="scroll-mt-20 space-y-4"
        >
          <SectionPanel
            title="7. Investigation — show me the evidence"
            description="The table exposes the lead-level populations behind the headline metrics. Missing evidence is shown explicitly instead of being converted to zero."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1450px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">
                      Lead
                    </th>
                    <th className="px-4 py-3">
                      Source
                    </th>
                    <th className="px-4 py-3">
                      Created
                    </th>
                    <th className="px-4 py-3">
                      Timeline
                    </th>
                    <th className="px-4 py-3">
                      First contact
                    </th>
                    <th className="px-4 py-3">
                      Response
                    </th>
                    <th className="px-4 py-3">
                      Progression
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {analysis.investigation
                    .slice(0, 75)
                    .map((row) => (
                      <tr
                        key={row.leadId}
                      >
                        <td className="px-4 py-4 align-top">
                          <Link
                            href={`/leads/${row.leadId}`}
                            className="font-medium text-slate-950 hover:underline"
                          >
                            {row.contactName}
                          </Link>
                          <p className="mt-1 text-xs text-slate-400">
                            {row.stage}
                          </p>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <p className="font-medium">
                            {row.source}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {row.sourceGroup}
                          </p>
                        </td>

                        <td className="px-4 py-4 align-top text-xs text-slate-500">
                          {formatDate(
                            row.createdAt,
                          )}
                        </td>

                        <td className="px-4 py-4 align-top">
                          {row.timelineCovered
                            ? "Covered"
                            : "Missing"}
                        </td>

                        <td className="px-4 py-4 align-top">
                          <p className="font-medium capitalize">
                            {row.firstContactChannel ??
                              "Not observed"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {minutes(
                              row.firstContactMinutes,
                            )}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(
                              row.firstContactAt,
                            )}
                          </p>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <p className="font-medium">
                            {minutes(
                              row.responseMinutes,
                            )}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(
                              row.responseAt,
                            )}
                          </p>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <p>
                            Appointment:{" "}
                            <span className="font-medium">
                              {row.appointmentEvidence
                                ? "Observed"
                                : "No evidence"}
                            </span>
                          </p>
                          <p className="mt-1">
                            Sold / Closed:{" "}
                            <span className="font-medium">
                              {row.soldClosed
                                ? "Observed"
                                : "No"}
                            </span>
                          </p>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {analysis.investigation
              .length > 75 ? (
              <p className="mt-4 text-xs text-slate-400">
                Showing the first 75 investigation rows. The analytical
                engine contains all {analysis.investigation.length} leads.
              </p>
            ) : null}
          </SectionPanel>
        </section>

        <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <h2 className="font-semibold">
            What these results can — and cannot — tell us
          </h2>

          <div className="mt-4 grid gap-5 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold">
                Strong evidence
              </p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                <li>
                  • How many Internet leads we received.
                </li>
                <li>
                  • Whether qualifying outbound communication was observed.
                </li>
                <li>
                  • How quickly observed first contact occurred when timestamps permit it.
                </li>
                <li>
                  • Whether a subsequent inbound response was observed.
                </li>
                <li>
                  • How response and appointment evidence vary across observed populations.
                </li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold">
                Association, not causation
              </p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                <li>
                  • Faster contact and higher response can be compared, but speed does not prove causation.
                </li>
                <li>
                  • Source performance can be compared, but the data does not establish source quality as a causal effect.
                </li>
                <li>
                  • Current Sold/Closed state is outcome evidence, not a complete sales-history model.
                </li>
                <li>
                  • Missing timeline records mean some known outcomes cannot be connected to behavioral evidence.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function SummaryItem({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function Formula({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
      <span className="font-semibold text-slate-700">
        Calculation:
      </span>{" "}
      {children}
    </p>
  );
}

function EvidenceBox({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <p className="text-sm font-semibold">
        {title}
      </p>
      <p className="mt-2 text-xl font-semibold">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function InsightBox({
  title,
  source,
  detail,
}: {
  title: string;
  source: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-lg font-semibold">
        {source}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function ratioForRow(
  numerator: number,
  denominator: number,
): number | null {
  return denominator === 0
    ? null
    : numerator / denominator;
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}
