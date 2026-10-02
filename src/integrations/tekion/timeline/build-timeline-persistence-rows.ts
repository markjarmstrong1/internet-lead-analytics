import type { ImportedTimelineFile } from "@/integrations/import/import-batch";
import { timelineRecordFromFile } from "./timeline-record-from-file";
import { resolveTimelineLead } from "@/integrations/tekion/lead/resolve-timeline-lead";
import type { LeadPersistenceRow } from "@/integrations/tekion/lead/lead-persistence-row";
import type {
  TimelineEventPersistenceRow,
  TimelineRecordPersistenceRow,
} from "./timeline-persistence-row";

export type TimelinePersistenceBatch = {
  record: TimelineRecordPersistenceRow;
  events: TimelineEventPersistenceRow[];
};

export function buildTimelinePersistenceBatch(
  file: ImportedTimelineFile,
  leads: Array<LeadPersistenceRow & { id?: string }>,
): TimelinePersistenceBatch {
  const record = timelineRecordFromFile(file);

  const resolution = resolveTimelineLead(
    file.relativePath || file.fileName,
    leads.filter((lead): lead is LeadPersistenceRow & { id: string } =>
      typeof lead.id === "string",
    ),
  );

  return {
    record: {
      source_system: record.sourceSystem,
      lead_id: resolution.leadId,
      source_type: record.sourceType,
      external_record_id: record.externalRecordId ?? null,
      fixture_source_key: record.fixtureSourceKey ?? null,
      source_file: record.sourceFile ?? null,
      raw_data: {
        sourceKey: file.sourceKey,
        fileName: file.fileName,
        relativePath: file.relativePath,
        eventCount: file.events.length,
        leadResolution: {
          status: resolution.status,
          leadId: resolution.leadId,
        },
      },
    },

    events: file.events.map((event) => ({
      source_event_id: event.sourceEventId,
      source_file: event.sourceFile || null,
      occurred_at: event.occurredAt,
      raw_type: event.rawType,
      actor: event.actor,
      actor_type: event.actorType,
      category: event.category,
      channel: event.communicationChannel ?? null,
      direction: event.communicationDirection ?? null,
      details: event.details,
      metadata: {
        communicationChannel:
          event.communicationChannel ?? null,
        communicationDirection:
          event.communicationDirection ?? null,
        actorType: event.actorType,
      },
      raw_data: {
        sourceEventId: event.sourceEventId,
        sourceFile: event.sourceFile,
        rawType: event.rawType,
        occurredAt: event.occurredAt,
        actor: event.actor,
        details: event.details,
        category: event.category,
        communicationChannel:
          event.communicationChannel ?? null,
        communicationDirection:
          event.communicationDirection ?? null,
        actorType: event.actorType,
      },
    })),
  };
}