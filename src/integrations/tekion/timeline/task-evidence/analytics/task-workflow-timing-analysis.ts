import type { TekionTaskRecord } from "../../../csv/task-record";
import type { TekionNormalizedTimelineEvent } from "../../normalized-timeline-event";
import type { TaskCompletionEvidence } from "../task-completion-evidence";

export type TaskWorkflowTimingInput = {
  taskId: string;
  task: TekionTaskRecord;
  evidence: TaskCompletionEvidence;
  timelineEvents: TekionNormalizedTimelineEvent[];
};

export type TaskWorkflowTimingAnalysis = {
  taskTitle: string;
  taskCount: number;
  qualifyingTaskCount: number;
  qualifyingEventCount: number;

  minimumLagMinutes?: number;
  maximumLagMinutes?: number;
};

function parseTime(value: string): number | undefined {
  const parsed = new Date(value).getTime();

  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return parsed;
}

export function analyzeTaskWorkflowTiming(
  inputs: TaskWorkflowTimingInput[],
): TaskWorkflowTimingAnalysis[] {
  const groups = new Map<
    string,
    {
      taskIds: Set<string>;
      qualifyingTaskIds: Set<string>;
      lags: number[];
    }
  >();

  for (const input of inputs) {
    const title = input.task.taskTitle.trim();

    let group = groups.get(title);

    if (!group) {
      group = {
        taskIds: new Set<string>(),
        qualifyingTaskIds: new Set<string>(),
        lags: [],
      };

      groups.set(title, group);
    }

    group.taskIds.add(input.taskId);

    if (input.evidence.communicationEvidenceStatus !== "qualifying_outbound") {
      continue;
    }

    const createdAt = parseTime(input.task.createdDate);

    if (createdAt === undefined) {
      continue;
    }

    const eventById = new Map(
      input.timelineEvents.map((event) => [
        event.sourceEventId,
        event,
      ]),
    );

    let foundQualifyingEvent = false;

    for (const eventId of input.evidence.allowedChannelEventIds) {
      const event = eventById.get(eventId);

      if (!event) {
        continue;
      }

      const occurredAt = parseTime(event.occurredAt);

      if (occurredAt === undefined) {
        continue;
      }

      const lagMinutes =
        (occurredAt - createdAt) / (1000 * 60);

      if (lagMinutes < 0) {
        continue;
      }

      group.lags.push(lagMinutes);
      foundQualifyingEvent = true;
    }

    if (foundQualifyingEvent) {
      group.qualifyingTaskIds.add(input.taskId);
    }
  }

  return [...groups.entries()]
    .map(([taskTitle, group]) => ({
      taskTitle,
      taskCount: group.taskIds.size,
      qualifyingTaskCount: group.qualifyingTaskIds.size,
      qualifyingEventCount: group.lags.length,
      minimumLagMinutes:
        group.lags.length > 0
          ? Math.min(...group.lags)
          : undefined,
      maximumLagMinutes:
        group.lags.length > 0
          ? Math.max(...group.lags)
          : undefined,
    }))
    .sort((left, right) =>
      left.taskTitle.localeCompare(right.taskTitle),
    );
}
