import type { TekionNormalizedTimelineEvent } from "@/integrations/tekion/timeline/normalized-timeline-event";

export type ImportedTimelineFile = {
  fileName: string;
  events: TekionNormalizedTimelineEvent[];
};

export type ImportedCsvFile = {
  fileName: string;
  headers: string[];
  rows: string[][];
};

export type ImportBatch = {
  timelineFiles: ImportedTimelineFile[];
  csvFiles: ImportedCsvFile[];
};
