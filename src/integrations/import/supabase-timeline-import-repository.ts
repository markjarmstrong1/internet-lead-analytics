import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  PersistedTimelineEvent,
  PersistedTimelineRecord,
} from "./reconcile-timeline-import";
import type { TimelineImportRepository } from "./timeline-import-repository";
import type {
  TimelineEventPersistenceRow,
  TimelineRecordPersistenceRow,
} from "@/integrations/tekion/timeline/timeline-persistence-row";

type TimelineDatabase = {
  public: {
    Tables: {
      timeline_records: {
        Row: PersistedTimelineRecord & Record<string, unknown>;
        Insert: TimelineRecordPersistenceRow & Record<string, unknown>;
        Update: Partial<TimelineRecordPersistenceRow> & Record<string, unknown>;
        Relationships: [];
      };
      timeline_events: {
        Row: PersistedTimelineEvent & Record<string, unknown>;
        Insert: (TimelineEventPersistenceRow & {
          timeline_record_id: string;
        }) &
          Record<string, unknown>;
        Update: Partial<
          TimelineEventPersistenceRow & {
            timeline_record_id: string;
          }
        > &
          Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

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

  async insertRecord(
    record: TimelineRecordPersistenceRow,
  ): Promise<PersistedTimelineRecord> {
    const { data, error } = await this.client
      .from("timeline_records")
      .insert(record)
      .select("*")
      .single();

    if (error) {
      throw new Error(
        `Failed to insert timeline record: ${error.message}`,
      );
    }

    return data;
  }

  async updateRecord(
    id: string,
    record: TimelineRecordPersistenceRow,
  ): Promise<PersistedTimelineRecord> {
    const { data, error } = await this.client
      .from("timeline_records")
      .update(record)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(
        `Failed to update timeline record ${id}: ${error.message}`,
      );
    }

    return data;
  }

  async insertEvent(
    timelineRecordId: string,
    event: TimelineEventPersistenceRow,
  ): Promise<PersistedTimelineEvent> {
    const { data, error } = await this.client
      .from("timeline_events")
      .insert({
        ...event,
        timeline_record_id: timelineRecordId,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(
        `Failed to insert timeline event: ${error.message}`,
      );
    }

    return data;
  }

  async updateEvent(
    id: string,
    timelineRecordId: string,
    event: TimelineEventPersistenceRow,
  ): Promise<PersistedTimelineEvent> {
    const { data, error } = await this.client
      .from("timeline_events")
      .update({
        ...event,
        timeline_record_id: timelineRecordId,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(
        `Failed to update timeline event ${id}: ${error.message}`,
      );
    }

    return data;
  }
}
