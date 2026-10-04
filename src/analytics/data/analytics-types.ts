export type AnalyticsCommunicationChannel =
  | "email"
  | "text"
  | "phone"
  | "voicemail";

export type AnalyticsCommunicationDirection =
  | "inbound"
  | "outbound"
  | "unknown";

export type AnalyticsEvent = {
  timelineRecordId: string;
  sourceEventId: string;
  sourceFile: string | null;
  occurredAt: string;
  rawType: string;
  actor: string;
  actorType: string;
  category: string;
  channel: AnalyticsCommunicationChannel | null;
  direction: AnalyticsCommunicationDirection | null;
  details: string;
};
