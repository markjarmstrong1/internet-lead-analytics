export type TimelineRecordPersistenceRow = {
  source_system: "tekion";
  source_type: "timeline";
  external_record_id: string | null;
  fixture_source_key: string | null;
  source_file: string | null;
  raw_data: Record<string, unknown>;
};

export type TimelineEventPersistenceRow = {
  source_event_id: string;
  source_file: string | null;
  occurred_at: string;
  raw_type: string;
  actor: string;
  actor_type: string;
  category: string;
  channel: string | null;
  direction: string | null;
  details: string;
  metadata: Record<string, unknown>;
  raw_data: Record<string, unknown>;
};
