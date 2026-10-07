"use client";

import { useEffect, useState } from "react";

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

function EventDetails({
  event,
  onClose,
}: {
  event: LeadTimelineEvent;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(
      keyboardEvent: KeyboardEvent,
    ) {
      if (keyboardEvent.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(mouseEvent) => {
        if (mouseEvent.target === mouseEvent.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-event-title"
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[12px] border bg-white shadow-2xl"
      >
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="lead-event-title"
                className="font-semibold text-slate-950"
              >
                {event.raw_type || "Timeline event"}
              </h2>

              <EvidenceState kind="observed" />
            </div>

            <p className="mt-1 text-xs text-slate-400">
              {formatDateTime(event.occurred_at)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md px-2 py-1 text-lg leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close event details"
          >
            ×
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Activity
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {event.details
                ? cleanEventDetails(event.details)
                : "No event details were preserved."}
            </p>
          </div>

          <div className="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
            <DetailField
              label="Category"
              value={event.category}
            />

            <DetailField
              label="Raw event type"
              value={event.raw_type}
            />

            <DetailField
              label="Actor"
              value={event.actor}
            />

            <DetailField
              label="Actor type"
              value={event.actor_type}
            />

            <DetailField
              label="Channel"
              value={event.channel}
            />

            <DetailField
              label="Direction"
              value={event.direction}
            />
          </div>

          <div className="border-t border-slate-100 pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Source evidence
            </p>

            <p className="mt-2 break-all text-xs leading-5 text-slate-500">
              {event.source_file || "No source file recorded."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function cleanEventDetails(
  details: string,
): string {
  return details
    .replace(/\s+Reply\s*$/i, "")
    .trim();
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm text-slate-700">
        {value || "—"}
      </p>
    </div>
  );
}

export function LeadDetailTimeline({
  events,
}: LeadDetailTimelineProps) {
  const [selectedEvent, setSelectedEvent] =
    useState<LeadTimelineEvent | null>(null);

  return (
    <>
      <SectionPanel
        title="Timeline"
        description="A chronological record of imported activity. Select an event to inspect its evidence."
      >
        {events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  No timeline evidence is currently linked.
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  This means the application does not currently have
                  imported timeline events associated with this lead.
                  It does not mean that no activity occurred.
                </p>
              </div>

              <EvidenceState kind="missing" />
            </div>
          </div>
        ) : (
          <div className="relative ml-2 divide-y divide-[var(--border)] border-l border-[var(--border)]">
            {events.map((event) => (
              <button
                key={eventKey(event)}
                type="button"
                onClick={() => setSelectedEvent(event)}
                className="group relative flex w-full items-center gap-4 px-3 py-3.5 text-left hover:bg-[var(--accent-soft)]"
              >
                <time
                  dateTime={event.occurred_at}
                  className="w-28 shrink-0 text-[11px] tabular-nums text-[var(--muted)]"
                >
                  {formatDateTime(event.occurred_at)}
                </time>

                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">
                      {event.raw_type || "Timeline event"}
                    </p>

                    <EvidenceState kind="observed" />
                  </div>

                  <p className="mt-1 truncate text-xs text-slate-400">
                    {eventMeta(event) || "Observed event"}
                  </p>
                </div>

                <span
                  aria-hidden="true"
                  className="shrink-0 text-[var(--muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--accent-strong)]"
                >
                  →
                </span>
              </button>
            ))}
          </div>
        )}
      </SectionPanel>

      {selectedEvent ? (
        <EventDetails
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      ) : null}
    </>
  );
}
