import type { TekionTimelineEvent } from "./timeline-event";

export type TekionCommunicationChannel =
  | "email"
  | "text"
  | "phone"
  | "voicemail";

export type TekionCommunicationDirection =
  | "inbound"
  | "outbound"
  | "unknown";

export type TekionNormalizedTimelineEvent = TekionTimelineEvent & {
  communicationChannel?: TekionCommunicationChannel;
  communicationDirection?: TekionCommunicationDirection;
};
