import { EvidenceState } from "@/components/app/evidence-state";
import { SectionPanel } from "@/components/app/section-panel";

import type { LeadDetail } from "@/integrations/tekion/lead/lead-detail-repository";

import {
  type LeadDetailViewModel,
  formatDate,
  formatDateTime,
  getCommunicationLabel,
  getRawString,
} from "@/integrations/tekion/lead/lead-detail-view-model";

type LeadDetailSummaryProps = {
  lead: LeadDetail;
  model: LeadDetailViewModel;
};

type FieldProps = {
  label: string;
  value: string | null | undefined;
};

function Field({ label, value }: FieldProps) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium">
        {value || "—"}
      </p>
    </div>
  );
}

function joinVehicle(lead: LeadDetail): string | null {
  const value = [
    lead.vehicle_year,
    lead.vehicle_make,
    lead.vehicle_model,
  ]
    .filter(Boolean)
    .join(" ");

  return value || null;
}

function StatusBadge({
  value,
}: {
  value: string | null | undefined;
}) {
  if (!value) {
    return (
      <span className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        Unknown
      </span>
    );
  }

  const normalized = value.toLowerCase();

  const tone =
    normalized.includes("sold") || normalized.includes("active")
      ? "border-[var(--success)]/25 bg-[var(--success-soft)] text-[var(--success)]"
      : normalized.includes("lost") ||
          normalized.includes("dead") ||
          normalized.includes("inactive")
        ? "border-[var(--danger)]/25 bg-[var(--danger-soft)] text-[var(--danger)]"
        : "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted-strong)]";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${tone}`}
    >
      {value}
    </span>
  );
}

function Method({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[9px] border bg-[var(--surface-muted)] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium">{label}</p>
        <EvidenceState kind="observed" />
      </div>

      <p className="mt-2 text-2xl font-semibold tabular-nums">
        {value}
      </p>

      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
        {detail}
      </p>
    </div>
  );
}

function AnalyticsCard({
  label,
  value,
  detail,
  state = "observed",
}: {
  label: string;
  value: string;
  detail: string;
  state?: "observed" | "calculated" | "missing";
}) {
  return (
    <div className="rounded-[9px] border p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium">{label}</p>
        <EvidenceState kind={state} />
      </div>

      <p className="mt-2 text-lg font-semibold tabular-nums">
        {value}
      </p>

      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
        {detail}
      </p>
    </div>
  );
}

export function LeadDetailSummary({
  lead,
  model,
}: LeadDetailSummaryProps) {
  const salesperson = getRawString(
    lead.raw_data,
    "salesperson",
  );

  const bdcRepresentative = getRawString(
    lead.raw_data,
    "bdc_representative",
  );

  const tradeIn = getRawString(
    lead.raw_data,
    "trade_in",
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[10px] border bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-[var(--muted)]">
            Status
          </p>
          <div className="mt-2">
            <StatusBadge value={lead.status} />
          </div>
        </div>

        <div className="rounded-[10px] border bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-[var(--muted)]">
            Stage
          </p>
          <p className="mt-2 text-sm font-semibold">
            {lead.stage || "—"}
          </p>
        </div>

        <div className="rounded-[10px] border bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-[var(--muted)]">
            Created
          </p>
          <p className="mt-2 text-sm font-semibold tabular-nums">
            {formatDate(lead.creation_time)}
          </p>
        </div>

        <div className="rounded-[10px] border bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-[var(--muted)]">
            Timeline
          </p>
          <p className="mt-2 text-sm font-semibold tabular-nums">
            {model.events.length} events
          </p>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
        <SectionPanel
          title="Customer and lead"
          description="Canonical information currently available for this lead."
        >
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="Customer" value={lead.contact_name} />
            <Field label="Source" value={lead.source} />
            <Field label="Created" value={formatDateTime(lead.creation_time)} />
            <Field label="Email" value={lead.email} />
            <Field label="Mobile phone" value={lead.mobile_phone} />
            <Field label="Deal status" value={lead.deal_status} />
            <Field label="Vehicle" value={joinVehicle(lead)} />
            <Field label="Vehicle interest" value={lead.vehicle_interest} />
            <Field label="Salesperson" value={salesperson} />
            <Field label="BDC representative" value={bdcRepresentative} />
            <Field label="Trade-in" value={tradeIn} />
            <Field label="Department" value={lead.department} />
            <Field label="Dealership" value={lead.dealership} />
          </div>

          <div className="mt-5 border-t pt-4">
            <p className="text-[11px] text-[var(--muted)]">
              Lead ID: {lead.external_record_id}
            </p>
          </div>
        </SectionPanel>

        <SectionPanel
          title="Observed activity"
          description="Activity counts derived from the imported timeline."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Method
              label="Communication"
              value={String(model.communicationEvents.length)}
              detail={`${model.inboundEvents.length} inbound · ${model.outboundEvents.length} outbound`}
            />

            <Method
              label="Appointments"
              value={String(model.appointmentReferenceEvents.length)}
              detail="Timeline references only; not appointment records."
            />

            <Method
              label="Timeline events"
              value={String(model.events.length)}
              detail={`${model.timelineRecordCount} linked timeline ${model.timelineRecordCount === 1 ? "record" : "records"}`}
            />
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}

LeadDetailSummary.Analytics = function LeadDetailAnalytics({
  lead,
  model,
}: LeadDetailSummaryProps) {
  const soldDate = lead.sold_date
    ? formatDate(lead.sold_date)
    : "—";

  return (
    <SectionPanel
      title="Evidence summary"
      description="Signals available from this lead's imported history."
    >
      <div className="space-y-3">
        <AnalyticsCard
          label="First outbound"
          value={formatDateTime(model.firstOutbound?.occurred_at ?? null)}
          detail={
            model.firstOutbound
              ? getCommunicationLabel(model.firstOutbound)
              : "No observed outbound communication."
          }
        />

        <AnalyticsCard
          label="Last inbound"
          value={formatDateTime(model.lastInbound?.occurred_at ?? null)}
          detail={
            model.lastInbound
              ? getCommunicationLabel(model.lastInbound)
              : "No observed inbound communication."
          }
        />

        <AnalyticsCard
          label="Last outbound"
          value={formatDateTime(model.lastOutbound?.occurred_at ?? null)}
          detail={
            model.lastOutbound
              ? getCommunicationLabel(model.lastOutbound)
              : "No observed outbound communication."
          }
        />

        <AnalyticsCard
          label="Sold date"
          value={soldDate}
          detail={
            lead.sold_date
              ? "Sold date recorded on the canonical lead."
              : "No sold date is recorded; this does not prove no sale occurred."
          }
          state={lead.sold_date ? "observed" : "missing"}
        />

        <AnalyticsCard
          label="Closed time"
          value={formatDateTime(lead.closed_time)}
          detail="Recorded closed timestamp on the canonical lead."
          state={lead.closed_time ? "observed" : "missing"}
        />

        <div className="rounded-[9px] border p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium">Timeline source</p>
            <EvidenceState
              kind={model.sourceFiles.length > 0 ? "observed" : "missing"}
            />
          </div>

          {model.sourceFiles.length > 0 ? (
            <div className="mt-2 space-y-1">
              {model.sourceFiles.map((sourceFile) => (
                <p
                  key={sourceFile}
                  className="break-all text-xs leading-5 text-[var(--muted)]"
                >
                  {sourceFile}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
              No linked timeline source is currently available.
            </p>
          )}
        </div>
      </div>
    </SectionPanel>
  );
};
