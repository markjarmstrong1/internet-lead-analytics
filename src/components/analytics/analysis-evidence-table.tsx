import type { ReportableMetricEvidence } from "@/analytics/metrics/reportable-metric";

type AnalysisEvidenceTableProps = {
  evidence: ReportableMetricEvidence[];
};

function formatTimestamp(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatEventId(value: string | null) {
  if (!value) {
    return "No response event";
  }

  return value;
}

export function AnalysisEvidenceTable({
  evidence,
}: AnalysisEvidenceTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-sm font-medium text-slate-950">
          Metric evidence
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Each row shows the normalized evidence used to calculate the metric.
        </p>
      </div>

      {evidence.length === 0 ? (
        <div className="p-5 text-sm text-slate-500">
          No qualifying exposure evidence was found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
              <tr>
                <th className="px-5 py-3">Timeline record</th>
                <th className="px-5 py-3">Exposure event</th>
                <th className="px-5 py-3">Exposure time</th>
                <th className="px-5 py-3">Outcome event</th>
                <th className="px-5 py-3">Outcome time</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {evidence.map((item) => (
                <tr key={item.exposureEventId}>
                  <td className="px-5 py-4 align-top">
                    <span className="font-mono text-xs text-slate-600">
                      {item.timelineRecordId}
                    </span>
                  </td>

                  <td className="px-5 py-4 align-top">
                    <span className="font-mono text-xs text-slate-600">
                      {item.exposureEventId}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 align-top text-xs text-slate-500">
                    {formatTimestamp(item.exposureAt)}
                  </td>

                  <td className="px-5 py-4 align-top">
                    <span
                      className={
                        item.outcomeEventId
                          ? "font-mono text-xs text-slate-600"
                          : "text-xs text-slate-400"
                      }
                    >
                      {formatEventId(item.outcomeEventId)}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 align-top text-xs text-slate-500">
                    {formatTimestamp(item.outcomeAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
