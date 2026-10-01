import type { ImportedTimelineFile } from "@/integrations/import/import-batch";
import type { TekionTimelineRecord } from "./timeline-record";

export function timelineRecordFromFile(
  file: ImportedTimelineFile,
): TekionTimelineRecord {
  return {
    sourceSystem: "tekion",
    sourceType: "timeline",
    fixtureSourceKey: file.sourceKey,
    sourceFile: file.relativePath,
  };
}
