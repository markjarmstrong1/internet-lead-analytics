const TIMELINE_LEAD_ALIASES: Record<string, string> = {
  "jeffery_becker.txt": "6aacb48d7e39321adc5ede87",
  "david_lovo.docx": "6ac01918ef9ba81a6c09a32b",
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
