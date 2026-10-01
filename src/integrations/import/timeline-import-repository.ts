import type {
  PersistedTimelineEvent,
  PersistedTimelineRecord,
} from "./reconcile-timeline-import";
import type { TimelineImportSyncPlan } from "./build-timeline-import-sync-plan";
import type {
  TimelineEventPersistenceRow,
  TimelineRecordPersistenceRow,
} from "@/integrations/tekion/timeline/timeline-persistence-row";
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

  insertRecord(
    record: TimelineRecordPersistenceRow,
  ): Promise<PersistedTimelineRecord>;

  updateRecord(
    id: string,
    record: TimelineRecordPersistenceRow,
  ): Promise<PersistedTimelineRecord>;

  insertEvent(
    timelineRecordId: string,
    event: TimelineEventPersistenceRow,
  ): Promise<PersistedTimelineEvent>;

  updateEvent(
    id: string,
    timelineRecordId: string,
    event: TimelineEventPersistenceRow,
  ): Promise<PersistedTimelineEvent>;
}
