import type { DashboardAnalysis } from "@/analytics/metrics/dashboard";

function pct(value: number | null) {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

export function AnalyticsPerformance({
  analysis,
}: {
  analysis: DashboardAnalysis;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel
        title="Contact speed"
        description="How quickly leads receive a first qualifying employee outbound."
      >
        <Bars
          rows={analysis.contact.contactSpeed.map((row) => ({
            label: row.label,
            value: row.contacted,
            detail: pct(row.rate),
          }))}
        />
      </Panel>

      <Panel
        title="Response speed"
        description="How quickly contacted leads produce an observed inbound response."
      >
        <Bars
          rows={analysis.engagement.speed.map((row) => ({
            label: row.label,
            value: row.responded,
            detail: pct(row.responseRate),
          }))}
        />
      </Panel>

      <Panel
        title="First-touch channel"
        description="Observed response differences by first outbound channel."
      >
        <div className="divide-y divide-slate-100">
          {analysis.engagement.channels.map((row) => (
            <div
              key={row.channel}
              className="flex items-center gap-4 py-3"
            >
              <div className="w-24 shrink-0 text-sm font-medium capitalize">
                {row.channel}
              </div>

              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-800"
                  style={{
                    width: `${
                      (row.contacted /
                        Math.max(
                          analysis.engagement.contacted,
                          1,
                        )) *
                      100
                    }%`,
                  }}
                />
              </div>

              <div className="w-28 text-right text-xs tabular-nums text-slate-500">
                {row.contacted} · {pct(row.responseRate)}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Progression evidence"
        description="Appointment and outcome evidence shown as independent populations."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Evidence
            label="Appointment evidence"
            value={analysis.progression.appointmentEvidence}
            rate={pct(
              analysis.progression.appointmentRateOfContacted,
            )}
          />

          <Evidence
            label="Sold / Closed"
            value={analysis.progression.soldClosed}
            rate={pct(
              analysis.progression.soldClosedRateOfAll,
            )}
          />

          <Evidence
            label="Sold / Closed with timeline"
            value={analysis.progression.soldClosedWithTimeline}
            rate={pct(
              analysis.progression.soldClosedRateOfAll,
            )}
          />

          <Evidence
            label="Sold / Closed without timeline"
            value={analysis.progression.soldClosedWithoutTimeline}
            rate="—"
          />
        </div>
      </Panel>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-base font-semibold">{title}</h2>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function Bars({
  rows,
}: {
  rows: Array<{
    label: string;
    value: number;
    detail: string;
  }>;
}) {
  const max = Math.max(
    ...rows.map((row) => row.value),
    1,
  );

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-[110px_minmax(0,1fr)_72px] items-center gap-3"
        >
          <span className="truncate text-xs font-medium text-slate-600">
            {row.label}
          </span>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-800"
              style={{
                width: `${(row.value / max) * 100}%`,
              }}
            />
          </div>

          <span className="text-right text-xs tabular-nums text-slate-500">
            {row.value} · {row.detail}
          </span>
        </div>
      ))}
    </div>
  );
}

function Evidence({
  label,
  value,
  rate,
}: {
  label: string;
  value: number;
  rate: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-xs text-slate-500">{label}</p>

      <div className="mt-1 flex items-end justify-between gap-3">
        <span className="text-2xl font-semibold tabular-nums">
          {value}
        </span>

        <span className="text-xs font-medium text-slate-500">
          {rate}
        </span>
      </div>
    </div>
  );
}
