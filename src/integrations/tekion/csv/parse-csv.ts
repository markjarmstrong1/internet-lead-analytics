import { parse } from "csv-parse/sync";

export function parseCsv(content: string): Record<string, unknown>[] {
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });
}