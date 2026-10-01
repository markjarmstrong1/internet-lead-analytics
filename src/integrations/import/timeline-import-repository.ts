import type {
  PersistedTimelineEvent,
  PersistedTimelineRecord,
} from "./reconcile-timeline-import";
import type { TimelineImportSyncPlan } from "./build-timeline-import-sync-plan";
import type {
  PersistedSourceImport,
  SourceImportPersistenceRow,
  SourceImportStatus,
} from "./source-import";

export type TimelineImportSnapshot = {
  records: PersistedTimelineRecord[];
  events: PersistedTimelineEvent[];
};

export interface TimelineImportRepository {
  loadSnapshot(): Promise<TimelineImportSnapshot>;

  createSourceImport(
    sourceImport: SourceImportPersistenceRow,
  ): Promise<PersistedSourceImport>;

  updateSourceImportStatus(
    id: string,
    status: SourceImportStatus,
    errorMessage?: string | null,
  ): Promise<PersistedSourceImport>;

  executeAtomicImport(
    importId: string,
    plan: TimelineImportSyncPlan,
  ): Promise<void>;


}
