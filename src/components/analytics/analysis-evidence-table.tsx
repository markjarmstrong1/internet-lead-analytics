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

function formatSource(value: string | null) {
  return value ?? "Unknown source";
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
          Each row shows the normalized evidence and preserved source
          provenance used by the metric.
        </p>
      </div>

      {evidence.length === 0 ? (
        <div className="p-5 text-sm text-slate-500">
          No qualifying exposure evidence was found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
              <tr>
                <th className="px-5 py-3">Timeline record</th>
                <th className="px-5 py-3">Exposure</th>
                <th className="px-5 py-3">Exposure source</th>
                <th className="px-5 py-3">Outcome</th>
                <th className="px-5 py-3">Outcome source</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {evidence.map((item) => (
                <tr key={`${item.timelineRecordId}:${item.exposureEventId}`}>
                  <td className="px-5 py-4 align-top">
                    <p className="font-mono text-xs text-slate-600">
                      {item.timelineRecordId}
                    </p>
                  </td>

                  <td className="min-w-[300px] px-5 py-4 align-top">
                    <p className="font-medium text-slate-700">
                      {item.exposureRawType}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.exposureActor}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {item.exposureDetails || "No event details preserved."}
                    </p>
                    <p className="mt-2 whitespace-nowrap text-xs text-slate-400">
                      {formatTimestamp(item.exposureAt)}
                    </p>
                  </td>

                  <td className="min-w-[180px] px-5 py-4 align-top">
                    <p className="text-xs text-slate-600">
                      {formatSource(item.exposureSourceFile)}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-slate-400">
                      {item.exposureEventId}
                    </p>
                  </td>

                  <td className="min-w-[300px] px-5 py-4 align-top">
                    {item.outcomeEventId ? (
                      <>
                        <p className="font-medium text-slate-700">
                          {item.outcomeRawType}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.outcomeActor}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {item.outcomeDetails ||
                            "No event details preserved."}
                        </p>
                        <p className="mt-2 whitespace-nowrap text-xs text-slate-400">
                          {formatTimestamp(item.outcomeAt)}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">
                        No response event
                      </span>
                    )}
                  </td>

                  <td className="min-w-[180px] px-5 py-4 align-top">
                    {item.outcomeEventId ? (
                      <>
                        <p className="text-xs text-slate-600">
                          {formatSource(item.outcomeSourceFile)}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-slate-400">
                          {item.outcomeEventId}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">
                        —
                      </span>
                    )}
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
