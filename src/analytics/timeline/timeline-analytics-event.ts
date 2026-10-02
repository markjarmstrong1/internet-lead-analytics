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
  sourceFile: string | null;
  occurredAt: string;
  rawType: string;
  actor: string;
  actorType: string;
  category: string;
  channel: TimelineAnalyticsCommunicationChannel | null;
  direction: TimelineAnalyticsCommunicationDirection | null;
  details: string;
};
