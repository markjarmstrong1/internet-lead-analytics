import { EvidenceState } from "./evidence-state";

const states = [
  ["observed", "Directly supported by source evidence."],
  ["calculated", "Produced by a defined calculation."],
  ["inferred", "Derived from evidence using a documented rule."],
  ["unknown", "The available evidence does not establish the value."],
  ["missing", "Required evidence is unavailable."],
] as const;

export function EvidenceLegend() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <p className="text-sm font-medium">Evidence states</p>
        <p className="mt-1 text-xs text-slate-500">
          These labels distinguish what the system knows from how it derived it.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {states.map(([kind, description]) => (
          <div key={kind} className="space-y-2">
            <EvidenceState kind={kind} />
            <p className="text-xs leading-5 text-slate-500">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
