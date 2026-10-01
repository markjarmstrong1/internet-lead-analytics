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

  const existing = await repository.loadSnapshot();

  const syncPlan = buildTimelineImportSyncPlan(
    persistencePlan,
    existing,
  );

  return executeTimelineImportSync(
    syncPlan,
    repository,
  );
}
