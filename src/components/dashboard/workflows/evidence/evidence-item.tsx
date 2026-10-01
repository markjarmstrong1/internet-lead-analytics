import type { TaskWorkflowEvidenceDetail } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-evidence-detail";

type EvidenceItemProps = {
  evidence: TaskWorkflowEvidenceDetail;
};

function labelForStatus(status: string) {
  switch (status) {
    case "qualifying_outbound":
      return "Qualifying outbound";
    case "outbound_channel_mismatch":
      return "Outbound channel mismatch";
    case "inbound_only":
      return "Inbound only";
    case "no_communication_evidence":
      return "No communication evidence";
    case "window_unavailable":
      return "Window unavailable";
    case "window_invalid":
      return "Window invalid";
    case "not_evaluated":
      return "Not evaluated";
    default:
      return status;
  }
}

export function EvidenceItem({
  evidence,
}: EvidenceItemProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {labelForStatus(
              evidence.communicationEvidenceStatus,
            )}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {evidence.timelineSourceFile}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
            {evidence.completionMode.replaceAll("_", " ")}
          </span>

          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
            {evidence.identityStatus.replaceAll("_", " ")}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Allowed channels
          </p>

          <p className="mt-1 text-sm text-slate-700">
            {evidence.allowedChannels.length > 0
              ? evidence.allowedChannels.join(", ")
              : "None recorded"}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Observed events
          </p>

          <p className="mt-1 text-sm tabular-nums text-slate-700">
            {evidence.events.length.toLocaleString()}
          </p>
        </div>
      </div>

      {evidence.events.length > 0 ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Timeline evidence
          </p>

          <div className="mt-2 space-y-2">
            {evidence.events.map((event) => (
              <div
                key={event.sourceEventId}
                className="flex items-start justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {event.rawType}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {event.actor}
                    {event.communicationChannel
                      ? ` · ${event.communicationChannel}`
                      : ""}
                    {event.communicationDirection
                      ? ` · ${event.communicationDirection}`
                      : ""}
                  </p>
                </div>

                <time className="shrink-0 text-xs tabular-nums text-slate-500">
                  {event.occurredAt}
                </time>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
