import type { TekionNormalizedTimelineEvent } from "@/integrations/tekion/timeline/normalized-timeline-event";

type ImportEventPreviewProps = {
  events: TekionNormalizedTimelineEvent[];
};

export function ImportEventPreview({
  events,
}: ImportEventPreviewProps) {
  const orderedEvents = [...events].sort(
    (left, right) =>
      new Date(right.occurredAt).getTime() -
      new Date(left.occurredAt).getTime(),
  );

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
          Timeline preview
        </p>

        <h2 className="mt-1 text-xl font-semibold text-slate-950">
          Normalized events
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Showing the imported timeline as structured API-shaped evidence.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {orderedEvents.slice(0, 50).map((event) => (
          <article
            key={event.sourceEventId}
            className="px-6 py-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-slate-950">
                  {event.rawType}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {event.actor} · {event.category}
                </p>
              </div>

              <time className="text-sm tabular-nums text-slate-500">
                {new Date(event.occurredAt).toLocaleString()}
              </time>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge label={`Actor: ${event.actorType}`} />

              {event.communicationChannel ? (
                <Badge
                  label={`Channel: ${event.communicationChannel}`}
                />
              ) : null}

              {event.communicationDirection ? (
                <Badge
                  label={`Direction: ${event.communicationDirection}`}
                />
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {events.length > 50 ? (
        <div className="border-t border-slate-200 px-6 py-4 text-sm text-slate-500">
          Showing the first 50 of {events.length.toLocaleString()} events.
        </div>
      ) : null}

      {events.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-slate-500">
          No timeline events were detected in this file.
        </div>
      ) : null}
    </section>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
      {label}
    </span>
  );
}
