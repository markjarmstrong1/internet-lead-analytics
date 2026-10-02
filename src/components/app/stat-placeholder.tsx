import { EvidenceState } from "./evidence-state";
import { MetricCard } from "./metric-card";

type StatPlaceholderProps = {
  label: string;
  value?: string;
  detail?: string;
};

export function StatPlaceholder({
  label,
  value = "—",
  detail = "Data will populate here.",
}: StatPlaceholderProps) {
  return (
    <MetricCard
      label={label}
      value={value}
      detail={detail}
      state={<EvidenceState kind="unknown" />}
    />
  );
}
