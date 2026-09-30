export type TekionSourceRecord = {
  sourceSystem: "tekion";
  sourceType: "lead" | "task";
  sourceRecordId: string;
  rawData: Record<string, unknown>;
};