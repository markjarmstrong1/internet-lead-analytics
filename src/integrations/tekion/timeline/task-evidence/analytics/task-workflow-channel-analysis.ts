import type { TekionTaskRecord } from "../../../csv/task-record";
import type { TekionNormalizedTimelineEvent } from "../../normalized-timeline-event";
import type { TaskCompletionEvidence } from "../task-completion-evidence";
import type { TekionTaskActionChannel } from "../../../csv/task-action-semantics";

export type TaskWorkflowChannelAnalysisInput = {
  taskId: string;
  task: TekionTaskRecord;
  evidence: TaskCompletionEvidence;
  timelineEvents: TekionNormalizedTimelineEvent[];
};

export type TaskWorkflowChannelAnalysis = {
  taskTitle: string;
  taskCount: number;
  comparisonCount: number;

  allowedEmailComparisons: number;
  allowedTextComparisons: number;
  allowedPhoneComparisons: number;

  observedEmailOutboundEvents: number;
  observedTextOutboundEvents: number;
  observedPhoneOutboundEvents: number;
  observedVoicemailOutboundEvents: number;

  allowedChannelEventCount: number;
  mismatchedChannelEventCount: number;

  uniqueQualifyingTaskIds: string[];
};

function countAllowedChannel(
  channels: TekionTaskActionChannel[],
  channel: TekionTaskActionChannel,
): number {
  return channels.includes(channel) ? 1 : 0;
}

export function analyzeTaskWorkflowChannels(
  inputs: TaskWorkflowChannelAnalysisInput[],
): TaskWorkflowChannelAnalysis[] {
  const groups = new Map<
    string,
    {
      taskIds: Set<string>;
      inputs: TaskWorkflowChannelAnalysisInput[];
    }
  >();

  for (const input of inputs) {
    const title = input.task.taskTitle.trim();
    const existing = groups.get(title);

    if (existing) {
      existing.taskIds.add(input.taskId);
      existing.inputs.push(input);
    } else {
      groups.set(title, {
        taskIds: new Set([input.taskId]),
        inputs: [input],
      });
    }
  }

  return [...groups.entries()]
    .map(([taskTitle, group]) => {
      const analysis: TaskWorkflowChannelAnalysis = {
        taskTitle,
        taskCount: group.taskIds.size,
        comparisonCount: group.inputs.length,

        allowedEmailComparisons: 0,
        allowedTextComparisons: 0,
        allowedPhoneComparisons: 0,

        observedEmailOutboundEvents: 0,
        observedTextOutboundEvents: 0,
        observedPhoneOutboundEvents: 0,
        observedVoicemailOutboundEvents: 0,

        allowedChannelEventCount: 0,
        mismatchedChannelEventCount: 0,

        uniqueQualifyingTaskIds: [],
      };

      const qualifyingTaskIds = new Set<string>();

      for (const input of group.inputs) {
        const evidence = input.evidence;

        analysis.allowedEmailComparisons += countAllowedChannel(
          evidence.allowedChannels,
          "email",
        );

        analysis.allowedTextComparisons += countAllowedChannel(
          evidence.allowedChannels,
          "text",
        );

        analysis.allowedPhoneComparisons += countAllowedChannel(
          evidence.allowedChannels,
          "phone",
        );

        analysis.allowedChannelEventCount +=
          evidence.allowedChannelEventIds.length;

        analysis.mismatchedChannelEventCount +=
          evidence.mismatchedChannelEventIds.length;

        const eventById = new Map(
          input.timelineEvents.map((event) => [
            event.sourceEventId,
            event,
          ]),
        );

        for (const eventId of evidence.employeeOutboundEventIds) {
          const event = eventById.get(eventId);

          if (!event?.communicationChannel) {
            continue;
          }

          switch (event.communicationChannel) {
            case "email":
              analysis.observedEmailOutboundEvents += 1;
              break;
            case "text":
              analysis.observedTextOutboundEvents += 1;
              break;
            case "phone":
              analysis.observedPhoneOutboundEvents += 1;
              break;
            case "voicemail":
              analysis.observedVoicemailOutboundEvents += 1;
              break;
          }
        }

        if (evidence.communicationEvidenceStatus === "qualifying_outbound") {
          qualifyingTaskIds.add(input.taskId);
        }
      }

      analysis.uniqueQualifyingTaskIds = [
        ...qualifyingTaskIds,
      ].sort();

      return analysis;
    })
    .sort((left, right) =>
      left.taskTitle.localeCompare(right.taskTitle),
    );
}
