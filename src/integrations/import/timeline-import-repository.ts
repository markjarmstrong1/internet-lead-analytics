import type {
  PersistedTimelineEvent,
  PersistedTimelineRecord,
} from "./reconcile-timeline-import";
import type {
  TimelineEventPersistenceRow,
  TimelineRecordPersistenceRow,
} from "@/integrations/tekion/timeline/timeline-persistence-row";

export type TimelineImportSnapshot = {
  records: PersistedTimelineRecord[];
  events: PersistedTimelineEvent[];
};

export interface TimelineImportRepository {
  loadSnapshot(): Promise<TimelineImportSnapshot>;

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
