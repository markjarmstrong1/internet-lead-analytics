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
      import_type: "timeline",
      file_name:
        batch.timelineFiles.length === 1
          ? batch.timelineFiles[0]?.fileName ?? null
          : null,
      status: "processing",
      record_count: persistencePlan.timelineBatches.length,
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
    );

    return {
      ...result,
      import: {
        id: sourceImport.id,
        status: "completed" as const,
      },
    };
  } catch (caught) {
    const message =
      caught instanceof Error
        ? caught.message
        : "The timeline import could not be completed.";

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
