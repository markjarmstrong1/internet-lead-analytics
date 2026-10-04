import {
  EvidenceState,
} from "@/components/app/evidence-state";
import { SectionPanel } from "@/components/app/section-panel";
import { StatPlaceholder } from "@/components/app/stat-placeholder";

import type {
  LeadDetail,
} from "@/integrations/tekion/lead/lead-detail-repository";

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
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-900">
        {value || "—"}
      </p>
    </div>
  );
}

function joinVehicle(
  lead: LeadDetail,
): string | null {
  const value = [
    lead.vehicle_year,
    lead.vehicle_make,
    lead.vehicle_model,
  ]
    .filter(Boolean)
    .join(" ");

  return value || null;
}

function getOutcomeEvidence(
  lead: LeadDetail,
): {
  value: string;
  detail: string;
  state: "observed" | "missing";
} {
  if (lead.sold_date) {
    return {
      value: formatDate(lead.sold_date),
      detail: "Sold date recorded on the canonical lead.",
      state: "observed",
    };
  }

  return {
    value: "—",
    detail:
      "No sold date is recorded; this does not prove that no sale occurred.",
    state: "missing",
  };
}

export function LeadDetailSummary({
  lead,
  model,
}: LeadDetailSummaryProps) {
  const salesperson =
    getRawString(lead.raw_data, "salesperson");

  const bdcRepresentative =
    getRawString(
      lead.raw_data,
      "bdc_representative",
    );

  const tradeIn =
    getRawString(lead.raw_data, "trade_in");

  const outcome = getOutcomeEvidence(lead);

  return (
    <div className="space-y-8">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.8fr)]">
        <SectionPanel
          title="Customer and lead"
          description="Source fields from the canonical lead record."
        >
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
            <Field
              label="Customer"
              value={lead.contact_name}
            />

            <Field
              label="External lead ID"
              value={lead.external_record_id}
            />

            <Field
              label="Source"
              value={lead.source}
            />

            <Field
              label="Source group"
              value={lead.lead_source_group}
            />

            <Field
              label="Created"
              value={formatDateTime(
                lead.creation_time,
              )}
            />

            <Field
              label="Email"
              value={lead.email}
            />

            <Field
              label="Mobile phone"
              value={lead.mobile_phone}
            />

            <Field
              label="Home phone"
              value={lead.home_phone}
            />

            <Field
              label="Work phone"
              value={lead.work_phone}
            />

            <Field
              label="Status"
              value={lead.status}
            />

            <Field
              label="Stage"
              value={lead.stage}
            />

            <Field
              label="Deal status"
              value={lead.deal_status}
            />

            <Field
              label="Vehicle"
              value={joinVehicle(lead)}
            />

            <Field
              label="Vehicle interest"
              value={lead.vehicle_interest}
            />

            <Field
              label="Department"
              value={lead.department}
            />

            <Field
              label="Dealership"
              value={lead.dealership}
            />

            <Field
              label="Salesperson"
              value={salesperson}
            />

            <Field
              label="BDC representative"
              value={bdcRepresentative}
            />

            <Field
              label="Trade-in"
              value={tradeIn}
            />
          </div>
        </SectionPanel>

        <SectionPanel
          title="Evidence coverage"
          description="What evidence is actually available for this lead."
        >
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    Timeline evidence
                  </p>

                  <p className="mt-1 text-2xl font-semibold">
                    {model.events.length}
                  </p>
                </div>

                <EvidenceState kind="observed" />
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                {model.timelineRecordCount} linked timeline{" "}
                {model.timelineRecordCount === 1
                  ? "record"
                  : "records"}{" "}
                contain observed events.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    Communication
                  </p>

                  <p className="mt-1 text-2xl font-semibold">
                    {model.communicationEvents.length}
                  </p>
                </div>

                <EvidenceState kind="observed" />
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                {model.inboundEvents.length} inbound ·{" "}
                {model.outboundEvents.length} outbound
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    Appointment references
                  </p>

                  <p className="mt-1 text-2xl font-semibold">
                    {model.appointmentReferenceEvents.length}
                  </p>
                </div>

                <EvidenceState kind="calculated" />
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Timeline events whose observed text references an
                appointment or “appt.”. This is not an appointment
                record.
              </p>
            </div>

            {model.sourceFiles.length > 0 ? (
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-sm font-medium">
                  Timeline source
                </p>

                <div className="mt-2 space-y-1">
                  {model.sourceFiles.map((sourceFile) => (
                    <p
                      key={sourceFile}
                      className="break-all text-xs text-slate-500"
                    >
                      {sourceFile}
                    </p>
                  ))}
                </div>

                <div className="mt-3">
                  <EvidenceState kind="observed" />
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-slate-700">
                    Timeline source
                  </p>

                  <EvidenceState kind="missing" />
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  No linked timeline source is currently available.
                </p>
              </div>
            )}
          </div>
        </SectionPanel>
      </div>

      <SectionPanel
        title="Observed communication"
        description="Communication metrics use timeline events explicitly classified as communication."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatPlaceholder
            label="First outbound"
            value={formatDateTime(
              model.firstOutbound?.occurred_at ?? null,
            )}
            detail={
              model.firstOutbound
                ? getCommunicationLabel(
                    model.firstOutbound,
                  )
                : "No observed outbound communication."
            }
          />

          <StatPlaceholder
            label="Last inbound"
            value={formatDateTime(
              model.lastInbound?.occurred_at ?? null,
            )}
            detail={
              model.lastInbound
                ? getCommunicationLabel(
                    model.lastInbound,
                  )
                : "No observed inbound communication."
            }
          />

          <StatPlaceholder
            label="Last outbound"
            value={formatDateTime(
              model.lastOutbound?.occurred_at ?? null,
            )}
            detail={
              model.lastOutbound
                ? getCommunicationLabel(
                    model.lastOutbound,
                  )
                : "No observed outbound communication."
            }
          />

          <StatPlaceholder
            label="Communication events"
            value={String(
              model.communicationEvents.length,
            )}
            detail={`${model.inboundEvents.length} inbound · ${model.outboundEvents.length} outbound`}
          />
        </div>
      </SectionPanel>

      <SectionPanel
        title="Outcome evidence"
        description="Outcome fields are shown as source evidence, not as assumptions about customer behavior."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  Sold date
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {outcome.value}
                </p>
              </div>

              <EvidenceState kind={outcome.state} />
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              {outcome.detail}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  Closed time
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {formatDateTime(lead.closed_time)}
                </p>
              </div>

              <EvidenceState
                kind={
                  lead.closed_time
                    ? "observed"
                    : "missing"
                }
              />
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Recorded closed timestamp on the canonical lead.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  Deal status
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {lead.deal_status || "—"}
                </p>
              </div>

              <EvidenceState kind="observed" />
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Source-system classification; not independently treated
              as customer behavior.
            </p>
          </div>
        </div>
      </SectionPanel>
    </div>
  );
}
