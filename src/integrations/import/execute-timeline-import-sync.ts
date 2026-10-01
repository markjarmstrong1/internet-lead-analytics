import type { ImportReconciliationSummary } from "./import-reconciliation";
import type { TimelineImportSyncPlan } from "./build-timeline-import-sync-plan";
import { getTimelineRecordPersistenceIdentity } from "./timeline-persistence-identity";
import type { TimelineImportRepository } from "./timeline-import-repository";

export type TimelineImportExecutionResult = {
  records: ImportReconciliationSummary;
  events: ImportReconciliationSummary;
};

export async function executeTimelineImportSync(
  plan: TimelineImportSyncPlan,
  repository: TimelineImportRepository,
): Promise<TimelineImportExecutionResult> {
  const recordIdsByIdentity = new Map<string, string>();

  for (const operation of plan.records) {
    if (operation.status === "invalid") {
      continue;
    }

    const identity = getTimelineRecordPersistenceIdentity(
      operation.incoming,
    );

    if (!identity) {
      throw new Error(
        "Cannot execute timeline record without an identity.",
      );
    }

    if (operation.status === "new") {
      const persisted = await repository.insertRecord(
        operation.incoming,
      );

      recordIdsByIdentity.set(identity, persisted.id);
      continue;
    }

    if (!operation.existing) {
      throw new Error(
        `Cannot execute ${operation.status} timeline record without an existing record.`,
      );
    }

    if (operation.status === "updated") {
      const persisted = await repository.updateRecord(
        operation.existing.id,
        operation.incoming,
      );

      recordIdsByIdentity.set(identity, persisted.id);
      continue;
    }

    recordIdsByIdentity.set(identity, operation.existing.id);
  }

  for (const operation of plan.events) {
    if (operation.status === "invalid") {
      continue;
    }

    const timelineRecordId = recordIdsByIdentity.get(
      operation.recordIdentity,
    );

    if (!timelineRecordId) {
      throw new Error(
        `Cannot execute timeline event ${operation.incoming.source_event_id} without a persisted timeline record.`,
      );
    }

    if (operation.status === "new") {
      await repository.insertEvent(
        timelineRecordId,
        operation.incoming,
      );

      continue;
    }

    if (!operation.existing) {
      throw new Error(
        `Cannot execute ${operation.status} timeline event without an existing event.`,
      );
    }

    if (operation.status === "updated") {
      await repository.updateEvent(
        operation.existing.id,
        timelineRecordId,
        operation.incoming,
      );
    }
  }

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
