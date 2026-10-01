import type { SupabaseClient } from "@supabase/supabase-js";

import type { TimelineImportRepository } from "./timeline-import-repository";
import type { TimelineImportSyncPlan } from "./build-timeline-import-sync-plan";
import type {
  PersistedSourceImport,
  SourceImportPersistenceRow,
  SourceImportStatus,
} from "./source-import";
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
  ): Promise<void> {
    const { error } = await this.client.rpc(
      "apply_timeline_import",
      {
        import_id: importId,
        record_operations: plan.records,
        event_operations: plan.events,
      },
    );

    if (error) {
      throw new Error(
        `Failed to persist timeline import ${importId}: ${error.message}`,
      );
    }
  }


}
