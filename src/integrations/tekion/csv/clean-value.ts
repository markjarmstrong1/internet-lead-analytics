export function cleanValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}