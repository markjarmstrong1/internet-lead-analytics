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
import type { TimelineLeadIdentity } from "@/integrations/tekion/lead/resolve-timeline-lead";

import type { TimelineLeadIdentitySnapshot } from "./timeline-import-repository";

export type ImportPersistencePlan = {
  timelineBatches: TimelinePersistenceBatch[];
  leads: LeadPersistenceRow[];
  sourceRecords: SourceRecordPersistenceRow[];
};

export function buildImportPersistencePlan(
  batch: ImportBatch,
  existingLeads: TimelineLeadIdentitySnapshot[] = [],
): ImportPersistencePlan {
  const leads = buildLeadPersistenceRows(
    batch.csvFiles,
  );

  /*
   * Incoming CSV leads are authoritative for this import.
   *
   * Deduplicate by Tekion external_record_id so that an incoming
   * lead does not create two candidate identities when the same
   * lead already exists in the database snapshot.
   */
  const leadIdentitiesByExternalId =
    new Map<string, TimelineLeadIdentity>();

  for (const lead of existingLeads) {
    leadIdentitiesByExternalId.set(
      lead.externalRecordId,
      {
        externalRecordId: lead.externalRecordId,
        contactName: lead.contactName,
      },
    );
  }

  for (const lead of leads) {
    leadIdentitiesByExternalId.set(
      lead.external_record_id,
      {
        externalRecordId:
          lead.external_record_id,
        contactName: lead.contact_name,
      },
    );
  }

  const leadIdentities = Array.from(
    leadIdentitiesByExternalId.values(),
  );

  return {
    timelineBatches: batch.timelineFiles.map(
      (file) =>
        buildTimelinePersistenceBatch(
          file,
          leadIdentities,
        ),
    ),

    leads,

    sourceRecords:
      buildSourceRecordRows(batch.csvFiles),
  };
}