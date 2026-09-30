export type SourceImportStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type TekionSourceImport = {
  sourceSystem: "tekion";
  importType: "leads" | "tasks";
  fileName: string;
  status: SourceImportStatus;
  recordCount: number;
  errorMessage?: string;
};