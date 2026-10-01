import type {
  TekionTaskActionChannel,
} from "../../csv/task-action-semantics";
import type {
  TekionTaskCompletionMode,
} from "../../csv/task-completion-semantics";
import type {
  TimelineIdentityEvidenceStatus,
} from "../correlation/timeline-identity-evidence";
import type {
  TaskCommunicationWindowStatus,
} from "./task-communication-window";

export type TaskCommunicationEvidenceStatus =
  | "qualifying_outbound"
  | "outbound_channel_mismatch"
  | "inbound_only"
  | "no_communication_evidence"
  | "window_unavailable"
  | "window_invalid"
  | "not_evaluated";

export type TaskCompletionEvidence = {
  taskSourceRecordId: string;
  timelineSourceFile: string;
  identityStatus: TimelineIdentityEvidenceStatus;
  completionMode: TekionTaskCompletionMode;
  allowedChannels: TekionTaskActionChannel[];
  unknownActionTokens: string[];
  windowStatus: TaskCommunicationWindowStatus;
  communicationEvidenceStatus: TaskCommunicationEvidenceStatus;
  timelineEventIds: string[];
  communicationEventIds: string[];
  employeeOutboundEventIds: string[];
  allowedChannelEventIds: string[];
  mismatchedChannelEventIds: string[];
  inboundCommunicationEventIds: string[];
};
