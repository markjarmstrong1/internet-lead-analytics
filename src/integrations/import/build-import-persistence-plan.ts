import type { ImportBatch } from "@/components/import/import-types";
import {
  buildTimelinePersistenceBatch,
  type TimelinePersistenceBatch,
} from "@/integrations/tekion/timeline/build-timeline-persistence-rows";

export type ImportPersistencePlan = {
  timelineBatches: TimelinePersistenceBatch[];
};

export function buildImportPersistencePlan(
  batch: ImportBatch,
): ImportPersistencePlan {
  return {
    timelineBatches: batch.timelineFiles.map(
      buildTimelinePersistenceBatch,
    ),
  };
}
