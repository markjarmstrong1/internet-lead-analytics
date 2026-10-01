import type { TaskCommunicationEvidenceStatus } from "@/integrations/tekion/timeline/task-evidence/task-completion-evidence";

type EvidenceStatusProps = {
  status: TaskCommunicationEvidenceStatus;
};

const STATUS_COPY: Record<
  TaskCommunicationEvidenceStatus,
  {
    label: string;
    description: string;
    className: string;
  }
> = {
  qualifying_outbound: {
    label: "Qualifying outbound",
    description: "Observed outbound employee communication matched an allowed channel.",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  outbound_channel_mismatch: {
    label: "Channel mismatch",
    description: "Outbound communication was observed, but its channel was not allowed by the Task.",
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  inbound_only: {
    label: "Inbound only",
    description: "Communication was observed from the customer, with no qualifying outbound employee communication.",
    className: "bg-sky-50 text-sky-700 ring-sky-600/20",
  },
  no_communication_evidence: {
    label: "No communication evidence",
    description: "No qualifying communication event was observed in the available Task window.",
    className: "bg-slate-100 text-slate-600 ring-slate-500/20",
  },
  window_unavailable: {
    label: "Window unavailable",
    description: "The available Task dates do not provide a bounded evidence window.",
    className: "bg-slate-100 text-slate-600 ring-slate-500/20",
  },
  window_invalid: {
    label: "Window invalid",
    description: "The available Task dates do not form a valid evidence window.",
    className: "bg-rose-50 text-rose-700 ring-rose-600/20",
  },
  not_evaluated: {
    label: "Not evaluated",
    description: "Communication evidence was not evaluated for this comparison.",
    className: "bg-slate-100 text-slate-500 ring-slate-500/20",
  },
};

export function EvidenceStatus({
  status,
}: EvidenceStatusProps) {
  const copy = STATUS_COPY[status];

  return (
    <div className="space-y-1">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${copy.className}`}
      >
        {copy.label}
      </span>

      <p className="text-xs leading-5 text-slate-500">
        {copy.description}
      </p>
    </div>
  );
}
