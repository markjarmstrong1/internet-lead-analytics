export type TekionSourceObservation = {
  sourceSystem: "tekion";
  sourceType: "lead" | "task";
  sourceRecordId: string;
  rawData: Record<string, unknown>;
};

export type TekionImportBatch = {
  sourceSystem: "tekion";
  importType: "leads" | "tasks";
  fileName: string;
  observations: TekionSourceObservation[];
};