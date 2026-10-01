import type { TekionTaskRecord } from "../../csv/task-record";
import {
  classifyTaskCompletion,
} from "../../csv/task-completion-semantics";
import {
  parseTaskAction,
} from "../../csv/task-action-semantics";
import {
  classifyActionEvidence,
} from "../action-evidence/classify-action-evidence";
import type {
  TekionNormalizedTimelineEvent,
} from "../normalized-timeline-event";
import type {
  TaskTimelineCorrelation,
} from "../correlation/task-timeline-correlation";
import {
  buildTaskCommunicationWindow,
  isEventWithinTaskWindow,
} from "./task-communication-window";
import type {
  TaskCompletionEvidence,
  TaskCommunicationEvidenceStatus,
} from "./task-completion-evidence";

export type BuildTaskCompletionEvidenceInput = {
  task: TekionTaskRecord;
  correlation: TaskTimelineCorrelation;
};

export function buildTaskCompletionEvidence(
  input: BuildTaskCompletionEvidenceInput,
  timelineEvents: TekionNormalizedTimelineEvent[],
): TaskCompletionEvidence {
  const { task, correlation } = input;
  const action = parseTaskAction(task.action);
  const completionMode = classifyTaskCompletion(task);
  const window = buildTaskCommunicationWindow(task);

  const attachedEventIds = new Set(
    correlation.timelineEventIds,
  );

  const attachedEvents = timelineEvents.filter((event) =>
    attachedEventIds.has(event.sourceEventId),
  );

  const base: TaskCompletionEvidence = {
    taskSourceRecordId: correlation.taskSourceRecordId,
    timelineSourceFile: correlation.timelineSourceFile,
    identityStatus: correlation.status,
    completionMode,
    allowedChannels: action.channels,
    unknownActionTokens: action.unknownTokens,
    windowStatus: window.status,
    communicationEvidenceStatus: "not_evaluated",
    timelineEventIds: attachedEvents.map(
      (event) => event.sourceEventId,
    ),
    communicationEventIds: [],
    employeeOutboundEventIds: [],
    allowedChannelEventIds: [],
    mismatchedChannelEventIds: [],
    inboundCommunicationEventIds: [],
  };

  if (correlation.status === "no_match") {
    return base;
  }

  if (
    completionMode !== "completed_automatically" &&
    completionMode !== "completed_manually"
  ) {
    return base;
  }

  if (window.status === "unavailable") {
    return {
      ...base,
      communicationEvidenceStatus: "window_unavailable",
    };
  }

  if (window.status === "invalid") {
    return {
      ...base,
      communicationEvidenceStatus: "window_invalid",
    };
  }

  const communicationEvents = attachedEvents.filter(
    (event) =>
      event.communicationChannel !== undefined &&
      isEventWithinTaskWindow(event.occurredAt, window),
  );

  const employeeOutboundEvents = communicationEvents.filter(
    (event) => {
      const evidence = classifyActionEvidence(event);

      return (
        evidence.qualifiesAsEmployeeAction &&
        evidence.channel !== undefined
      );
    },
  );

  const inboundEvents = communicationEvents.filter(
    (event) =>
      event.communicationDirection === "inbound",
  );

  const allowedChannelEvents = employeeOutboundEvents.filter(
    (event) =>
      event.communicationChannel !== undefined &&
      action.channels.includes(event.communicationChannel),
  );

  const mismatchedChannelEvents =
    employeeOutboundEvents.filter(
      (event) =>
        event.communicationChannel !== undefined &&
        !action.channels.includes(event.communicationChannel),
    );

  let communicationEvidenceStatus:
    | TaskCommunicationEvidenceStatus;

  if (allowedChannelEvents.length > 0) {
    communicationEvidenceStatus = "qualifying_outbound";
  } else if (employeeOutboundEvents.length > 0) {
    communicationEvidenceStatus =
      "outbound_channel_mismatch";
  } else if (inboundEvents.length > 0) {
    communicationEvidenceStatus = "inbound_only";
  } else {
    communicationEvidenceStatus =
      "no_communication_evidence";
  }

  return {
    ...base,
    communicationEvidenceStatus,
    communicationEventIds: communicationEvents.map(
      (event) => event.sourceEventId,
    ),
    employeeOutboundEventIds:
      employeeOutboundEvents.map(
        (event) => event.sourceEventId,
      ),
    allowedChannelEventIds:
      allowedChannelEvents.map(
        (event) => event.sourceEventId,
      ),
    mismatchedChannelEventIds:
      mismatchedChannelEvents.map(
        (event) => event.sourceEventId,
      ),
    inboundCommunicationEventIds:
      inboundEvents.map(
        (event) => event.sourceEventId,
      ),
  };
}
