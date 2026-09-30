export function normalizeName(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function nameContainsLeadName(
  taskName: string,
  leadName: string,
): boolean {
  const taskParts = normalizeName(taskName);
  const leadParts = normalizeName(leadName);

  return leadParts.every((part) => taskParts.includes(part));
}