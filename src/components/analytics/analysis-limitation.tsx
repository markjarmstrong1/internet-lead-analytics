type AnalysisLimitationProps = {
  children: React.ReactNode;
};

export function AnalysisLimitation({
  children,
}: AnalysisLimitationProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
        Limitation
      </p>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
        {children}
      </p>
    </div>
  );
}
