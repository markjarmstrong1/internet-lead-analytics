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

  if (!hasExplicitTime(trimmed)) {
    const parsed = new Date(
      `${trimmed} 00:00:00 UTC`,
    );

    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }

    if (boundary === "start") {
      return parsed.getTime();
    }

    return (
      parsed.getTime() +
      24 * 60 * 60 * 1000 -
      1
    );
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.getTime();
}

export function buildTaskCommunicationWindow(
  task: TekionTaskRecord,
): TaskCommunicationWindow {
  const start = parseBoundary(
    task.createdDate,
    "start",
  );

  const end = parseBoundary(
    task.dueDate,
    "end",
  );

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

  const eventTime = new Date(
    occurredAt,
  ).getTime();

  const startTime = new Date(
    window.startAt,
  ).getTime();

  const endTime = new Date(
    window.endAt,
  ).getTime();

  if (
    Number.isNaN(eventTime) ||
    Number.isNaN(startTime) ||
    Number.isNaN(endTime)
  ) {
    return false;
  }

  return (
    eventTime >= startTime &&
    eventTime <= endTime
  );
}
