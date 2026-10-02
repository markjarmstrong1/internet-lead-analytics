import { EvidenceState } from "@/components/app/evidence-state";

type AnalysisAnswerProps = {
  title: string;
  description: string;
  value?: string;
  numerator?: string;
  denominator?: string;
  windowLabel?: string;
  classification?: "descriptive" | "associational" | "causal";
  evidenceState?: "observed" | "calculated" | "inferred" | "unknown" | "missing";
};

const classificationLabels = {
  descriptive: "Descriptive",
  associational: "Associational",
  causal: "Causal",
} as const;

export function AnalysisAnswer({
  title,
  description,
  value = "—",
  numerator = "—",
  denominator = "—",
  windowLabel,
  classification = "descriptive",
  evidenceState = "unknown",
}: AnalysisAnswerProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Analysis answer
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">
            {title}
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <EvidenceState kind={evidenceState} />
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
            {classificationLabels[classification]}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 border-t border-slate-100 pt-5 sm:grid-cols-[auto_1fr] sm:items-end">
        <div>
          <p className="text-4xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
          {windowLabel ? (
            <p className="mt-2 text-xs text-slate-400">{windowLabel}</p>
          ) : null}
        </div>

        <div className="text-sm text-slate-500 sm:text-right">
          <p>
            <span className="font-medium text-slate-700">{numerator}</span>{" "}
            responses
          </p>
          <p className="mt-1">
            <span className="font-medium text-slate-700">{denominator}</span>{" "}
            exposures
          </p>
        </div>
      </div>
    </div>
  );
}
