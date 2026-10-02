export type TimelineRecordPersistenceRow = {
  source_system: "tekion";
  lead_id: string | null;
  source_type: "timeline";
  external_record_id: string | null;
  fixture_source_key: string | null;
  source_file: string | null;
  raw_data: Record<string, unknown>;

  /**
   * Derived during import.
   *
   * This is not a database column. The atomic RPC uses it to
   * resolve the canonical public.leads.id after lead rows have
   * been inserted/upserted.
   */
  resolved_lead_external_record_id?: string | null;
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