export type SourceRecordPersistenceRow = {
  source_system: "tekion";
  source_type: "task" | "lead";
  source_record_id: string;
  raw_data: Record<string, unknown>;
};
