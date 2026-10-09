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

const IMPORT_SNAPSHOT_PAGE_SIZE = 500;

async function loadAllSnapshotPages<T>(
  loadPage: (
    from: number,
    to: number,
  ) => Promise<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
  errorPrefix: string,
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await loadPage(
      from,
      from + IMPORT_SNAPSHOT_PAGE_SIZE - 1,
    );

    if (error) {
      throw new Error(`${errorPrefix}: ${error.message}`);
    }

    const page = data ?? [];
    rows.push(...page);

    if (page.length < IMPORT_SNAPSHOT_PAGE_SIZE) {
      return rows;
    }

    from += IMPORT_SNAPSHOT_PAGE_SIZE;
  }
}

export class SupabaseTimelineImportRepository
  implements TimelineImportRepository
{
  constructor(
    private readonly client: SupabaseClient<TimelineDatabase>,
  ) {}

  async loadSnapshot() {
    const [records, events, leads] = await Promise.all([
      loadAllSnapshotPages(
        async (from, to) =>
          await this.client
            .from("timeline_records")
            .select("*")
            .order("created_at", { ascending: true })
            .order("id", { ascending: true })
            .range(from, to),
        "Failed to load timeline records",
      ),
      loadAllSnapshotPages(
        async (from, to) =>
          await this.client
            .from("timeline_events")
            .select("*")
            .order("occurred_at", { ascending: true })
            .order("id", { ascending: true })
            .range(from, to),
        "Failed to load timeline events",
      ),
      loadAllSnapshotPages(
        async (from, to) =>
          await this.client
            .from("leads")
            .select("external_record_id, contact_name")
            .order("created_at", { ascending: true })
            .order("id", { ascending: true })
            .range(from, to),
        "Failed to load leads",
      ),
    ]);

    return {
      records,
      events,
      leads: leads.map((lead) => ({
        externalRecordId: lead.external_record_id,
        contactName: lead.contact_name,
      })),
    };
  }

  async createSourceImport(
    sourceImport: SourceImportPersistenceRow,
  ): Promise<PersistedSourceImport> {
    const { data, error } =
      await this.client
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
    const { data, error } =
      await this.client
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
    const { error } =
      await this.client.rpc(
        "apply_tekion_import_batch",
        {
          p_import_id: importId,
          lead_rows: leads,
          source_record_rows:
            sourceRecords,
          timeline_record_operations:
            plan.records,
          timeline_event_operations:
            plan.events,
        },
      );

    if (error) {
      throw new Error(
        `Failed to persist Tekion import ${importId}: ${error.message}`,
      );
    }
  }
}