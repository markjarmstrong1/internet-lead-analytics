import type { TekionNormalizedTimelineEvent } from "@/integrations/tekion/timeline/normalized-timeline-event";

export type ImportedTimelineFile = {
  sourceKey: string;
  fileName: string;
  relativePath: string;
  events: TekionNormalizedTimelineEvent[];
};

export type ImportedCsvFile = {
  sourceKey: string;
  fileName: string;
  relativePath: string;
  headers: string[];
  rows: string[][];
};

export type ImportBatch = {
  timelineFiles: ImportedTimelineFile[];
  csvFiles: ImportedCsvFile[];
};
