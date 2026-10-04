import {
  EvidenceState,
} from "@/components/app/evidence-state";
import { SectionPanel } from "@/components/app/section-panel";

import type {
  LeadTimelineEvent,
} from "@/integrations/tekion/lead/lead-detail-repository";

import {
  formatDateTime,
} from "@/integrations/tekion/lead/lead-detail-view-model";

type LeadDetailTimelineProps = {
  events: LeadTimelineEvent[];
};

function eventMeta(
  event: LeadTimelineEvent,
): string {
  return [
    event.category,
    event.actor,
    event.actor_type,
    event.channel,
    event.direction,
  ]
    .filter(Boolean)
    .join(" · ");
}

function eventKey(
  event: LeadTimelineEvent,
): string {
  return `${event.timeline_record_id}:${event.source_event_id}:${event.id}`;
}

export function LeadDetailTimeline({
  events,
}: LeadDetailTimelineProps) {
  return (
    <SectionPanel
      title="Timeline evidence"
      description="Chronological observed events linked to the canonical lead."
    >
      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-700">
                No timeline evidence is currently linked.
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                This means the application does not currently have
                imported timeline events that it can associate with this
                canonical lead. It does not mean that no activity
                occurred.
              </p>
            </div>

            <EvidenceState kind="missing" />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <article
              key={eventKey(event)}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">
                      {event.raw_type || "Timeline event"}
                    </p>

                    <EvidenceState kind="observed" />
                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    {eventMeta(event) || "Observed event"}
                  </p>
                </div>

                <time
                  dateTime={event.occurred_at}
                  className="shrink-0 text-xs text-slate-400"
                >
                  {formatDateTime(event.occurred_at)}
                </time>
              </div>

              {event.details ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {event.details}
                </p>
              ) : (
                <p className="mt-3 text-sm italic text-slate-400">
                  No event details were preserved.
                </p>
              )}

              {event.source_file ? (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-400">
                    Source:{" "}
                    <span className="break-all">
                      {event.source_file}
                    </span>
                  </p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </SectionPanel>
  );
}
