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
import type { PersistedLead } from "./timeline-import-repository";

export type ImportPersistencePlan = {
  timelineBatches: TimelinePersistenceBatch[];
  leads: LeadPersistenceRow[];
  sourceRecords: SourceRecordPersistenceRow[];
};

export function buildImportPersistencePlan(
  batch: ImportBatch,
  existingLeads: PersistedLead[] = [],
): ImportPersistencePlan {
  const leads = buildLeadPersistenceRows(batch.csvFiles);

  const leadIdentities = [
    ...existingLeads,
    ...leads.map((lead) => ({
      ...lead,
      id: "",
    })),
  ];

  return {
    timelineBatches: batch.timelineFiles.map((file) =>
      buildTimelinePersistenceBatch(
        file,
        leadIdentities,
      ),
    ),
    leads,
    sourceRecords: buildSourceRecordRows(batch.csvFiles),
  };
}