type AnalysisBreakdownRow = {
  key: string;
  label: string;
  numerator: number;
  denominator: number;
  rate: number | null;
};

type AnalysisBreakdownProps = {
  rows: AnalysisBreakdownRow[];
};

function formatRate(rate: number | null) {
  if (rate === null) {
    return "—";
  }

  return `${Math.round(rate * 100)}%`;
}

export function AnalysisBreakdown({ rows }: AnalysisBreakdownProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-sm font-medium text-slate-950">Breakdown</p>
        <p className="mt-1 text-xs text-slate-500">
          Compare the populations that contribute to the analysis.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
            <tr>
              <th className="px-5 py-3">Dimension</th>
              <th className="px-5 py-3 text-right">Responses</th>
              <th className="px-5 py-3 text-right">Exposures</th>
              <th className="px-5 py-3 text-right">Rate</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="px-5 py-3 font-medium text-slate-700">
                  {row.label}
                </td>
                <td className="px-5 py-3 text-right text-slate-600">
                  {row.numerator}
                </td>
                <td className="px-5 py-3 text-right text-slate-600">
                  {row.denominator}
                </td>
                <td className="px-5 py-3 text-right font-medium text-slate-700">
                  {formatRate(row.rate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
