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

      timeline_events: {
        Row: PersistedTimelineEvent &
          Record<string, unknown> & {
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
      apply_timeline_import: {
        Args: {
          import_id: string;
          record_operations: Record<string, unknown>[];
          event_operations: Record<string, unknown>[];
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
