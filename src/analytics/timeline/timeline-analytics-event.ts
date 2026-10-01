export type TimelineAnalyticsCommunicationChannel =
  | "email"
  | "text"
  | "phone"
  | "voicemail";

export type TimelineAnalyticsCommunicationDirection =
  | "inbound"
  | "outbound"
  | "unknown";

export type TimelineAnalyticsEvent = {
  timelineRecordId: string;
  sourceEventId: string;
  occurredAt: string;
  category: string;
  actorType: string;
  channel: TimelineAnalyticsCommunicationChannel | null;
  direction: TimelineAnalyticsCommunicationDirection | null;
};
