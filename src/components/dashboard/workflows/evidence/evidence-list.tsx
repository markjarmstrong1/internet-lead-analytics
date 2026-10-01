import type { TaskWorkflowEvidenceDetail } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-evidence-detail";
import { EvidenceItem } from "./evidence-item";

type EvidenceListProps = {
  evidence: TaskWorkflowEvidenceDetail[];
};

export function EvidenceList({
  evidence,
}: EvidenceListProps) {
  return (
    <div className="space-y-3">
      {evidence.map((item, index) => (
        <EvidenceItem
          key={`${item.timelineSourceFile}-${item.taskSourceRecordId}-${index}`}
          evidence={item}
        />
      ))}
    </div>
  );
}
