import type { TekionTaskRecord } from "../../csv/task-record";

export type TaskCommunicationWindowStatus =
  | "bounded"
  | "unavailable"
  | "invalid";

export type TaskCommunicationWindow = {
  status: TaskCommunicationWindowStatus;
  startAt?: string;
  endAt?: string;
};

function hasExplicitTime(value: string): boolean {
  return /(?:T|\s)\d{1,2}:\d{2}/.test(value.trim());
}

function parseBoundary(
  value: string,
  boundary: "start" | "end",
): number | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  if (hasExplicitTime(trimmed)) {
    return parsed.getTime();
  }

  const date = new Date(parsed);

  if (boundary === "start") {
    date.setHours(0, 0, 0, 0);
  } else {
    date.setHours(23, 59, 59, 999);
  }

  return date.getTime();
}

export function buildTaskCommunicationWindow(
  task: TekionTaskRecord,
): TaskCommunicationWindow {
  const start = parseBoundary(task.createdDate, "start");
  const end = parseBoundary(task.dueDate, "end");

  if (start === undefined || end === undefined) {
    return {
      status: "unavailable",
    };
  }

  if (end < start) {
    return {
      status: "invalid",
    };
  }

  return {
    status: "bounded",
    startAt: new Date(start).toISOString(),
    endAt: new Date(end).toISOString(),
  };
}

export function isEventWithinTaskWindow(
  occurredAt: string,
  window: TaskCommunicationWindow,
): boolean {
  if (
    window.status !== "bounded" ||
    !window.startAt ||
    !window.endAt
  ) {
    return false;
  }

  const eventTime = new Date(occurredAt).getTime();
  const startTime = new Date(window.startAt).getTime();
  const endTime = new Date(window.endAt).getTime();

  if (
    Number.isNaN(eventTime) ||
    Number.isNaN(startTime) ||
    Number.isNaN(endTime)
  ) {
    return false;
  }

  return eventTime >= startTime && eventTime <= endTime;
}
