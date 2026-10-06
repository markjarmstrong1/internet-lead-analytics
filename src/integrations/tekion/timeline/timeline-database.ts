import type {
  PersistedTimelineEvent,
  PersistedTimelineRecord,
} from "@/integrations/import/reconcile-timeline-import";
import type {
  PersistedSourceImport,
  SourceImportPersistenceRow,
} from "@/integrations/import/source-import";
import type {
  TimelineEventPersistenceRow,
  TimelineRecordPersistenceRow,
} from "./timeline-persistence-row";
import type { LeadPersistenceRow } from "@/integrations/tekion/lead/lead-persistence-row";
import type { SourceRecordPersistenceRow } from "@/integrations/import/source-record-persistence-row";

export type TimelineDatabase = {
  public: {
    Tables: {
      leads: {
        Row: LeadPersistenceRow & {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: LeadPersistenceRow & Record<string, unknown>;
        Update: Partial<LeadPersistenceRow> & Record<string, unknown>;
        Relationships: [];
      };

      templates: {
        Row: {
          id: string;
          name: string;
          template_code: string;
          is_active: boolean;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };

      source_imports: {
        Row: PersistedSourceImport;
        Insert: SourceImportPersistenceRow &
          Record<string, unknown>;
        Update: Partial<
          SourceImportPersistenceRow & {
            error_message: string | null;
          }
        > &
          Record<string, unknown>;
        Relationships: [];
      };

      timeline_records: {
        Row: PersistedTimelineRecord &
          Record<string, unknown> & {
            import_id: string | null;
            created_at: string;
            updated_at: string;
          };
        Insert: TimelineRecordPersistenceRow &
          Record<string, unknown>;
        Update: Partial<TimelineRecordPersistenceRow> &
          Record<string, unknown>;
        Relationships: [];
      };
      source_records: {
        Row: SourceRecordPersistenceRow & {
          id: string;
          import_id: string | null;
          processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: SourceRecordPersistenceRow & Record<string, unknown>;
        Update: Partial<SourceRecordPersistenceRow> &
          Record<string, unknown>;
        Relationships: [];
      };
      timeline_events: {
        Row: PersistedTimelineEvent &
          Record<string, unknown> & {
            template_code: string | null;
            created_at: string;
            updated_at: string;
          };
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
      apply_tekion_import_batch: {
        Args: {
          p_import_id: string;
          lead_rows: Record<string, unknown>[];
          source_record_rows: Record<string, unknown>[];
          timeline_record_operations: Record<string, unknown>[];
          timeline_event_operations: Record<string, unknown>[];
        };
        Returns: null;
      };
    };

    Enums: {
      [_ in never]: never;
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
