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
  "checkin",
  "Check-in",
  "Check-out",
  "Viewed Concierge",
  "Concierge Shared",
]);

function isEventType(line: string): boolean {
  return EVENT_TYPES.has(line.trim());
}

function findNextEventStart(lines: string[], start: number): number {
  for (let index = start; index < lines.length; index += 1) {
    if (isEventType(lines[index])) {
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
  const actor = lines[start + 1];
  const occurredAt = parseOccurredAt(lines[start + 2]);
  const details = lines.slice(start + 3, end).join("\n");

  if (!actor) {
    throw new Error(`Malformed Tekion timeline event: ${rawType}`);
  }

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
    if (!isEventType(lines[current])) {
      current += 1;
      continue;
    }

    const next = findNextEventStart(lines, current + 1);

    events.push(parseEventBlock(lines, current, next, sourceFile));

    current = next;
  }

  return events;
}
