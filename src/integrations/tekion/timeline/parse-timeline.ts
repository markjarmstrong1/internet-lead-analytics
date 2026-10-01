import type { TekionTimelineEvent } from "./timeline-event";

const EVENT_TYPES = new Set([
  "Conversica Message",
  "Conversica Lead Response",
  "Note",
  "Outbound Voicemail",
  "Email Sent",
  "Email Received",
  "Text Sent",
  "Text Received",
  "Stage Changed",
  "Status Changed",
  "Salesperson Assigned",
  "Salesperson 2 Assigned",
  "Sales Manager Assigned",
  "Primary Vehicle Interest Updated",
  "Vehicle Interest Added",
  "Trade-in Updated",
  "Trade-in Added",
  "Deal Sheet",
  "Deal Created",
  "Outbound Call",
  "Inbound Call",
  "Call Back",
  "Engaged Lead Follow Up",
  "Customer Comments",
  "Customer Comment",
  "checkin",
  "Check-in",
  "Check-out",
  "Viewed Concierge",
  "Concierge Shared",
  "Lead Created",
  "Missed Call",
  "Call Attempt",
  "Sent Campaign Email",
  "Deal Updated",
  "BDC Specialist Assigned",
  "Completed",
  "Price Change - Reduced",
  "Day 1 Internet Lead Tasking - Call",
  "Day 2 Internet Lead Tasking - Call",
  "Day 3 Internet Lead Tasking - Call",
  "Day 5 Internet Lead Tasking - Touch",
  "Day 7 Internet Lead Tasking - Touch",
  "Day 11 Internet Lead Tasking - Touch",
  "Day 15 Internet Lead Tasking - Touch",
  "Day 19 Internet Lead Tasking - Touch",
  "Day 23 Internet Lead Tasking - Touch",
  "New Internet Lead - Immediate Follow Up Email",
  "New Internet Lead - Immediate Follow Up Text",
  "New Internet Lead - Immediate Follow Up Call",
]);

function isEventType(line: string): boolean {
  return EVENT_TYPES.has(line.trim());
}

function isTimestamp(line: string): boolean {
  const parsed = new Date(line);
  return !Number.isNaN(parsed.getTime());
}

function findTimestampIndex(
  lines: string[],
  start: number,
  end: number,
): number {
  for (
    let index = start + 1;
    index < Math.min(end, start + 6);
    index += 1
  ) {
    if (isEventType(lines[index])) {
      return -1;
    }

    if (isTimestamp(lines[index])) {
      return index;
    }
  }

  return -1;
}

function isEventStart(lines: string[], index: number): boolean {
  if (!isEventType(lines[index])) {
    return false;
  }

  const timestampIndex = findTimestampIndex(lines, index, lines.length);

  return timestampIndex > index + 1;
}

function findNextEventStart(lines: string[], start: number): number {
  for (let index = start; index < lines.length; index += 1) {
    if (isEventStart(lines, index)) {
      return index;
    }
  }

  return lines.length;
}

function cleanLines(content: string): string[] {
  return content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function parseOccurredAt(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid Tekion timeline timestamp: ${value}`);
  }

  return parsed.toISOString();
}

function parseEventBlock(
  lines: string[],
  start: number,
  end: number,
  sourceFile: string,
): TekionTimelineEvent {
  const rawType = lines[start];
  const timestampIndex = findTimestampIndex(lines, start, end);

  if (timestampIndex === -1 || timestampIndex === start + 1) {
    throw new Error(`Malformed Tekion timeline event: ${rawType}`);
  }

  const actor = lines[timestampIndex - 1];
  const occurredAt = parseOccurredAt(lines[timestampIndex]);
  const headerDetails = lines.slice(start + 1, timestampIndex - 1);
  const bodyDetails = lines.slice(timestampIndex + 1, end);
  const details = [...headerDetails, ...bodyDetails].join("\n");

  return {
    sourceFile,
    rawType,
    occurredAt,
    actor,
    details,
    category: "other",
  };
}

export function parseTimeline(
  content: string,
  sourceFile: string,
): TekionTimelineEvent[] {
  const lines = cleanLines(content);
  const events: TekionTimelineEvent[] = [];

  let current = 0;

  while (current < lines.length) {
    if (!isEventStart(lines, current)) {
      current += 1;
      continue;
    }

    const next = findNextEventStart(lines, current + 1);

    events.push(parseEventBlock(lines, current, next, sourceFile));

    current = next;
  }

  return events;
}
