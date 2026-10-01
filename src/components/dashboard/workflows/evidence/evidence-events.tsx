import type { TaskWorkflowEvidenceDetail } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-evidence-detail";

type EvidenceEventsProps = {
  events: TaskWorkflowEvidenceDetail["events"];
};

function formatTimestamp(value: string): string {
  const timestamp = new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    return value;
  }

  return timestamp.toLocaleString();
}

export function EvidenceEvents({
  events,
}: EvidenceEventsProps) {
  const orderedEvents = [...events].sort(
    (left, right) =>
      new Date(left.occurredAt).getTime() -
      new Date(right.occurredAt).getTime(),
  );

  if (orderedEvents.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No underlying timeline events are available for this evidence item.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {orderedEvents.map((event) => (
        <article
          key={event.sourceEventId}
          className="rounded-lg border border-slate-200 bg-white px-4 py-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-900">
                {event.rawType}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {event.timelineSourceFile}
              </p>
            </div>

            <time
              dateTime={event.occurredAt}
              className="text-xs text-slate-500"
            >
              {formatTimestamp(event.occurredAt)}
            </time>
          </div>

          <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
            <div>
              <dt className="text-slate-400">Actor</dt>
              <dd className="mt-0.5 text-slate-700">
                {event.actor || "Unknown"}
              </dd>
            </div>

            <div>
              <dt className="text-slate-400">Channel</dt>
              <dd className="mt-0.5 text-slate-700">
                {event.communicationChannel || "Not applicable"}
              </dd>
            </div>

            <div>
              <dt className="text-slate-400">Direction</dt>
              <dd className="mt-0.5 text-slate-700">
                {event.communicationDirection || "Unknown"}
              </dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}
