import type {
  TimelineEventPersistenceRow,
  TimelineRecordPersistenceRow,
} from "@/integrations/tekion/timeline/timeline-persistence-row";

export function getTimelineRecordPersistenceIdentity(
  record: TimelineRecordPersistenceRow,
): string | null {
  if (record.external_record_id?.trim()) {
    return [
      record.source_system,
      record.source_type,
      "external",
      record.external_record_id.trim(),
    ].join(":");
  }

  if (record.fixture_source_key?.trim()) {
    return [
      record.source_system,
      record.source_type,
      "fixture",
      record.fixture_source_key.trim(),
    ].join(":");
  }

  return null;
}

export function getTimelineEventPersistenceIdentity(
  event: TimelineEventPersistenceRow,
): string | null {
  const sourceEventId = event.source_event_id.trim();

  return sourceEventId || null;
}
