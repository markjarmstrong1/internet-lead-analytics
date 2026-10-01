import {
  reconcileTimelineImport,
  type PersistedTimelineEvent,
  type PersistedTimelineRecord,
} from "./reconcile-timeline-import";
import {
  getTimelineRecordPersistenceIdentity,
} from "./timeline-persistence-identity";
import type { ImportPersistencePlan } from "./build-import-persistence-plan";
import type {
  TimelineEventPersistenceRow,
  TimelineRecordPersistenceRow,
} from "@/integrations/tekion/timeline/timeline-persistence-row";

export type TimelineRecordSyncOperation = {
  status: "new" | "updated" | "unchanged" | "invalid";
  incoming: TimelineRecordPersistenceRow;
  existing?: PersistedTimelineRecord;
};

export type TimelineEventSyncOperation = {
  status: "new" | "updated" | "unchanged" | "invalid";
  recordIdentity: string;
  incoming: TimelineEventPersistenceRow;
  existing?: PersistedTimelineEvent;
};

export type TimelineImportSyncPlan = {
  records: TimelineRecordSyncOperation[];
  events: TimelineEventSyncOperation[];
};

export function buildTimelineImportSyncPlan(
  persistencePlan: ImportPersistencePlan,
  existing: {
    records: PersistedTimelineRecord[];
    events: PersistedTimelineEvent[];
  },
): TimelineImportSyncPlan {
  const incomingRecords = persistencePlan.timelineBatches.map(
    (batch) => batch.record,
  );

  const incomingEvents = persistencePlan.timelineBatches.flatMap((batch) => {
    const recordIdentity = getTimelineRecordPersistenceIdentity(batch.record);

    return recordIdentity
      ? batch.events.map((event) => ({
          recordIdentity,
          event,
        }))
      : [];
  });

  const reconciliation = reconcileTimelineImport(
    incomingRecords,
    existing.records,
    incomingEvents,
    existing.events,
  );

  return {
    records: reconciliation.records.items.map((item) => ({
      status: item.status,
      incoming: item.incoming,
      existing: item.existing,
    })),
    events: reconciliation.events.items.map((item) => ({
      status: item.status,
      recordIdentity: item.recordIdentity,
      incoming: item.incoming,
      existing: item.existing,
    })),
  };
}
