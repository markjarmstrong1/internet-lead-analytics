import type { ImportReconciliationSummary } from "./import-reconciliation";
import type { TimelineImportSyncPlan } from "./build-timeline-import-sync-plan";
import type { TimelineImportRepository } from "./timeline-import-repository";
import type { LeadPersistenceRow } from "@/integrations/tekion/lead/lead-persistence-row";
import type { SourceRecordPersistenceRow } from "./source-record-persistence-row";

export type TimelineImportExecutionResult = {
  records: ImportReconciliationSummary;
  events: ImportReconciliationSummary;
  leads: {
    total: number;
    persisted: number;
  };
  sourceRecords: {
    total: number;
    persisted: number;
  };
};

export async function executeTimelineImportSync(
  plan: TimelineImportSyncPlan,
  repository: TimelineImportRepository,
  importId: string,
  leads: LeadPersistenceRow[],
  sourceRecords: SourceRecordPersistenceRow[],
): Promise<TimelineImportExecutionResult> {
  await repository.executeAtomicImport(
    importId,
    plan,
    leads,
    sourceRecords,
  );

  return {
    records: summarizeOperations(plan.records),
    events: summarizeOperations(plan.events),
    leads: {
      total: leads.length,
      persisted: leads.length,
    },
    sourceRecords: {
      total: sourceRecords.length,
      persisted: sourceRecords.length,
    },
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