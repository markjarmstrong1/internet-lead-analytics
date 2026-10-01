import type { ImportReconciliationSummary } from "./import-reconciliation";
import type { TimelineImportSyncPlan } from "./build-timeline-import-sync-plan";
import type { TimelineImportRepository } from "./timeline-import-repository";

export type TimelineImportExecutionResult = {
  records: ImportReconciliationSummary;
  events: ImportReconciliationSummary;
};

export async function executeTimelineImportSync(
  plan: TimelineImportSyncPlan,
  repository: TimelineImportRepository,
  importId: string,
): Promise<TimelineImportExecutionResult> {
  await repository.executeAtomicImport(importId, plan);

  return {
    records: summarizeOperations(plan.records),
    events: summarizeOperations(plan.events),
  };
}

function summarizeOperations<
  T extends {
    status:
      | "new"
      | "updated"
      | "unchanged"
      | "invalid";
  },
>(operations: T[]): ImportReconciliationSummary {
  return {
    total: operations.length,
    newCount: operations.filter(
      (item) => item.status === "new",
    ).length,
    updatedCount: operations.filter(
      (item) => item.status === "updated",
    ).length,
    unchangedCount: operations.filter(
      (item) => item.status === "unchanged",
    ).length,
    invalidCount: operations.filter(
      (item) => item.status === "invalid",
    ).length,
  };
}
