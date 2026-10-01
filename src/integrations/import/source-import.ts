export type SourceImportStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type SourceImportPersistenceRow = {
  source_system: string;
  import_type: string;
  file_name: string | null;
  status: SourceImportStatus;
  record_count: number;
};

export type PersistedSourceImport =
  SourceImportPersistenceRow & {
    id: string;
    imported_at: string;
    error_message: string | null;
    created_at: string;
    updated_at: string;
  };
