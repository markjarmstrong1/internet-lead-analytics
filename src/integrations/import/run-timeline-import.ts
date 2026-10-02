import "server-only";

import type { ImportBatch } from "./import-batch";
import { buildImportPersistencePlan } from "./build-import-persistence-plan";
import { buildTimelineImportSyncPlan } from "./build-timeline-import-sync-plan";
import { createServerTimelineImportRepository } from "./create-server-timeline-import-repository";
import { executeTimelineImportSync } from "./execute-timeline-import-sync";

export async function runTimelineImport(
  batch: ImportBatch,
) {
  const persistencePlan = buildImportPersistencePlan(batch);

  const repository =
    createServerTimelineImportRepository();

  const sourceImport =
    await repository.createSourceImport({
      source_system: "tekion",
      import_type: "tekion_batch",
      file_name:
        [
          ...batch.timelineFiles,
          ...batch.csvFiles,
        ].length === 1
          ? [
              ...batch.timelineFiles,
              ...batch.csvFiles,
            ][0]?.fileName ?? null
          : null,
      status: "processing",
      record_count:
        persistencePlan.leads.length +
        persistencePlan.sourceRecords.length +
        persistencePlan.timelineBatches.length,
    });

  try {
    const existing = await repository.loadSnapshot();

    const syncPlan = buildTimelineImportSyncPlan(
      persistencePlan,
      existing,
    );

    const result = await executeTimelineImportSync(
      syncPlan,
      repository,
      sourceImport.id,
      persistencePlan.leads,
      persistencePlan.sourceRecords,
    );

    return {
      ...result,
      leads: {
        total: persistencePlan.leads.length,
        persisted: persistencePlan.leads.length,
      },
      sourceRecords: {
        total: persistencePlan.sourceRecords.length,
        persisted: persistencePlan.sourceRecords.length,
      },
      import: {
        id: sourceImport.id,
        status: "completed" as const,
      },
    };
  } catch (caught) {
    const message =
      caught instanceof Error
        ? caught.message
        : "The Tekion import could not be completed.";

    try {
      await repository.updateSourceImportStatus(
        sourceImport.id,
        "failed",
        message,
      );
    } catch {
      // Preserve the original import failure.
    }

    throw caught;
  }
}