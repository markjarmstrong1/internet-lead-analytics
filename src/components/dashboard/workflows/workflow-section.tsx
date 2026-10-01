import type { TaskWorkflowReportItem } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report";
import { WorkflowTable } from "./workflow-table";

type WorkflowSectionProps = {
  workflows: TaskWorkflowReportItem[];
};

export function WorkflowSection({
  workflows,
}: WorkflowSectionProps) {
  return (
    <section aria-labelledby="workflow-heading">
      <div className="mb-4">
        <h2
          id="workflow-heading"
          className="text-lg font-semibold text-slate-950"
        >
          Workflow evidence
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Select a workflow to investigate the evidence behind its metrics.
        </p>
      </div>

      <WorkflowTable workflows={workflows} />
    </section>
  );
}
