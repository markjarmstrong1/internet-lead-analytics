import type { TekionTimelineRecord } from "./timeline-record";

export function getTimelineRecordIdentity(
  record: TekionTimelineRecord,
): string | null {
  if (record.externalRecordId?.trim()) {
    return [
      record.sourceSystem,
      record.sourceType,
      "external",
      record.externalRecordId.trim(),
    ].join(":");
  }

  if (record.fixtureSourceKey?.trim()) {
    return [
      record.sourceSystem,
      record.sourceType,
      "fixture",
      record.fixtureSourceKey.trim(),
    ].join(":");
  }

  return null;
}
