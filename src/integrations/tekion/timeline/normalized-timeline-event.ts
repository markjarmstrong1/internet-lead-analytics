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

export type TekionActorType =
  | "employee"
  | "customer"
  | "system"
  | "automation"
  | "unknown";

export type TekionNormalizedTimelineEvent = TekionTimelineEvent & {
  sourceEventId: string;
  communicationChannel?: TekionCommunicationChannel;
  communicationDirection?: TekionCommunicationDirection;
  actorType: TekionActorType;
};
