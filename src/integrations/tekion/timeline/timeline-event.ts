export type TekionTimelineEventCategory =
  | "communication"
  | "task"
  | "lifecycle"
  | "assignment"
  | "vehicle"
  | "trade"
  | "deal"
  | "automation"
  | "note"
  | "visit"
  | "other";

export type TekionTimelineEvent = {
  sourceFile: string;
  rawType: string;
  occurredAt: string;
  actor: string;
  details: string;
  category: TekionTimelineEventCategory;
};
