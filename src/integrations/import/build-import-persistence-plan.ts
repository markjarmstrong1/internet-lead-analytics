import type { ImportBatch } from "./import-batch";
import {
  buildLeadPersistenceRows,
  buildSourceRecordRows,
} from "@/integrations/tekion/import/build-csv-persistence-rows";
import {
  buildTimelinePersistenceBatch,
  type TimelinePersistenceBatch,
} from "@/integrations/tekion/timeline/build-timeline-persistence-rows";
import type { LeadPersistenceRow } from "@/integrations/tekion/lead/lead-persistence-row";
import type { SourceRecordPersistenceRow } from "./source-record-persistence-row";

export type ImportPersistencePlan = {
  timelineBatches: TimelinePersistenceBatch[];
  leads: LeadPersistenceRow[];
  sourceRecords: SourceRecordPersistenceRow[];
};

export function buildImportPersistencePlan(batch: ImportBatch): ImportPersistencePlan {
  return {
    timelineBatches: batch.timelineFiles.map(buildTimelinePersistenceBatch),
    leads: buildLeadPersistenceRows(batch.csvFiles),
    sourceRecords: buildSourceRecordRows(batch.csvFiles),
  };
}
