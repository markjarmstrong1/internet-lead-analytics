import type { SupabaseClient } from "@supabase/supabase-js";

import type { TimelineImportRepository } from "./timeline-import-repository";
import type { TimelineImportSyncPlan } from "./build-timeline-import-sync-plan";
import type {
  PersistedSourceImport,
  SourceImportPersistenceRow,
  SourceImportStatus,
} from "./source-import";
import type { LeadPersistenceRow } from "@/integrations/tekion/lead/lead-persistence-row";
import type { SourceRecordPersistenceRow } from "./source-record-persistence-row";
import type { TimelineDatabase } from "@/integrations/tekion/timeline/timeline-database";

export class SupabaseTimelineImportRepository
  implements TimelineImportRepository
{
  constructor(
    private readonly client: SupabaseClient<TimelineDatabase>,
  ) {}

  async loadSnapshot() {
    const [recordsResult, eventsResult] = await Promise.all([
      this.client
        .from("timeline_records")
        .select("*")
        .order("created_at", { ascending: true }),

      this.client
        .from("timeline_events")
        .select("*")
        .order("occurred_at", { ascending: true }),
    ]);

    if (recordsResult.error) {
      throw new Error(
        `Failed to load timeline records: ${recordsResult.error.message}`,
      );
    }

    if (eventsResult.error) {
      throw new Error(
        `Failed to load timeline events: ${eventsResult.error.message}`,
      );
    }

    return {
      records: recordsResult.data,
      events: eventsResult.data,
    };
  }

  async createSourceImport(
    sourceImport: SourceImportPersistenceRow,
  ): Promise<PersistedSourceImport> {
    const { data, error } = await this.client
      .from("source_imports")
      .insert(sourceImport)
      .select("*")
      .single();

    if (error) {
      throw new Error(
        `Failed to create source import: ${error.message}`,
      );
    }

    return data;
  }

  async updateSourceImportStatus(
    id: string,
    status: SourceImportStatus,
    errorMessage: string | null = null,
  ): Promise<PersistedSourceImport> {
    const { data, error } = await this.client
      .from("source_imports")
      .update({
        status,
        error_message: errorMessage,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(
        `Failed to update source import ${id}: ${error.message}`,
      );
    }

    return data;
  }

  async executeAtomicImport(
    importId: string,
    plan: TimelineImportSyncPlan,
    leads: LeadPersistenceRow[],
    sourceRecords: SourceRecordPersistenceRow[],
  ): Promise<void> {
  const { error } = await this.client.rpc(
    "apply_tekion_import_batch",
    {
      import_id: importId,
      lead_rows: leads,
      source_record_rows: sourceRecords,
      timeline_record_operations: plan.records,
      timeline_event_operations: plan.events,
    },
  );

  if (error) {
    throw new Error(
      `Failed to persist Tekion import ${importId}: ${error.message}`,
    );
  }
  }
}
