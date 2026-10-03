const TIMELINE_LEAD_ALIASES: Record<string, string> = {
  "jeffery_becker.txt": "6aacb48d7e39321adc5ede87",
};

export function getTimelineLeadAlias(
  timelineSourceFile: string,
): string | null {
  const fileName = timelineSourceFile
    .split("/")
    .pop()
    ?.toLowerCase();

  if (!fileName) {
    return null;
  }

  return TIMELINE_LEAD_ALIASES[fileName] ?? null;
}
