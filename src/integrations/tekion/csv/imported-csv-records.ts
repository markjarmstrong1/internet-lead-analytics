import type { ImportedCsvFile } from "@/integrations/import/import-batch";

export type ImportedCsvRecord = Record<string, string>;

export function importedCsvRecords(
  file: ImportedCsvFile,
): ImportedCsvRecord[] {
  return file.rows.map((values) => {
    const record: ImportedCsvRecord = {};

    for (let index = 0; index < file.headers.length; index += 1) {
      const header = file.headers[index];

      if (!header) {
        continue;
      }

      record[header] = values[index] ?? "";
    }

    return record;
  });
}

export function getTekionCsvType(
  file: ImportedCsvFile,
): "lead" | "task" | "unknown" {
  const headers = new Set(file.headers);

  if (headers.has("Lead ID")) {
    return "lead";
  }

  if (
    headers.has("Task Title") &&
    headers.has("Associated with")
  ) {
    return "task";
  }

  return "unknown";
}